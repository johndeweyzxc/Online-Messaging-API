const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors({origin: "*"}));
const {v4: uuidv4} = require("uuid");

// Format of each activity log = {name: name, id: logId, msg: logMsg}
// Format of each sent messages = {id: messageId, msg: message, creator: name}
let ActivityLog = [];
let SentMessages = [];

function validateString(value, strType) {
  let emptyError = {statusCode: 400, Error: "Empty or null string"};
  let success = {statusCode: 201, Message: true};

  if (value === null || value === "") {
    return emptyError;
  } else if (strType === "name" && value.includes(" ")) {
    return emptyError;
  } else if (strType === "msg") {
    // This checks if the message has no chars and only spaces.
    let removeSpaces = value.replace(" ", "");
    if (removeSpaces.length <= 1) {
      return emptyError;
    } else {
      return success;
    }
  } else {
    return success;
  }
}

// Fetching update from the server
app.post("/GetUpdates", (req, res) => {
  // The message and the activity is the lastest data the client has.
  const latestMsg = req.body.LatestMsgId;
  const latestActivity = req.body.LActivityId;
  let NewMsg;
  let NewActivities;

  if (latestMsg === "Empty") {
    NewMsg = SentMessages;
  }

  if (latestActivity === "Empty") {
    NewActivities = ActivityLog;
  }

  // Sync the data by creating a new array that starts base on the last
  // message and last activity of the client.

  if (NewMsg === undefined) {
    SentMessages.forEach((msg, index) => {
      if (msg.id === latestMsg) {
        NewMsg = SentMessages.slice(index);
        // Removes first element because this is the last data
        // from the client
        NewMsg.shift();
        return;
      }
    });
  }

  if (NewActivities === undefined) {
    ActivityLog.forEach((log, index) => {
      if (log.id === latestActivity) {
        NewActivities = ActivityLog.slice(index);
        // Removes first element because this is the last data
        // from the client
        NewActivities.shift();
        return;
      }
    });
  }

  if (NewMsg === undefined || NewActivities === undefined) {
    return res
      .statusCode(400)
      .json({Error: "Invalid activity id or message id"});
  }

  return res
    .statusCode(200)
    .json({ActivityLog: NewActivities, SentMessages: NewMsg});
});

// Receiving a message from the client
app.post("/SendMessage", (req, res) => {
  const name = req.body.UserName;
  const message = req.body.MessageContent;

  // Check the name for null value or empty string
  const validate = validateString(name, "name");
  if (validate.statusCode === 400) {
    return res.statusCode(400).json({Error: validate.Error});
  }

  // Check the message for null value or empty string
  const validateMsg = validateString(message, "msg");
  let logMsg = `${name} has sent a message.`;

  if (validateMsg.statusCode === 400) {
    return res.statusCode(400).json({Error: validateMsg.Error});
  } else {
    let messageId = uuidv4();
    let logId = uuidv4();

    let recordMessage = {id: messageId, msg: message, creator: name};
    let recordLog = {name: name, id: logId, msg: logMsg};
    console.log(`\n${JSON.stringify(recordLog)}\n`);

    ActivityLog.push(recordLog);
    SentMessages.push(recordMessage);

    return res
      .statusCode(201)
      .json({newMsg: recordMessage, newLogMsg: recordLog});
  }
});

// For joining the server
app.post("/Join", (req, res) => {
  const name = req.body.UserName;

  // Check the name for null value or empty string
  const validate = validateString(name, "name");
  if (validate.statusCode === 400) {
    return res.statusCode(400).json({Error: validate.Error});
  }

  let logMsg = `${name} has joined the server.`;
  let logId = uuidv4();

  let recordLog = {name: name, id: logId, msg: logMsg};
  console.log(`\n${JSON.stringify(recordLog)}\n`);

  ActivityLog.push(recordLog);

  return res
    .statusCode(201)
    .json({Name: name, ActivityLog: ActivityLog, SentMessages: SentMessages});
});

// This is for administrator purposes, this will flush or delete all
// activity logs and sent messages.
app.post("/Flush", (req, res) => {
  const AuthCode = req.body.AuthCode;
  const Password = process.env.Password;

  if (AuthCode === Password) {
    ActivityLog = [];
    SentMessages = [];
    return res
      .statusCode(201)
      .json({Message: "Successfully flushed activity logs and sent messages"});
  } else {
    return res.statusCode(400).json({Error: "Invalid authentication code"});
  }
});

app.listen(4000, () => {
  console.log("Server started listening at PORT 4000");
});
