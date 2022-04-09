import { NextApiRequest, NextApiResponse } from "next";
import { Duplex } from "stream";
import { v4 as uuid } from "uuid";
import WebSocket, { WebSocketServer } from "ws";

interface ISocket extends Duplex {
  server?: WebSocketServer;
}
type TUser = {};
type TSocketProtocol = string;

let webSocketServer: WebSocketServer;
const rooms: Map<TSocketProtocol, Map<WebSocket, TUser>> = new Map();

const onMessage = ({ target: socket, data }: WebSocket.MessageEvent) => {
  const messageData = {
    ...JSON.parse(data as any),
    id: uuid(),
    created: new Date(),
  };

  if (messageData.type === "newUser") {
    // Add or Create rooms including socket and user
    rooms.get(socket.protocol)?.set(socket, messageData.user) ??
      rooms.set(socket.protocol, new Map([[socket, messageData.user]]));

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
  console.log("Socket closed", socket);
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

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { server } = res.socket as ISocket;

  if (!!webSocketServer) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");

    // Create WebSocket server
    webSocketServer = new WebSocketServer({ noServer: true });

    // Emit connection event
    server?.on("upgrade", (req: any, socket: Duplex, head: any) => {
      console.log("upgrade", req.url);
      if (!req.url.includes("/_next/webpack-hmr")) {
        webSocketServer.handleUpgrade(req, socket, head, (ws) => {
          webSocketServer.emit("connection", ws, req);
        });
      }
    });

    // WebSocketServer listeners
    webSocketServer.addListener("connection", onConnection);
    webSocketServer.addListener("error", console.log);
    webSocketServer.addListener("close", console.log);
  }

  res.end();
};
