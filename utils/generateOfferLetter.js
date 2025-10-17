const puppeteer = require('puppeteer');
const s3 = require('./s3');
const generateOfferLetterHTML = require('./offerLetterTemplate');
const { v4: uuidv4 } = require('uuid');

async function generateOfferLetterPDF(user, job) {
  try {
    const htmlContent = generateOfferLetterHTML(user, job);
    const fileName = `offerletters/offer_${user._id}_${uuidv4()}.pdf`;

    console.log('🚀 Launching Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    console.log('✅ PDF generated successfully');

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'public-read',
    };

    console.log('🚀 Uploading PDF to S3...');
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log('✅ Offer Letter uploaded:', uploadResult.Location);

    return uploadResult.Location;
  } catch (error) {
    console.error('❌ Error generating offer letter:', error);
    throw new Error('Offer letter generation failed');
  }
}

module.exports = { generateOfferLetterPDF };
