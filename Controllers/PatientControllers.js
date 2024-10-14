const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  PatientModel,
  DoctorModel,
  AppointmentModel,
} = require("../models/Schemas");

const handlePatientsRegisteration = async (req, res) => {
  const { email, fullname, password, phone, address, gender } = req.body;
  if (!email || !fullname || !password || !phone || !gender)
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
      phone: +phone,
      address,
      gender,
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
      user: findPatient,
    });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handlePatientLogout = async (req, res) => {
  const { _id } = req.body;
  if (!_id) return res.status(400).json({ status: false, msg: "No id passed" });

  try {
    const findPatient = await PatientModel.findById(_id);
    if (!findPatient)
      return res.status(404).json({ status: false, msg: "Invalid Id" });
    return res.status(200).json({ status: true, token: null, patient: null });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handleGetDoc = async (req, res) => {
  const { _id } = req.params;

  try {
    if (!_id)
      return res.status(400).json({ status: false, msg: "no id passed" });
    const findDoc = await DoctorModel.findById(_id);
    if (!findDoc)
      return res.status(404).json({ status: false, msg: "Doctor not found" });
    return res.status(200).json({ status: true, doctor: findDoc });
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

const handleNBookAppointment = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const {
    fee,
    appointementService,
    appointementTerm,
    appointmentDate,
    appointmentTime,
    doctorId,
    patientId,
  } = req.body;
  if (
    !fee ||
    !appointementService ||
    !appointementTerm ||
    !appointmentDate ||
    !appointmentTime ||
    !doctorId ||
    !patientId
  )
    return res.status(400).json({ status: false, msg: "fiil all blank" });

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient || findPatient._id === doctorId)
      return res.status(400).json({ status: false, msg: "action not allowed" });
    const findDoc = await DoctorModel.findById({ _id: doctorId });
    if (!findDoc)
      return res
        .status(404)
        .json({ status: false, msg: "Doctor's id is invalid" });

    const newappointment = new AppointmentModel({
      fee,
      appointementService,
      appointementTerm,
      appointmentDate,
      appointmentTime,
      doctorId,
      patientId: findPatient._id,
      patientName: findPatient.fullname,
      patientPic: findPatient.pic,
      doctorName: findDoc.fullname,
      doctorPic: findDoc.doctorPic,
    });

    await newappointment.save();
    const PatientNotification = {
      notificationType: "Appointment",
      text: `You booked a ${appointementService} appoitment  with ${findDoc.fullname}`,
    };
    const docNotification = {
      notificationType: "Appointment",
      text: `${findPatient.fullname} booked a ${appointementService} section with you`,
    };
    const updatePatient = await PatientModel.findByIdAndUpdate(
      { _id: findPatient._id },
      {
        $push: {
          notifications: PatientNotification,
        },
      },
      { new: true }
    );
    await DoctorModel.findByIdAndUpdate(
      { _id: findDoc._id },
      {
        $push: {
          notifications: docNotification,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: true, msg: "Appointment booked", user: updatePatient });
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

const handleGetAppointment = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { _id } = req.params;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (!_id)
      return res.status(400).json({ status: false, msg: "No id passed" });

    const appointments = await AppointmentModel.find({ patientId: _id });
    return res.status(200).json({ status: true, data: appointments });
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
  handlePatientsRegisteration,
  handlePatientLogin,
  handlePatientLogout,
  handleGetDoc,
  handleNBookAppointment,
  handleGetAppointment,
};
