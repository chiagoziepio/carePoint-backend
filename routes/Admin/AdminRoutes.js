const express = require("express");
const router = express.Router();
const upload = require("../../Config/multer");
const {
  handleCreateDoctor,
  handleGetAllDoc,
  handleGetAllAppointments,
  handleGetAllPatients,
  handleAdminCancelAppointment,
  handleDeactiveDoctor,
  handleActivateDoc,
  handleTogglePatientStatus,
} = require("../../Controllers/AdminContoller");

router.post("/create-doctor", upload.single("files"), handleCreateDoctor);
router.get("/alldoctors", handleGetAllDoc);
router.get("/allappointments", handleGetAllAppointments);
router.get("/allpatients", handleGetAllPatients);
router.delete("/cancel-appointment", handleAdminCancelAppointment);
router.patch("/deactivate-doctor", handleDeactiveDoctor);
router.patch("/activate-doctor", handleActivateDoc);
router.patch("/toggle-patient-status", handleTogglePatientStatus);

module.exports = router;
