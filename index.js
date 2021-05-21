const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const path = require("path");
const userRouter = require("./routes/users");

dotenv.config();
const app = express();
const server = require("http").createServer(app);
const socketio = require("socket.io");
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
  .then((db) => {
    console.log("Connected to the database");
  })
  .catch((err) => console.log(err));

io.use(passport.initialize());

io.on("connection", (socket) => {
  console.log("A user has been connected");
  socket.on("text message", (msg) => {
    console.log("The message is", msg);
    socket.broadcast.emit("incomming message", { msg });
  });
  socket.on("disconnect", () => {
    io.emit("incomming message", { msg: "A user has been dissconnected" });
  });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));
app.use(cors());
app.use(passport.initialize());

app.use("/users", userRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Listening on port: " + PORT));

module.exports = io;
