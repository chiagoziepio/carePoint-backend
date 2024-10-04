const express = require("express");
const router = express.Router();
const {
  handlePatientsRegisteration,
  handlePatientLogin,
  handlePatientLogout,
} = require("../../Controllers/PatientControllers");

router.post("/register", handlePatientsRegisteration);
router.post("/login", handlePatientLogin);
router.post("/logout", handlePatientLogout);

module.exports = router;
