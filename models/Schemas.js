const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  notificationType: {
    type: String,
  },
  text: {
    type: String,
  },
});

const patientSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unquie: true,
  },
  pic: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "user",
  },
  notifications: [notificationSchema],
  password: {
    type: String,
  },
});

const appointmentSchema = mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "patient",
  },
  status: {
    type: String,
    required: true,
    default: "",
  },
  appointmentDate: {
    type: Date,
  },
  fee: {
    type: Number,
  },
  appointementService: {
    type: String,
  },
  patientPic: {
    type: String,
  },
  doctorName: {
    type: String,
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "doctor",
  },
  doctorPic: {
    type: String,
  },
});

const doctorSchema = mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unquie: true,
  },
  specialty: [
    {
      type: String,
    },
  ],
  doctorPic: {
    type: String,
  },
  yearsInService: {
    type: Number,
  },
  notifications: [notificationSchema],
  role: {
    type: String,
    default: "doctor",
  },
  des: {
    type: String,
    required: true,
  },
});

const PatientModel = mongoose.model("patient", patientSchema);
const DoctorModel = mongoose.model("doctor", doctorSchema);
const AppointmentModel = mongoose.model("appointment", appointmentSchema);

module.exports = { PatientModel, DoctorModel, AppointmentModel };
