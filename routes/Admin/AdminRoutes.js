const express = require("express");
const router = express.Router();
const upload = require("../../Config/multer");
const { handleCreateDoctor } = require("../../Controllers/AdminContoller");

router.post("/create-doctor", upload.single("files"), handleCreateDoctor);

module.exports = router;
