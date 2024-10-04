const express = require("express");
const router = express.Router();
const {
  handlePatientsRegisteration,
  handlePatientLogin,
} = require("../../Controllers/PatientControllers");

router.post("/register", handlePatientsRegisteration);
router.post("/login", handlePatientLogin);

module.exports = router;
