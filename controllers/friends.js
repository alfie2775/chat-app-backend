const { Types } = require("mongoose");
const { Users } = require("../models/users");

const sendFriendRequest = async (to, from) => {
  const res = await Users.updateOne(
    { _id: to },
    { $push: { incomingReq: Types.ObjectId(from) } }
  )
    .then((res) => res)
    .catch((err) => ({ err }));
  if (res.err) return false;
  return await Users.findOne({ _id: from });
};

module.exports = {
  sendFriendRequest,
};
