const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tagged: {
      type: mongoose.Types.ObjectId,
      ref: "GroupMessage",
      required: false,
    },
    group: {
      type: mongoose.Types.ObjectId,
      ref: "Group",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  groupMessageSchema,
  GroupMessage: mongoose.model("GroupMessage", groupMessageSchema),
};
