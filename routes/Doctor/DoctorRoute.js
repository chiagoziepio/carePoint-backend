const express = require("express");
const router = express.Router();
const {
  handleDoctorLogin,
  handleDocLogout,
  handlefirsttimePwdChange,
  handleClearDocNotification,
  handleUpdateDocDetails,
  handleGetAppointment,
  handleUpdateDocAppointment,
  handleGetDocNotification,
} = require("../../Controllers/DoctorController");

router.post("/login", handleDoctorLogin);
router.post("/logout", handleDocLogout);
router.post("/firtspasswordchange", handlefirsttimePwdChange);
router.delete("/clearnotification", handleClearDocNotification);
router.patch("/updatedocdetail", handleUpdateDocDetails);
router.get("/getdoctorappointment/:_id", handleGetAppointment);
router.patch("/update-appointment", handleUpdateDocAppointment);
router.get("/get-notification/:_id", handleGetDocNotification);

module.exports = router;
