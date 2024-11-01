const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  PatientModel,
  DoctorModel,
  AppointmentModel,
} = require("../models/Schemas");
const uploadToCloudinary = require("../Config/cloudinaryConfig");
const nodemailer = require("nodemailer");

const handleCreateDoctor = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  const {
    fullname,
    phone,
    email,
    yearsInService,
    des,
    password,
    specialty,
    qualification,
    address,
    specialties,
  } = req.body;

  if (
    !fullname ||
    !phone ||
    !email ||
    !yearsInService ||
    !password ||
    !specialty ||
    !qualification ||
    !specialties
  )
    return res
      .status(400)
      .json({ status: false, msg: "provide neccesary details" });

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const adminEmail = decoded.email;
    const findUser = await PatientModel.findOne({ email: adminEmail });
    if (!findUser || findUser.role !== "admin")
      return res
        .status(401)
        .json({ status: false, msg: "Action not permitted" });

    const checkEmail = await DoctorModel.findOne({ email });
    if (checkEmail)
      return res
        .status(400)
        .json({ status: false, msg: "Email already taken" });

    const file = req.file;
    const parsedSpeciality = JSON.parse(specialty);
    let url;
    if (file) {
      const fileBuffer = req.file.buffer;
      const result = await uploadToCloudinary(fileBuffer);

      url = result;
    }
    const hashPwd = await bcrypt.hash(password, 10);
    const service_fees = specialties.map((specialty) => ({
      term: specialty.term,
      fees: {
        consulting: specialty.consulting,
        treatment: specialty.treatment,
      },
    }));
    const newDoc = new DoctorModel({
      fullname,
      email,
      phone: +phone,
      password: hashPwd,
      yearsInService: +yearsInService,
      qualification,
      service_fees,
      specialty: parsedSpeciality,
      doctorPic: file ? url.secure_url : "",
      address: address ? address : "",
      des: des ? des : "",
      registeredBy: findUser.email,
    });

    await newDoc.save();
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSKEY,
      },
    });
    let mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "CarePoint Account Creation",
      text: `An Account has been created for you.\n\n
        Your credentials are : \n Email : ${email} \n Password : ${password} \n 
         click on the link below to login to your account \n https://care-point-two.vercel.app/`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return;
      }
      //console.log("Email sent: " + info.response);
    });
    return res
      .status(201)
      .json({ status: true, msg: "Doctor created successfully" });
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

