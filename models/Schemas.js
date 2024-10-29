const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
  notificationType: {
    type: String,
  },
  text: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
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
  phone: {
    type: Number,
    required: true,
  },
  pic: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
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
    default: "pending",
  },
  rejection_reason: {
    type: String,
    default: "",
  },
  appointmentDate: {
    type: String,
  },
  appointmentTime: {
    type: String,
  },
  fee: {
    type: Number,
  },
  appointementService: {
    type: String,
  },
  appointementTerm: {
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
  status: {
    type: String,
    default: "Available",
  },
  qualification: {
    type: String,
  },
  specialty: [
    {
      type: String,
    },
  ],
  service_fees: [
    {
      term: { type: String, required: true },
      fees: {
        consulting: { type: Number, required: true },
        treatment: { type: Number, required: true },
      },
    },
  ],
  doctorPic: {
    type: String,
    default: "",
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
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  registeredBy: {
    type: String,
  },
  registerAt: {
    type: Date,
    default: Date.now,
  },
  firstTimeLogin: {
    type: Boolean,
    default: true,
  },
});

patientSchema.set("toJSON", {
  transform: (doc, ret, options) => {
    delete ret.password;
    return ret;
  },
});
doctorSchema.set("toJSON", {
  transform: (doc, ret, options) => {
    delete ret.password;
    return ret;
  },
});
const PatientModel = mongoose.model("patient", patientSchema);
const DoctorModel = mongoose.model("doctor", doctorSchema);
const AppointmentModel = mongoose.model("appointment", appointmentSchema);

module.exports = { PatientModel, DoctorModel, AppointmentModel };
