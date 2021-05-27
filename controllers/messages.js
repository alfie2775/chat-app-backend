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
    group: groupId,
    tagged,
  });
  const res = await Group.updateOne(
    { _id: groupId },
    { $push: { messages: gm } }
  )
    .then((res) => res)
    .catch((err) => ({ err }));
  if (res.err) return false;
  return await gm
    .save()
    .then((gm) => gm.populate("user").execPopulate())
    .then((gm) => gm);
};

const addMessage = async (from, to, message) => {
  const res = await Users.findOne({ _id: from }).then((user) => {
    user.chat = user.chat.map((msg) => {
      if (msg.to.toString() == to.toString()) {
        msg.messages = [...msg.messages, message._id];
      }
      return msg;
    });
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
  await addMessage(to, from, msg);
  await addMessage(from, to, msg);
  await msg.save();
  return msg;
};

module.exports = {
  sendMessageToGroup,
  sendMessageToUser,
};
