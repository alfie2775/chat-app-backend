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
  else res.send({ success: true, group });
});

router.post("/add-admin", verifyUser, async (req, res, next) => {
  let { admin, groupId } = req.body;
  admin = Types.ObjectId(admin);
  await Group.updateOne({ _id: groupId }, { $addToSet: { admins: admin } });
  res.send({ success: true });
});

router.post("/remove-admin", verifyUser, async (req, res) => {
  Group.updateOne(
    { _id: req.body.groupId },
    { $pull: { admins: req.body.admin } }
  )
    .then(() => res.send({ success: true }))
    .catch((err) => ({ err, success: false }));
});

router.post("/add", verifyUser, async (req, res) => {
  const userGroups = await Users.findOne({ _id: req.body.user }).then(
    (user) => user.groups
  );
  if (userGroups.find((group) => group.toString() == req.body.groupId)) {
    res.send({ success: false, err: "User is already in the group" });
    return;
  }
  await Users.updateOne(
    { _id: req.body.user },
    { $addToSet: { groups: Types.ObjectId(req.body.groupId) } }
  );
  await Group.updateOne(
    { _id: req.body.groupId },
    {
      $addToSet: {
        members: Types.ObjectId(req.body.user),
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

router.post("/remove-member", verifyUser, async (req, res, next) => {
  const group = await Group.findOne({ _id: req.body.groupId });
  if (
    group.admins.find((admin) => admin.toString() == req.user._id.toString())
  ) {
    (async (user) => {
      group.members.remove(user);
      await group.save();
      await Users.findOneAndUpdate(
        { _id: user },
        { $pull: { groups: Types.ObjectId(req.body.groupId) } }
      );
      res.send({ success: true });
    })(req.body.user);
  } else res.send({ err: "You are not admin" });
});

module.exports = router;
