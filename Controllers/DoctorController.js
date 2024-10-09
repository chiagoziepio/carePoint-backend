const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PatientModel, DoctorModel } = require("../models/Schemas");

const handleDoctorLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ status: false, msg: "provide all details" });
  try {
    const findDoctor = await DoctorModel.findOne({ email });
    if (!findDoctor)
      return res
        .status(404)
        .json({ status: false, msg: "Email not registered" });
    const comparePwd = await bcrypt.compare(password, findDoctor.password);
    if (!comparePwd)
      return res.status(400).json({ status: true, msg: "incorrect password" });

    const AccessToken = jwt.sign(
      { email: findDoctor.email },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "3h" }
    );
    return res.status(200).json({
      status: true,
      msg: "successfully logged in",
      token: AccessToken,
      user: findDoctor,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handleDocLogout = async (req, res) => {
  const { _id } = req.body;
  if (!_id) return res.status(400).json({ status: false, msg: "No id passed" });

  try {
    const findDoctor = await DoctorModel.findById(_id);
    if (!findDoctor)
      return res.status(404).json({ status: false, msg: "Invalid Id" });
    return res.status(200).json({ status: true, token: null, doctor: null });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handlefirsttimePwdChange = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  const { password } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: false, msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findDoctor = await DoctorModel.findOne({ email });
    if (!findDoctor)
      return res.status(400).json({ status: false, msg: "Account not found" });
    const hashPwd = await bcrypt.hash(password, 10);
    const updateDoctor = await DoctorModel.findOneAndUpdate(
      { _id: findDoctor._id },
      {
        $set: {
          password: hashPwd,
          firstTimeLogin: false,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: true, user: updateDoctor, msg: "password changed" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

module.exports = {
  handleDoctorLogin,
  handleDocLogout,
  handlefirsttimePwdChange,
};
