const Group = require("../models/group");

const getGroupMembers = async (groupId) => {
  return await Group.findOne({ _id: groupId }).then((res) => res.members);
};

module.exports = { getGroupMembers };
