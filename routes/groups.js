const router = require("express").Router();
const { Types } = require("mongoose");
const { verifyUser } = require("../authenticate");
const Group = require("../models/group");
const { Users } = require("../models/users");

router.post("/create", verifyUser, async (req, res, next) => {
  const { name } = req.body;
  const userId = req.user._id;
  const group = new Group({
    name,
    members: [userId],
    admins: [userId],
    createdBy: userId,
  });
  await group.save();
  const resp = Users.findOne({ _id: req.user._id }).then(async (user) => {
    user.groups = [...user.groups, group._id];
    return await user.save().then((res) => res);
  });
  if (resp.err) res.status(500);
  else res.send({ success: true });
});

router.post("/add-admins", verifyUser, async (req, res, next) => {
  let { admins, groupId } = req.body;
  admins = admins.map((admin) => Types.ObjectId(admin));
  await Group.updateOne(
    { _id: groupId },
    { $push: { admins: { $each: admins } } }
  );
  res.send({ success: true });
});

router.post("/add", verifyUser, async (req, res) => {
  await Users.updateMany(
    { _id: { $in: req.body.users } },
    { $push: { groups: Types.ObjectId(req.body.groupId) } }
  );
  await Group.updateOne(
    { _id: req.body.groupId },
    {
      $push: {
        members: {
          $each: req.body.users.filter((user) => Types.ObjectId(user)),
        },
      },
    }
  );
  res.send({ success: true });
});

router.delete("/leave", verifyUser, async (req, res) => {
  await Users.updateOne(
    { _id: req.user._id },
    { $pull: { groups: Types.ObjectId(req.body.groupId) } }
  );
  await Group.updateOne(
    { _id: req.body.groupId },
    {
      $pull: {
        members: req.user._id,
        admins: req.user._id,
      },
    }
  );
  res.send({ success: true });
});

module.exports = router;
