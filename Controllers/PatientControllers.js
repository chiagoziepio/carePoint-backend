const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const uploadToCloudinary = require("../Config/cloudinaryConfig");
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
    if (findPatient.status !== "Active")
      return res
        .status(401)
        .json({ status: false, msg: "You are suspended from the app" });
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

const handleUUpdatePatientDetails = async (req, res) => {
  const authHeader = req.headers.authorization;
  const Accesstoken = authHeader ? authHeader.split(" ")[1] : null;
  const { email, phone, address, fullname } = req.body;
  try {
    if (!Accesstoken)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(Accesstoken, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const Patientemail = decoded.email;
    const findPatient = await PatientModel.findOne({ email: Patientemail });
    if (!findPatient)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (email && email !== findPatient.email) {
      const checkEmail = await PatientModel.findOne({ email });
      if (checkEmail) {
        return res
          .status(403)
          .json({ status: false, msg: "Email already taken" });
      }
    }

    const updatedPatient = await PatientModel.findByIdAndUpdate(
      { _id: findPatient._id },
      {
        $set: {
          fullname: fullname,
          email,
          phone: +phone,
          address,
        },
      },
      { new: true }
    );

    await AppointmentModel.updateMany(
      { patientId: findPatient._id },
      {
        $set: {
          patientName: updatedPatient.fullname,
        },
      }
    );
    const token = jwt.sign(
      { email: updatedPatient.email },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "3h" }
    );
    return res.status(200).json({
      status: true,
      msg: "details updated",
      user: updatedPatient,
      token: token,
    });
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

const handlePatientPicUpdate = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const fileBuffer = req.file.buffer;
    const result = await uploadToCloudinary(fileBuffer);

    const updatedPatient = await PatientModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          pic: result.secure_url,
        },
      },
      { new: true }
    );

    await AppointmentModel.updateMany(
      { patientId: updatedPatient._id },
      {
        $set: {
          patientPic: updatedPatient.pic,
        },
      }
    );
    return res
      .status(200)
      .json({ status: true, user: updatedPatient, msg: "Picture Uploaded" });
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

const handleClearPatientNotification = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { _id } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!_id)
      return res
        .status(400)
        .json({ status: false, msg: "No notification id passed" });
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res.status(400).json({ status: false, msg: "No user found" });
    const updatedPatient = await PatientModel.findOneAndUpdate(
      { _id: findPatient._id },
      { $pull: { notifications: { _id: _id } } },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: true, notifications: updatedPatient.notifications });
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

const handleGetPatientNotifications = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res.status(400).json({ status: false, msg: "No user found" });
    return res
      .status(200)
      .json({ status: true, notifications: findPatient.notifications });
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

const handleCancelPatNotification = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { _id } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res.status(400).json({ status: false, msg: "No user found" });
    const appointment = await AppointmentModel.findById(_id);
    if (!_id || appointment.patientId.toString() !== findPatient._id.toString())
      return res
        .status(400)
        .json({ status: false, msg: "Invalid Appointment Id" });
    await AppointmentModel.findByIdAndDelete(_id);
    const docNotification = {
      notificationType: "Appointment",
      text: `${findPatient.fullname} cancelled ${appointment.appointementService} section with you`,
    };
    await DoctorModel.findByIdAndUpdate(
      { _id: appointment.doctorId },
      {
        $push: {
          notifications: docNotification,
        },
      },
      { new: true }
    );
    const updatedAppointments = await AppointmentModel.find({
      patientId: findPatient._id,
    });
    return res.status(202).json({
      status: true,
      data: updatedAppointments,
      msg: "Appointment cancelled",
    });
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

const handleMarkAsRead = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { notificationIds } = req.body;
  console.log(notificationIds);

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findPatient = await PatientModel.findOne({ email });
    if (!findPatient)
      return res.status(400).json({ status: false, msg: "No user found" });

    if (!notificationIds)
      return res.status(400).json({ status: false, msg: "No id passed" });
    findPatient.notifications.forEach((notification) => {
      if (notificationIds.includes(notification._id.toString())) {
        notification.isRead = true;
      }
    });

    await findPatient.save();
    return res.status(200);
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
  handleUUpdatePatientDetails,
  handlePatientPicUpdate,
  handleClearPatientNotification,
  handleGetPatientNotifications,
  handleCancelPatNotification,
  handleMarkAsRead,
};
