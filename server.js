const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
 
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let otpStore = {}; // in-memory

// Mail setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gmail",
    pass: "gmail-app pass" // Use App Password
  }
});

// Send OTP
app.post("/send-otp", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = otp;

  transporter.sendMail({
    to: email,
    subject: "Your Amusement Park OTP",
    text: `Your OTP is: ${otp}`
  });

  res.json({ success: true, message: "OTP sent" });
});
app.post("/send-ticket", async (req, res) => {
  const bookingData = req.body;

  // Generate PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <h1>Amusement Park Ticket</h1>
    <p>Name: ${bookingData.name}</p>
    <p>Email: ${bookingData.email}</p>
    <p>Date: ${bookingData.date}</p>
    <p>Type: ${bookingData.type}</p>
    <p>People: ${bookingData.people}</p>
    <p>Total: ₹${bookingData.total}</p>
  `);

  const filePath = `ticket_${Date.now()}.pdf`;
  await page.pdf({ path: filePath });
  await browser.close();

  // Send Mail
  await transporter.sendMail({
    to: bookingData.email,
    subject: "Your Amusement Park Ticket",
    text: "Thanks for booking! Your ticket is attached.",
    attachments: [{
      filename: "ticket.pdf",
      path: filePath
    }]
  });

  res.json({ success: true });
});
// Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] == otp) {
    delete otpStore[email];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
