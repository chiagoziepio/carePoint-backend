const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors")
const dotenv = require("dotenv")

const app = express()
dotenv.config()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:[],
    credentials: true
}))


const PORT = process.env.PORT || 3002



app.listen(PORT, ()=> {
    console.log(`app running on port ${PORT}`)
})