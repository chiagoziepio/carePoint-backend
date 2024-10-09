const express = require("express");
const router = express.Router();
const {
  handleDoctorLogin,
  handleDocLogout,
  handlefirsttimePwdChange,
} = require("../../Controllers/DoctorController");

router.post("/login", handleDoctorLogin);
router.post("/logout", handleDocLogout);
router.post("/firtspasswordchange", handlefirsttimePwdChange);

module.exports = router;
