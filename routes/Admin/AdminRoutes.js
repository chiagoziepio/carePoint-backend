const express = require("express");
const router = express.Router();
const upload = require("../../Config/multer");
const {
  handleCreateDoctor,
  handleGetAllDoc,
} = require("../../Controllers/AdminContoller");

router.post("/create-doctor", upload.single("files"), handleCreateDoctor);
router.get("/alldoctors", handleGetAllDoc);

module.exports = router;
