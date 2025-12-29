const jwt = require("jsonwebtoken");
const User = require("../models/users/user");

exports.protect = async (req, res, next) => {
  try {
    let token;
    const { authorization } = req.headers;

    if (authorization && authorization.startsWith("Bearer")) {
      token = authorization.split(" ")[1];
    } else {
      return res.status(401).json({
        status: false,
        message: "Authentication failed! No token provided",
      });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.id) {
      const user = await User.findOne({ _id: decoded.id });
      if (!!user) {
        res.locals.user = {
          id: user._id,
          role: user.user_type,
          email: user.email,
        };
        next();
      } else {
        res.status(404).json({
          status: "Authentication failed! User not found",
        });
      }
    }
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed!",
      status: false,
      error,
    });
  }
};
