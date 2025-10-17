// utils/generateOTP.js

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes in ms
  return { otp, expiry };
}

module.exports = generateOTP;
