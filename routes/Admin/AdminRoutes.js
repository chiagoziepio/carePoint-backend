const express = require("express");
const router = express.Router();
const upload = require("../../Config/multer");
const {
  handleCreateDoctor,
  handleGetAllDoc,
  handleGetAllAppointments,
  handleGetAllPatients,
} = require("../../Controllers/AdminContoller");

router.post("/create-doctor", upload.single("files"), handleCreateDoctor);
router.get("/alldoctors", handleGetAllDoc);
router.get("/allappointments", handleGetAllAppointments);
router.get("/allpatients", handleGetAllPatients);

module.exports = router;
