const express = require("express");
const router = express.Router();
const {
  handlePatientsRegisteration,
  handlePatientLogin,
  handlePatientLogout,
  handleGetDoc,
  handleNBookAppointment,
  handleGetAppointment,
} = require("../../Controllers/PatientControllers");

router.post("/register", handlePatientsRegisteration);
router.post("/login", handlePatientLogin);
router.post("/logout", handlePatientLogout);
router.get("/getdoctor/:_id", handleGetDoc);
router.post("/book-appointment", handleNBookAppointment);
router.get("/get-appointment/:_id", handleGetAppointment);

module.exports = router;
