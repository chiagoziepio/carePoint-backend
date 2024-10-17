const express = require("express");
const router = express.Router();
const {
  handleDoctorLogin,
  handleDocLogout,
  handlefirsttimePwdChange,
  handleClearDocNotification,
  handleUpdateDocDetails,
  handleGetAppointment,
} = require("../../Controllers/DoctorController");

router.post("/login", handleDoctorLogin);
router.post("/logout", handleDocLogout);
router.post("/firtspasswordchange", handlefirsttimePwdChange);
router.delete("/clearnotification", handleClearDocNotification);
router.patch("/updatedocdetail", handleUpdateDocDetails);
router.get("/getdoctorappointment/:_id", handleGetAppointment);

module.exports = router;
