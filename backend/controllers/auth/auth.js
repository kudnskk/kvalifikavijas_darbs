const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/users/user");

const signToken = async (id, remember_me) => {
  let token;

  if (remember_me === true) {
    token = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE_IN_REMEMBER_ME,
    });
  } else {
    token = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE_IN,
    });
  }

  // Log token expiration
  const decoded = jwt.decode(token);
  console.log(
    `Token expires at: ${new Date(decoded.exp * 1000).toISOString()}`,
  );

  return token;
};

exports.login = async (req, res) => {
  try {
    let { password, email, remember_me } = req.body;
    const user = await User.findOne({
      email: email,
    });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found!", status: false });

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      let token = await signToken(user._id, remember_me);
      return res.status(200).send({
        error: false,
        msg: "Login successful",
        status: true,
        token,
      });
    } else {
      return res.status(401).send({
        status: false,
        msg: "Invalid login or password",
      });
    }
  } catch {
    return res.status(500).send({
      error: false,
      msg: "Server failed",
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, user_name } = req.body;

    //validate
    if (!email || !password || !user_name) {
      return res.status(400).json({
        status: false,
        message: "Username,Email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "User with this email already exists",
      });
    }
    if (password.length < 5) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 5 characters long",
      });
    }

    //hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //new usr creation
    const newUser = new User({
      email,
      password: hashedPassword,
      user_name: user_name,
    });

    await newUser.save();
    const token = await signToken(newUser._id, false); //token to be authed on the spot after registrations

    return res.status(201).json({
      status: true,
      message: "Registration successful!",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        user_name: newUser.user_name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({ status: true });
  } catch {
    return res.status(401).json({ status: false, message: "Invalid token" });
  }
};
