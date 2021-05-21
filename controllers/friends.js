const { Users } = require("../models/users");

const sendFriendRequest = async (to, from) => {
  const res = await Users.updateOne(
    { _id: to },
    { $push: { incomingReq: from } }
  )
    .then((res) => res)
    .catch((err) => ({ err }));
  if (res.err) return false;
  return true;
};

module.exports = {
  sendFriendRequest,
};
