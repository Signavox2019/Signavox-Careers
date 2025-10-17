module.exports = (user) => {
  const formatDate = (date) => {
    if (!date) return '';
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const daySuffix = (d) => {
      if (d > 4 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${month} ${day}${daySuffix(day)} ${year}`;
  };

  const currentDate = formatDate(new Date());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #000; }
.page { width: 100%; max-width: 280mm; min-height: 397mm; padding: 20mm 5mm 15mm 5mm; box-sizing: border-box; page-break-after: always; position: relative; background: #fff; }
.page::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('https://my-s3-for-scl-project.s3.ap-south-1.amazonaws.com/tickets/snignavox_icon.png'); background-repeat: no-repeat; background-position: center; background-size: 600px auto; opacity: 0.2; z-index: 0; pointer-events: none; }
.content { position: relative; z-index: 1; font-size: 20px; line-height: 1.4; }
.header-logo { position: absolute; top: 15mm; left: 5mm; width: 300px; height: 70px; }
.offer-title { text-align: center; font-size: 24px; font-weight: bold; margin-top: 90px; margin-bottom: 40px; }
.date-right { text-align: right; font-size: 20px; }
.footer { position: relative; left: 5mm; right: 5mm; top: 10mm; text-align: center; font-size: 20px; font-weight: 700; color: #000; border-top: 2px solid #ccc; padding-top: 1px; }
ol li, ul li { margin-bottom: 12px; }
</style>
</head>
<body>

<div class="page">
<img src="https://my-s3-for-scl-project.s3.ap-south-1.amazonaws.com/tickets/undefined.jfif" alt="Logo" class="header-logo" />
<div class="content">
<div class="offer-title">OFFER & APPOINTMENT LETTER</div>
<div class="date-right">Date: ${currentDate}</div>

<p>To,<br>
<strong>${user.firstName} ${user.middleName || ''} ${user.lastName}</strong><br>
Email: ${user.email}<br>
Phone: ${user.phoneNumber || 'N/A'}<br>
PAN: ${user.pan || 'N/A'}</p>

<p>Dear ${user.firstName},</p>
<p>Congratulations! You have successfully completed all recruitment rounds. We are pleased to offer you a position with
<strong>SIGNAVOX TECHNOLOGIES PRIVATE LIMITED</strong> as per the terms below:</p>

<ol>
<li><strong>DESIGNATION:</strong> Software Engineer Intern</li>
<li><strong>PLACE OF WORK:</strong> Hyderabad</li>
<li><strong>WORKING HOURS:</strong> 9:30 AM - 6:30 PM, Monday to Friday</li>
<li><strong>EDUCATION:</strong>
  <ul>
    ${user.education.map(e => `<li>${e.level} from ${e.institution}, ${e.boardOrUniversity}, ${e.passedYear}, ${e.percentageOrCGPA}</li>`).join('')}
  </ul>
</li>
<li><strong>EXPERIENCE:</strong>
  <ul>
    ${user.experienced && user.experiences.length > 0 ? 
      user.experiences.map(exp => `<li>${exp.designation} at ${exp.companyName} (${formatDate(new Date(exp.startDate))} - ${exp.endDate ? formatDate(new Date(exp.endDate)) : 'Present'})</li>`).join('') : '<li>Fresher</li>'}
  </ul>
</li>
<li><strong>TERMS & CONDITIONS:</strong> You shall comply with all company rules, procedures, and statutory obligations.</li>
</ol>

</div>
<div class="footer">SIGNAVOX TECHNOLOGIES PVT LTD | Hyderabad, Telangana, India</div>
</div>

</body>
</html>
  `;
};
