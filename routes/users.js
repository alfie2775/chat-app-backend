const passport = require("passport");
const { verifyUser, verifyAdmin, getToken } = require("../authenticate");
const { Users } = require("../models/users");
const router = require("express").Router();
const mongoose = require("mongoose");

router.get("/", verifyUser, verifyAdmin, (req, res, next) => {
  Users.find({ admin: false })
    .populate("groups")
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
  if (req.user.friends.find((id) => id == req.body.addId)) {
    res.send({ success: false, err: "Already friend" });
    return;
  }
  Users.updateOne(
    { _id: req.user._id },
    {
      $push: { friends: mongoose.Types.ObjectId(req.body.addId) },
      $pull: { incomingReq: req.body.addId },
    }
  )
    .then(() => {
      Users.updateOne(
        { _id: req.body.addId },
        {
          $push: { friends: req.user._id },
          $pull: { incomingReq: req.user._id },
        }
      )
        .then(() => res.send({ success: true }))
        .catch((err) => res.status(500).send({ ...err, success: false }));
    })
    .catch((err) => res.status(500).send({ ...err, success: false }));
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

router.get("/userinfo", verifyUser, (req, res, next) => {
  Users.findOne({ _id: req.user._id })
    .populate({
      path: "groups chat friends incomingReq",
      populate: [
        {
          path: "messages members admins createdBy",
          populate: [
            {
              path: "user text",
            },
          ],
        },
        {
          path: "messages to",
        },
      ],
    })
    .then((user) => res.send({ user }))
    .catch((err) => res.send({ success: false, err }));
});

module.exports = router;
