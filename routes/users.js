const passport = require("passport");
const { verifyUser, verifyAdmin, getToken } = require("../authenticate");
const Users = require("../models/users");
const router = require("express").Router();

router.get("/", verifyUser, verifyAdmin, (req, res, next) => {
  Users.find({ admin: false })
    .then((users) => res.status(200).json(users))
    .catch((err) => res.json(err));
});

router.post("/login", passport.authenticate("local"), (req, res, next) => {
  const token = getToken({ _id: req.user._id });
  res.status(200).json({ success: true, token });
});

router.post("/signup", (req, res, next) => {
  Users.register(
    {
      username: req.body.username,
    },
    req.body.password,
    (err, user) => {
      if (err) {
        res.status(500).json(err);
      } else {
        passport.authenticate("local")(req, res, () => {
          const token = getToken({ _id: user._id });
          res.status(200).json({ success: true, token });
        });
      }
    }
  );
});

module.exports = router;
