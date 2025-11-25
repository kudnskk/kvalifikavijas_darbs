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
    console.log(`Token expires at: ${new Date(decoded.exp * 1000).toISOString()}`);

    return token;
};



exports.login = async (req, res) => {
    try {
        let { password, email, remember_me} = req.body;
        const user = await User.findOne({
           email: email 
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
                msg: 'Login successful',
                status: true,
                token,
            });
        } else {
            return res.status(401).send({
                status: false,
                msg: 'Invalid login or password'
            });
        }
    } catch {
        return res.status(500).send({
            error: false,
            msg: 'Server failed'
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

        return res.status(200).json({ status: true});
    } catch {
        return res.status(401).json({ status: false, message: "Invalid token" });
    }
};
