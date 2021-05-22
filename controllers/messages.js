const Group = require("../models/group");
const { GroupMessage } = require("../models/groupMessage");
const { Message } = require("../models/message");
const { Users } = require("../models/users");
const mongoose = require("mongoose");

const sendMessageToGroup = async (text, user, groupId, tagged) => {
  [user, groupId, tagged] = [user, groupId, tagged].map((item) =>
    mongoose.Types.ObjectId(item)
  );
  const gm = new GroupMessage({
    text,
    user,
    groupId,
    tagged,
  });
  const res = await Group.updateOne(
    { _id: groupId },
    { $push: { messages: gm._id } }
  )
    .then((res) => res)
    .catch((err) => ({ err }));
  if (res.err) return false;
  await gm.save();
  return gm;
};

const addMessage = async (from, to, message) => {
  const res = await Users.findOne({ _id: from }).then((user) => {
    var flag = true;
    user.chat = user.chat.map((msg) => {
      if (msg.to == to) {
        flag = false;
        msg.messages = [...msg.messages, message._id];
      }
      return msg;
    });
    if (flag) {
      user.chat = [
        ...user.chat,
        { to: mongoose.Types.ObjectId(to), messages: [message._id] },
      ];
    }
    return user
      .save()
      .then((res) => res)
      .catch((err) => ({ err }));
  });
  if (res.err) return false;
  return true;
};

const sendMessageToUser = async (text, from, to, tagged) => {
  [from, to, tagged] = [from, to, tagged].map((item) =>
    mongoose.Types.ObjectId(item)
  );
  const msg = new Message({
    text,
    from,
    to,
    tagged,
  });
  const res =
    (await addMessage(to, from, msg)) && (await addMessage(from, to, msg));
  await msg.save();
  return msg;
};

module.exports = {
  sendMessageToGroup,
  sendMessageToUser,
};
