const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const chatSchema = new mongoose.Schema(
  {
    to: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    messages: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    firstname: String,
    lastname: String,
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    admin: {
      type: Boolean,
      default: false,
    },
    chat: [chatSchema],
    groups: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Group",
      },
    ],
    friends: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    incomingReq: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(passportLocalMongoose);

module.exports = { chatSchema, Users: mongoose.model("User", userSchema) };
