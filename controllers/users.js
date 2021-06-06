const { Users } = require("../models/users");

const setOnline = async (userId, status) => {
  await Users.updateOne({ _id: userId }, { $st: { isOnline: status } }).catch(
    (err) => ({ err })
  );
};

module.exports = {
  setOnline,
};
