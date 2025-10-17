module.exports = function generateOfferLetterHTML(user, job) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Offer Letter</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
      h1 { color: #0073e6; text-align: center; }
      .section { margin-bottom: 25px; }
      .signature { margin-top: 40px; }
      .details-table { width: 100%; border-collapse: collapse; }
      .details-table td { padding: 6px; }
      .footer { margin-top: 40px; font-size: 13px; color: #666; text-align: center; }
    </style>
  </head>
  <body>
    <h1>Offer Letter</h1>
    <div class="section">
      <p>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
      <p>Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
      <p>We are pleased to offer you the position of <strong>${job.title}</strong> in our <strong>${job.team}</strong> team at Signavox.</p>
      <p>Your skills and background are an excellent match for our organization, and we’re excited to have you join us.</p>
    </div>

    <div class="section">
      <table class="details-table">
        <tr><td><strong>Candidate Name:</strong></td><td>${user.firstName} ${user.lastName}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${user.phoneNumber || 'N/A'}</td></tr>
        <tr><td><strong>Team:</strong></td><td>${job.team}</td></tr>
        <tr><td><strong>Position:</strong></td><td>${job.title}</td></tr>
      </table>
    </div>

    <div class="section">
      <p>Please sign and return a copy of this letter as confirmation of your acceptance.</p>
    </div>

    <div class="signature">
      <p>Best Regards,</p>
      <p><strong>HR Department</strong><br>Signavox Pvt. Ltd.</p>
    </div>

    <div class="footer">
      <p>This is a system-generated document — no signature required.</p>
    </div>
  </body>
  </html>
  `;
};
