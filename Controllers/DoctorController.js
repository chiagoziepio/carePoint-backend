const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  PatientModel,
  DoctorModel,
  AppointmentModel,
} = require("../models/Schemas");

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

const handleClearDocNotification = async (req, res) => {
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
    const findDoc = await DoctorModel.findOne({ email });
    if (!findDoc)
      return res.status(400).json({ status: false, msg: "No user found" });
    const updatedDoc = await DoctorModel.findOneAndUpdate(
      { _id: findDoc._id },
      { $pull: { notifications: { _id: _id } } },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: true, notifications: updatedDoc.notifications });
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

const handleUpdateDocDetails = async (req, res) => {
  const authHeader = req.headers.authorization;
  const Accesstoken = authHeader ? authHeader.split(" ")[1] : null;
  const { email, phone, address, des } = req.body;
  try {
    if (!Accesstoken)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(Accesstoken, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const DocEmail = decoded.email;
    const findDoc = await DoctorModel.findOne({ email: DocEmail });
    if (!findDoc)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (email && email !== findDoc.email) {
      const checkEmail = await DoctorModel.findOne({ email });
      if (checkEmail) {
        return res
          .status(403)
          .json({ status: false, msg: "Email already taken" });
      }
    }

    const updatedDoc = await DoctorModel.findByIdAndUpdate(
      { _id: findDoc._id },
      {
        $set: {
          des: des ? des : "",
          email,
          phone: +phone,
          address: address ? address : "",
        },
      },
      { new: true }
    );

    const token = jwt.sign(
      { email: updatedDoc.email },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "3h" }
    );
    return res.status(200).json({
      status: true,
      msg: "details updated",
      user: updatedDoc,
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
    const findDoc = await DoctorModel.findOne({ email });
    if (!findDoc)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (!_id)
      return res.status(400).json({ status: false, msg: "No id passed" });

    const appointments = await AppointmentModel.find({ doctorId: _id });
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.status !== "rejected"
    );
    return res.status(200).json({ status: true, data: filteredAppointments });
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

const handleUpdateDocAppointment = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { term, _id, rejectionReason } = req.body;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });

    const email = decoded.email;
    const findDoc = await DoctorModel.findOne({ email });

    if (!findDoc)
      return res.status(404).json({ status: false, msg: "account not found" });

    if (!_id || !term)
      return res
        .status(400)
        .json({ status: false, msg: "provide necessary details" });

    const findAppointment = await AppointmentModel.findById(_id);

    if (
      !findAppointment ||
      findAppointment.doctorId.toString() !== findDoc._id.toString()
    )
      return res.status(403).json({ status: false, msg: "Action not allowed" });

    // if (term === "reject") {
    //   await AppointmentModel.findByIdAndDelete(_id);
    //   const PatientNotification = {
    //     notificationType: "Appointment",
    //     text: `Your ${findAppointment.appointementService} with ${findDoc.fullname} has been rejected.`,
    //   };

    //   await PatientModel.findByIdAndUpdate(
    //     findAppointment.patientId,
    //     { $push: { notifications: PatientNotification } },
    //     { new: true }
    //   );

    //   const appointments = await AppointmentModel.find({
    //     doctorId: findDoc._id,
    //   });
    //   return res.status(202).json({
    //     status: true,
    //     data: appointments,
    //     msg: "Appointment rejected and deleted",
    //   });
    // }
    console.log(rejectionReason);
    if (term === "rejected" && !rejectionReason) {
      return res.status(400).json({
        status: false,
        msg: "rejection reason is required when rejecting an appointment",
      });
    }

    await AppointmentModel.findByIdAndUpdate(
      _id,
      {
        $set: {
          status: term,
          rejection_reason: rejectionReason,
        },
      },
      { new: true }
    );

    const PatientNotification = {
      notificationType: "Appointment",
      text: `Your ${findAppointment.appointementService} with ${findDoc.fullname} has been ${term}.`,
    };

    await PatientModel.findByIdAndUpdate(
      findAppointment.patientId,
      { $push: { notifications: PatientNotification } },
      { new: true }
    );

    const appointments = await AppointmentModel.find({ doctorId: findDoc._id });
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.status !== "rejected"
    );
    return res.status(202).json({
      status: true,
      data: filteredAppointments,
      msg: "Appointment status updated",
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
const handleGetDocNotification = async (req, res) => {
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
    const findDoc = await DoctorModel.findOne({ email });
    if (!findDoc)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (!_id)
      return res.status(400).json({ status: false, msg: "No id passed" });
    const notifications = await DoctorModel.findById(_id);
    return res
      .status(200)
      .json({ status: true, data: notifications.notifications });
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

const handleReadNotificatioon = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { notificationIds } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findDoc = await DoctorModel.findOne({ email });
    if (!findDoc)
      return res.status(404).json({ status: false, msg: "account not found" });
    if (!notificationIds)
      return res.status(400).json({ status: false, msg: "No id passed" });
    findDoc.notifications.forEach((notification) => {
      if (notificationIds.includes(notification._id.toString())) {
        notification.isRead = true;
      }
    });

    await findDoc.save();
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
  handleDoctorLogin,
  handleDocLogout,
  handlefirsttimePwdChange,
  handleClearDocNotification,
  handleUpdateDocDetails,
  handleGetAppointment,
  handleUpdateDocAppointment,
  handleGetDocNotification,
  handleReadNotificatioon,
};
