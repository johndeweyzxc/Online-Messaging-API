const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({origin: "*"}));
const Pusher = require("pusher");
const {v4: uuidv4} = require("uuid");

const pusher = new Pusher({
  appId: "1499632",
  key: "1c2c583c23fe80bf1db8",
  secret: "b8de624ddf51a4fe12d9",
  cluster: "ap1",
  useTLS: true,
});

const Activities = ["joined", "left", "sent"];
const ActivityLog = [];

app.post("/", (req, res) => {
  const name = req.body.UserName;
  const activity = req.body.Activity;

  if (name === null) {
    return res.status(400).json({Error: "Name is null"});
  } else if (name === "" || name.includes(" ")) {
    return res.status(400).json({Error: "Name has whitespaces or is empty"});
  }

  if (!Activities.includes(activity)) {
    return res.status(400).json({Error: "Invalid activity type"});
  }

  let message = `${name} has ${activity} the server.`;
  let record = {id: uuidv4(), logMessage: message};

  console.log(message);
  ActivityLog.push(record);

  // Broadcast the activity to all connected clients
  pusher.trigger("my-channel", "my-event", {
    content: activity,
    logUpdate: record,
  });

  return res.status(201).json({Logs: ActivityLog});
});

app.listen(4000, () => {
  console.log("Server started listening at PORT 4000");
});
