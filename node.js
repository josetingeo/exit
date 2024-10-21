const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/otpApp', { useNewUrlParser: true, useUnifiedTopology: true });

const OtpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: Date,
});

const Otp = mongoose.model('Otp', OtpSchema);

app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password',
  },
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route to send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60000); // OTP expires in 10 minutes

  const otpDoc = new Otp({ email, otp, expiresAt });
  await otpDoc.save();

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('OTP sent successfully');
  });
});

// OTP Verification Route
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const otpRecord = await Otp.findOne({ email, otp });

  if (!otpRecord) {
    return res.status(400).send('Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).send('OTP has expired');
  }

  res.status(200).send('OTP verified successfully');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