const handleGetAllDoc = async (req, res) => {
  try {
    const docs = await DoctorModel.find();
    const allDoctor = docs.map((doc) => {
      const docObject = doc.toObject();
      delete docObject.password; // Remove password field
      return docObject;
    });
    return res.status(200).json({ status: true, doctors: allDoctor });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handleGetAllAppointments = async (req, res) => {
  try {
    const appointments = await AppointmentModel.find();
    return res.status(200).json({ status: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handleGetAllPatients = async (req, res) => {
  try {
    const patients = await PatientModel.find();
    return res.status(200).json({ status: true, data: patients });
  } catch (error) {
    return res.status(500).json({ status: false, msg: error.message });
  }
};

const handleAdminCancelAppointment = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { term, _id } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findUser = await PatientModel.findOne({ email });
    if (!findUser || findUser.role !== "admin")
      return res
        .status(401)
        .json({ status: false, msg: "Action not permitted" });
    const appointment = await AppointmentModel.findById(_id);
    if (!appointment)
      return res
        .status(404)
        .json({ status: false, msg: "Appointment not found" });
    if (!term)
      return res
        .status(400)
        .json({ status: false, msg: "Appointment update status is required" });

    if (term === "delete") {
      await AppointmentModel.findByIdAndDelete(_id);
      const otherAppointments = await AppointmentModel.find();
      return res.status(200).json({
        status: true,
        msg: "Appointment deleted successfully",
        data: otherAppointments,
      });
    }
    await AppointmentModel.findByIdAndUpdate(
      { _id },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );
    const patientNotification = {
      type: "Appointment",
      text: `Your ${appointment.appointementService} appointment with ${appointment.doctorName} has been cancelled by the Admin`,
    };
    const doctorNotification = {
      type: "Appointment",
      text: `Your ${appointment.appointementService} appointment with ${appointment.patientName} has been cancelled by the Admin`,
    };
    await PatientModel.findByIdAndUpdate(
      { _id: appointment.patientId },
      {
        $push: {
          notifications: patientNotification,
        },
      },
      { new: true }
    );
    await DoctorModel.findByIdAndUpdate(
      { _id: appointment.doctorId },
      {
        $push: {
          notifications: doctorNotification,
        },
      },
      { new: true }
    );
    const otherAppointments = await AppointmentModel.find();
    return res.status(202).json({
      status: true,
      msg: "Appointment cancelled successfully",
      data: otherAppointments,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      console.log(error);

      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

const handleDeactiveDoctor = async (req, res) => {
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
    const findUser = await PatientModel.findOne({ email });
    if (!findUser || findUser.role !== "admin")
      return res
        .status(401)
        .json({ status: false, msg: "Action not permitted" });
    const doctor = await DoctorModel.findById(_id);
    if (!doctor)
      return res.status(404).json({ status: false, msg: " Doctor not found" });
    await DoctorModel.findByIdAndUpdate(
      { _id: doctor._id },
      {
        $set: {
          status: "Deactivated",
        },
      },
      { new: true }
    );
    const otherDoctors = await DoctorModel.find();
    return res.status(202).json({
      status: true,
      msg: "Doctor deactivated successfully",
      data: otherDoctors,
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

const handleActivateDoc = async (req, res) => {
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
    const findUser = await PatientModel.findOne({ email });
    if (!findUser || findUser.role !== "admin")
      return res
        .status(401)
        .json({ status: false, msg: "Action not permitted" });
    const doctor = await DoctorModel.findById(_id);
    if (!doctor)
      return res.status(404).json({ status: false, msg: " Doctor not found" });
    await DoctorModel.findByIdAndUpdate(
      { _id: doctor._id },
      {
        $set: {
          status: "Available",
        },
      },
      { new: true }
    );
    const otherDoctors = await DoctorModel.find();
    return res.status(202).json({
      status: true,
      msg: "Doctor deactivated successfully",
      data: otherDoctors,
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

const handleTogglePatientStatus = async (req, res) => {
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
    const findUser = await PatientModel.findOne({ email });
    if (!findUser || findUser.role !== "admin")
      return res
        .status(401)
        .json({ status: false, msg: "Action not permitted" });
    const patient = await PatientModel.findById(_id);
    if (!patient)
      return res.status(404).json({ status: false, msg: " Patient not found" });
    if (!_id)
      return res.status(400).json({ status: false, msg: "No Id provided" });
    if (patient.status === "Active") {
      await PatientModel.findByIdAndUpdate(
        { _id: patient._id },
        {
          $set: {
            status: "Deactivated",
          },
        },
        { new: true }
      );
      const otherPatients = await PatientModel.find();
      return res.status(202).json({
        status: true,
        msg: "Patient deactivated successfully",
        data: otherPatients,
      });
    } else {
      await PatientModel.findByIdAndUpdate(
        { _id: patient._id },
        {
          $set: {
            status: "Active",
          },
        },
        { new: true }
      );
      const otherPatients = await PatientModel.find();
      return res.status(202).json({
        status: true,
        msg: "Patient activated successfully",
        data: otherPatients,
      });
    }
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
  handleCreateDoctor,
  handleGetAllDoc,
  handleGetAllAppointments,
  handleGetAllPatients,
  handleAdminCancelAppointment,
  handleDeactiveDoctor,
  handleActivateDoc,
  handleTogglePatientStatus,
};
