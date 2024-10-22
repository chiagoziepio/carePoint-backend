const express = require("express");
const router = express.Router();
const upload = require("../../Config/multer");
const {
  handleCreateDoctor,
  handleGetAllDoc,
  handleGetAllAppointments,
} = require("../../Controllers/AdminContoller");

router.post("/create-doctor", upload.single("files"), handleCreateDoctor);
router.get("/alldoctors", handleGetAllDoc);
router.get("/allappointments", handleGetAllAppointments);

module.exports = router;
