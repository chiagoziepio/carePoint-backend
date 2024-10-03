const express = require("express")
const router = express.Router()
const {handlePatientsRegisteration} = require("../../Controllers/PatientControllers")


router.post("/register",handlePatientsRegisteration)


module.exports = router