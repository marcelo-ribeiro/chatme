import { NextApiRequest, NextApiResponse } from "next";
import { Duplex } from "stream";
import { v4 as uuid } from "uuid";
import WebSocket, { WebSocketServer } from "ws";

type TUser = {};
type TRoom = string;
type TRooms = Map<TRoom, Map<WebSocket, TUser>>;

let rooms: TRooms = new Map();

const onMessage = ({ target: socket, data }: WebSocket.MessageEvent) => {
  const messageData = {
    ...JSON.parse(data as any),
    id: uuid(),
    created: new Date(),
  };

  if (messageData.type === "newUser") {
    // Add or Create rooms including socket and user
    rooms.get(socket.protocol)?.set(socket, messageData.user);

    // Send updateUsers to all sockets in room
    const sockets = rooms.get(socket.protocol);
    sockets!.forEach((user, socket) => {
      sendMessage(socket, messageData, false);
      sendMessage(
        socket,
        {
          type: "updateUsers",
          users: Array.from(sockets!.values()),
        },
        false
      );
    });
  } else {
    // Send message to all sockets in room
    const sockets = rooms.get(socket.protocol);
    sockets!.forEach((user, socket) => {
      sendMessage(socket, messageData, false);
    });
  }
};

const onClose = ({ target: socket }: WebSocket.CloseEvent) => {
  socket.terminate();
  // Remove socket from roomSockets
  rooms.get(socket.protocol)?.delete(socket);
};

const onConnection = (socket: WebSocket) => {
  socket.addEventListener("message", onMessage);
  socket.addEventListener("close", onClose, { once: true });
};

const sendMessage = (socket: WebSocket, messageData: any, binary: boolean) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(messageData), { binary });
  }
};

const createRoom = (): string => {
  const room = uuid();
  rooms.set(room, new Map());
  return room;
};

const hasRoom = (rooms: TRooms, protocol: TRoom): boolean => {
  return rooms.has(protocol);
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const { server } = res.socket as any;

  if (req.method === "POST") {
    const room = createRoom();
    server.rooms = rooms;

    res.status(200).json({
      success: true,
      room,
    });
  } else if (req.method === "GET") {
    const room = req.query.room as TRoom;

    if (!hasRoom(server.rooms, room)) {
      res.status(404).json({
        success: false,
        message: "Room not found.",
      });
    }

    rooms = server.rooms;

    if (!server?.wss) {
      // Create WebSocket server
      const wss = new WebSocketServer({ noServer: true });
      server.wss = wss;

      // Emit connection event
      server?.on("upgrade", (req: any, socket: Duplex, head: any) => {
        if (!req.url.includes("/_next/webpack-hmr")) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        }
      });

      // WebSocketServer listeners
      wss.addListener("connection", onConnection);
      wss.addListener("error", console.log);
      wss.addListener("close", console.log);
    }

    res.end();
  }
};
