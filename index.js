const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({origin: "*"}));

const webSocketServer = require("websocket").server;
const server = require("http").createServer(app);
server.listen(4001);
const wsServer = new webSocketServer({httpServer: server});

app.post("/", (req, res) => {
  const name = req.body.UserName;
  console.log(`User ${name} has joined the server.`);
  wsServer.broadcast(JSON.stringify({Content: "User name", message: name}));
  return res.status(201).json({Message: "Broadcasting your name"});
});

// Establish a web socket to send and receive data
wsServer.on("request", (request) => {
  const ip = request.remoteAddress;
  console.log(`Received a new web socket connection request from ${ip}`);
  let connection = request.accept(null, request.origin);
  console.log(`Connection from ${ip} accepted`);

  // Receive messages from the client
  connection.on("message", (msg) => {
    wsServer.broadcast(
      JSON.stringify({Content: "User message", message: msg.utf8Data})
    );
  });
});

app.listen(4000, () => {
  console.log("Server started listening at PORT 4000");
});
