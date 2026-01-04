const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/users/user");
const { sendEmail } = require("../../utils/emailSender");
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

  return token;
};

exports.login = async (req, res) => {
  try {
    let { password, email, remember_me } = req.body;
    const user = await User.findOne({
      email: email,
    });
    if (!user)
      return res.status(401).json({
        message:
          "The entered password or email is incorrect. Please try again!",
        status: false,
      });
    if (user.is_blocked)
      return res.status(401).json({
        message: "You are currently not allowed to sign in to the system!",
        status: false,
      });

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
        msg: "The entered password or email is incorrect. Please try again!",
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
        message: "Username, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "A user with this e-mail address is already registered! ",
      });
    }
    if (password.length < 5) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 5 characters long",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //new usr creation
    const newUser = new User({
      email,
      password: hashedPassword,
      user_name: user_name,
    });

    const emailVerifyToken = Math.floor(Math.random() * 10000);
    newUser.is_email_verified = false;
    newUser.email_verify_token = emailVerifyToken;
    const msg = {
      to: newUser.email,
      subject: "Verify your Email",
      html: `
      <p>Please verify your email by using this 4-digit code in the email verification form:</p>
      <p>${emailVerifyToken}</p>
    `,
      text: `Code: ${emailVerifyToken}`,
    };
    const result = await sendEmail(msg);

    if (!result.accepted || result.accepted.length === 0) {
      return res.status(500).json({
        status: false,
        message: "Error while sending email!",
      });
    }
    await newUser.save(); //save only after email is sent successfully
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

exports.verifyEmailCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid verification code" });
    }
    const userId = res.locals.user.id;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });
    if (user.is_email_verified) {
      return res
        .status(400)
        .json({ status: false, message: "Email already verified" });
    }
    if (String(code) != String(user.email_verify_token)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid verification code" });
    }
    user.is_email_verified = true;
    user.email_verify_token = undefined;
    await user.save();
    return res
      .status(200)
      .json({ status: true, message: "Email verified successfully" });
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, message: "Invalid or expired token" });
  }
};

exports.forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ status: false, message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });
    const resetToken = Math.floor(100000 + Math.random() * 900000); // 6-digit code
    user.password_reset_token = resetToken;
    user.password_reset_expires = Date.now() + 1000 * 60 * 15; // 15 min
    const result = await sendEmail({
      to: user.email,
      subject: "Password Reset Code",
      html: `<p>Your password reset code is: <b>${resetToken}</b></p>`,
      text: `Your password reset code is: ${resetToken}`,
    });

    if (!result.accepted || result.accepted.length === 0) {
      return res.status(500).json({
        status: false,
        message: "Error while sending email!",
      });
    }
    await user.save();

    return res
      .status(200)
      .json({ status: true, message: "Reset code sent to email" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

exports.comparePasswordToken = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res
        .status(400)
        .json({ status: false, message: "Email and code required" });
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });
    if (!user.password_reset_token || !user.password_reset_expires) {
      return res
        .status(400)
        .json({ status: false, message: "No reset token found" });
    }
    if (Date.now() > user.password_reset_expires) {
      return res
        .status(400)
        .json({ status: false, message: "Reset token expired" });
    }
    if (String(user.password_reset_token) !== String(code)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid reset code" });
    }
    return res.status(200).json({ status: true, userId: user._id });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password)
      return res
        .status(400)
        .json({ status: false, message: "User ID and password required" });
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: false, message: "User not found" });

    user.password = await bcrypt.hash(password, 10);
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();
    return res
      .status(200)
      .json({ status: true, message: "Password reset successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Server error", error: error.message });
  }
};
