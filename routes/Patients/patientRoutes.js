const express = require("express");
const router = express.Router();
const {
  handlePatientsRegisteration,
  handlePatientLogin,
  handlePatientLogout,
  handleGetDoc,
  handleNBookAppointment,
  handleGetAppointment,
  handleUUpdatePatientDetails,
  handlePatientPicUpdate,
} = require("../../Controllers/PatientControllers");
const upload = require("../../Config/multer");

router.post("/register", handlePatientsRegisteration);
router.post("/login", handlePatientLogin);
router.post("/logout", handlePatientLogout);
router.get("/getdoctor/:_id", handleGetDoc);
router.post("/book-appointment", handleNBookAppointment);
router.get("/get-appointment/:_id", handleGetAppointment);
router.patch("/updatepatient", handleUUpdatePatientDetails);
router.patch("/updatepic", upload.single("files"), handlePatientPicUpdate);

module.exports = router;
