const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PatientModel, DoctorModel } = require("../models/Schemas");

const handlePatientsRegisteration = async (req, res) => {
  const { email, fullname, password } = req.body;
  if (!email || !fullname || !password)
    return res.status(400).json({ status: false, msg: "provide all details" });

  try {
    const isEmialExsiting = await PatientModel.findOne({ email });
    if (isEmialExsiting)
      return res
        .status(400)
        .json({ status: false, msg: "Email already taken" });

    const hashPwd = await bcrypt.hash(password, 10);

    const newpatient = new PatientModel({
      fullname,
      password: hashPwd,
      email,
    });

    await newpatient.save();
    return res.status(201).json({ status: true, msg: "Patient created" });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handlePatientLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ status: false, msg: "provide all details" });
  try {
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res
        .status(404)
        .json({ status: false, msg: "Email not registered" });
    const comparePwd = await bcrypt.compare(password, findPatient.password);
    if (!comparePwd)
      return res.status(400).json({ status: true, msg: "incorrect password" });

    const AccessToken = jwt.sign(
      { email: findPatient.email },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "3h" }
    );
    return res.status(200).json({
      status: true,
      msg: "successfully logged in",
      token: AccessToken,
      patient: findPatient,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

module.exports = { handlePatientsRegisteration, handlePatientLogin };
