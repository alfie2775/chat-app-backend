const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const path = require("path");
const userRouter = require("./routes/users");
const groupRouter = require("./routes/groups");
// const testRouter = require("./routes/test");

dotenv.config();
const app = express();
const server = require("http").createServer(app);
const socketio = require("socket.io");
const {
  sendMessageToGroup,
  sendMessageToUser,
} = require("./controllers/messages");
const { sendFriendRequest } = require("./controllers/friends");
const { getGroupMembers } = require("./controllers/groups");
const { setOnline } = require("./controllers/users");
const io = new socketio.Server(server, {
  cors: {
    origin: "*",
  },
});

const client = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

client
  .then(async (db) => {
    console.log("Connected to the database");
  })
  .catch((err) => console.log(err));

var socketIds = {};
var idsToNames = {};
io.on("connection", async (socket) => {
  socketIds[socket.handshake.query.id] = socket.id;
  console.log(socket.handshake.query.id, "has been joined");
  idsToNames[socket.id] = socket.handshake.query.id;
  await setOnline(idsToNames[socket.id], true);
  socket.broadcast.emit("set online", { user: idsToNames[socket.id] });
  socket.on("group message", async ({ groupId, msg, tagged }) => {
    console.log(groupId, msg);
    const gm = await sendMessageToGroup(
      msg,
      idsToNames[socket.id],
      groupId,
      tagged
    );
    const groupMembers = await getGroupMembers(groupId);
    if (gm !== false)
      groupMembers.forEach((member) => {
        io.to(socketIds[member]).emit("incoming group message", gm);
      });
  });
  socket.on("personal message", async ({ msg, to, tagged }) => {
    const pm = await sendMessageToUser(msg, idsToNames[socket.id], to, tagged);
    if (pm !== false) {
      socket.to(socketIds[to]).emit("incoming personal message", pm);
      socket.emit("incoming personal message", pm);
    }
  });
  socket.on("send friend request", async ({ to }) => {
    let from = idsToNames[socket.id];
    console.log(from, to);
    const user = await sendFriendRequest(from, to);
    io.to(socketIds[to]).emit("incoming friend request", user);
  });
  socket.on("disconnecting", async () => {
    delete idsToNames[socketIds[socket.id]];
    delete socketIds[socket.id];
    console.log("a user is gonna fucked up");
    await setOnline(idsToNames[socket.id], false);
    socket.broadcast.emit("set offline", { user: idsToNames[socket.id] });
  });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));
app.use(cors());
app.use(passport.initialize());

app.use("/users", userRouter);
app.use("/groups", groupRouter);
// app.use("/test", testRouter);

const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, () => console.log("Listening on port: " + PORT));

module.exports = io;
