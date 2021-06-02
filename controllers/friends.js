const { Types } = require("mongoose");
const { Users } = require("../models/users");

const sendFriendRequest = async (from, to) => {
  console.log("came");
  const res = await Users.updateOne(
    { _id: to },
    { $addToSet: { incomingReq: Types.ObjectId(from) } }
  ).catch((err) => ({ err }));
  if (res.err) return false;
  return await Users.findOne({ _id: from });
};

module.exports = {
  sendFriendRequest,
};
