import { NextApiRequest, NextApiResponse } from "next";
import { Duplex } from "stream";
import { v4 as uuid } from "uuid";
import WebSocket, { WebSocketServer } from "ws";

type RoomId = string;
type Room = Map<WebSocket, TUser>;
type TRooms = Map<RoomId, Room>;
type TUser = {
  id: string;
  name: string;
  color: string;
};
type MessageData = {
  id: string;
  type: string;
  created: Date;
  message: string;
  user: TUser;
};

let rooms: TRooms = new Map();

const onMessage = ({ target: socket, data }: WebSocket.MessageEvent) => {
  const messageData = JSON.parse(data as any);
  const sockets = rooms.get(socket.protocol);

  if (messageData.type === "newUser") {
    // Create user
    const newUser: TUser = {
      id: uuid(),
      name: messageData.username,
      color: messageData.color,
    };
    // Add or Create rooms including socket and user
    sockets?.set(socket, newUser);
    console.log({ sockets });
    // Send newUser to owmer
    sendMessage(socket, {
      ...messageData,
      user: newUser,
    });
    // Send newUser to all other users
    broadcast(sockets!, {
      message: "User joined",
      user: newUser,
    });
    // Send updateUsers to all sockets in room
    broadcast(sockets!, {
      type: "updateUsers",
      users: Array.from(sockets!.values()),
    });
  } else {
    // Send message to all sockets in room
    broadcast(sockets!, messageData);
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

const sendMessage = (
  socket: WebSocket,
  messageData: any,
  binary: boolean = false
) => {
  messageData = {
    id: uuid(),
    type: "message",
    created: new Date(),
    ...messageData,
  };
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(messageData), { binary });
  }
};

const broadcast = (
  sockets: Room,
  messageData: any,
  binary: boolean = false
) => {
  sockets?.forEach((user, socket) => {
    sendMessage(socket, messageData, binary);
  });
};

const createRoom = (): string => {
  const room = uuid();
  rooms.set(room, new Map());
  return room;
};

const hasRoom = (rooms: TRooms, protocol: RoomId): boolean => {
  return rooms?.has(protocol);
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  const { server } = res.socket as any;
  console.log({ SERVER: server });

  if (req.method === "POST") {
    console.log("POST");

    const room = createRoom();
    server.rooms = rooms;

    res.status(200).json({
      success: true,
      room,
    });
  } else if (req.method === "GET") {
    const room = req.query.room as RoomId;

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
