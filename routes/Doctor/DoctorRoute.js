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
} = require("../../Controllers/DoctorController");

router.post("/login", handleDoctorLogin);
router.post("/logout", handleDocLogout);
router.post("/firtspasswordchange", handlefirsttimePwdChange);
router.delete("/clearnotification", handleClearDocNotification);
router.patch("/updatedocdetail", handleUpdateDocDetails);
router.get("/getdoctorappointment/:_id", handleGetAppointment);
router.patch("/update-appointment", handleUpdateDocAppointment);

module.exports = router;
