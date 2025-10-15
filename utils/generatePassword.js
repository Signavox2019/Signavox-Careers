const { v4: uuidv4 } = require('uuid');

function generatePassword() {
  // Generates a random password; you can replace with stronger policy
  const raw = uuidv4(); // long random
  return raw.split('-')[0] + Math.floor(Math.random() * 90 + 10);
}

module.exports = generatePassword;
