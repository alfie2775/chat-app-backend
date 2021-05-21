const mongoose = require("mongoose");
const { groupMessageSchema } = require("./groupMessage");

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  messages: [groupMessageSchema],
  admins: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Group", schema);
