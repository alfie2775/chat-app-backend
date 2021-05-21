const passport = require("passport");
const passportJwt = require("passport-jwt");
const passportLocal = require("passport-local");
const Users = require("./models/users");
const jwt = require("jsonwebtoken");
const LocalStrategy = passportLocal.Strategy;
const [JwtStrategy, ExtractJwt] = [
  passportJwt.Strategy,
  passportJwt.ExtractJwt,
];
require("dotenv").config();

passport.use(new LocalStrategy(Users.authenticate()));
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

module.exports.getToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {});
};

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwt_payload, done) => {
      Users.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) return done(err, false);
        else if (user) return done(null, user);
        else return done(null, false);
      });
    }
  )
);

module.exports.verifyUser = passport.authenticate("jwt", { session: false });

module.exports.verifyAdmin = (req, res, next) => {
  Users.findOne({ _id: req.user._id }).then((user) => {
    if (user.admin) {
      return next();
    }
    res.status(401).send("You are unauthorized");
  });
};
