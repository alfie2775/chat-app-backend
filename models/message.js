const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    from: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tagged: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  messageSchema,
  Message: mongoose.model("Message", messageSchema),
};
