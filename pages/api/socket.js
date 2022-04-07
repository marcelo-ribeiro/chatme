import WebSocket, { WebSocketServer } from "ws";

let wss;
const users = new Map();
const roomClients = new Map();

const setUser = (ws, user) => {
  users.set(ws, user);
  console.log("users", users);
};

const onConnection = (ws) => {
  ws.on("message", onMessage);
};

function onMessage(messageData, binary) {
  const ws = this;
  roomClients.get(ws.protocol)
    ? roomClients.get(ws.protocol).add(ws)
    : roomClients.set(ws.protocol, new Set([ws]));
  console.log("#roomClients", roomClients);

  [...roomClients.get(ws.protocol)].forEach((client) => {
    sendMessage(client, messageData, binary);
  });
}

const sendMessage = (ws, messageData, binary) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(messageData, { binary });
  }
};

const SocketHandler = async (req, res) => {
  if (res.socket.server.wss) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");

    // Create WebSocket server
    wss = new WebSocketServer({
      noServer: true,
    });
    res.socket.server.wss = wss;

    //
    res.socket.server.on("upgrade", (req, socket, head) => {
      console.log("upgrade", req.url);
      if (!req.url.includes("/_next/webpack-hmr")) {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      }
    });

    // On connection
    wss.on("connection", onConnection);
  }

  res.end();
};

export default SocketHandler;
