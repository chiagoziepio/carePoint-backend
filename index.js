const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 3002;

//db connection

mongoose.connect("mongodb://0.0.0.0/meetifydb");
const connc = mongoose.connection;
connc.once("open", () => {
  console.log("connected to database");
  app.listen(PORT, () => {
    console.log(`app running on port ${PORT}`);
  });
});
connc.on("error", (err) => {
  console.log(`database error:${err}`);
  process.exit();
});

// routes

app.use("/api/patient", require("./routes/Patients/patientRoutes"));
