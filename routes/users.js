const passport = require("passport");
const { verifyUser, verifyAdmin, getToken } = require("../authenticate");
const { Users } = require("../models/users");
const router = require("express").Router();
const mongoose = require("mongoose");
const Group = require("../models/group");

router.get("/", verifyUser, verifyAdmin, (req, res, next) => {
  Users.find({ admin: false })
    .then((users) => res.status(200).json(users))
    .catch((err) => res.json(err));
});

router.post("/login", passport.authenticate("local"), (req, res, next) => {
  const token = getToken({ _id: req.user._id });
  res.status(200).json({ success: true, token, user: req.user });
});

router.post("/signup", (req, res, next) => {
  Users.register(
    {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
    },
    req.body.password,
    (err, user) => {
      if (err) {
        res.status(500).json(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          const token = getToken({ _id: user._id });
          res.status(200).json({ success: true, token, user: req.user });
        });
      }
    }
  );
});

router.post("/add-friend", verifyUser, (req, res, next) => {
  if (req.user.friends.find((id) => id.toString() == req.body.addId)) {
    res.send({ success: false, err: "Already friend" });
    return;
  }
  Users.findOneAndUpdate(
    { _id: req.user._id },
    {
      $push: { friends: mongoose.Types.ObjectId(req.body.addId) },
      $pull: { incomingReq: mongoose.Types.ObjectId(req.body.addId) },
    }
  )
    .then(async (user) => {
      if (
        user.chat.find((chat) => chat.to.toString() == req.body.addId) ==
        undefined
      ) {
        user.chat = [
          ...user.chat,
          { to: mongoose.Types.ObjectId(req.body.addId), messages: [] },
        ];
        await user.save();
      }
      Users.findOneAndUpdate(
        { _id: req.body.addId },
        {
          $push: { friends: mongoose.Types.ObjectId(req.user._id) },
          $pull: { incomingReq: mongoose.Types.ObjectId(req.user._id) },
        }
      )
        .then(async (user) => {
          if (
            user.chat.find(
              (chat) => chat.to.toString() == req.user._id.toString()
            ) == undefined
          ) {
            user.chat = [
              ...user.chat,
              { to: mongoose.Types.ObjectId(req.user._id), messages: [] },
            ];
            await user.save();
          }
          res.send({ success: true });
        })
        .catch((err) => res.status(500).send({ err, success: false }));
    })
    .catch((err) => res.status(500).send({ err, success: false }));
});

router.delete("/remove-friend", verifyUser, (req, res, next) => {
  Users.updateOne(
    { _id: req.user._id },
    { $pull: { friends: mongoose.Types.ObjectId(req.body.deleteId) } }
  )
    .then(() =>
      Users.updateOne(
        { _id: req.body.deleteId },
        { $pull: { friends: req.user._id } }
      )
        .then(() => res.send({ success: true }))
        .catch((err) => res.status(500).send({ ...err, success: false }))
    )
    .catch((err) => res.status(500).send({ ...err, success: false }));
});

router.get("/all-chats", verifyUser, async (req, res) => {
  const personal = await Users.findOne({ _id: req.user._id })
    .populate({
      path: "chat",
      populate: [
        {
          path: "to messages",
        },
      ],
    })
    .then((user) => user.chat || []);
  let groups = [
    ...(await Group.find({ _id: { $in: req.user.groups } })
      .populate({
        path: "messages members admins createdBy",
        populate: [
          {
            path: "user",
          },
        ],
      })
      .then((groups) => groups)),
  ];
  res.send([...personal, ...groups]);
});

router.get("/friends", verifyUser, async (req, res) => {
  const friends = await Users.findOne({ _id: req.user._id })
    .populate("friends")
    .then((friends) => friends.friends);
  res.send(friends);
});

router.get("/incoming-requests", verifyUser, async (req, res) => {
  const ir = await Users.findOne({ _id: req.user._id })
    .populate("incomingReq")
    .then((friends) => friends.incomingReq);
  res.send(ir);
});

module.exports = router;
