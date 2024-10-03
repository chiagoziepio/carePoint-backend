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

module.exports = { handlePatientsRegisteration };
