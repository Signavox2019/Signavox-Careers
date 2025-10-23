const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utils/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const bucketName = process.env.AWS_BUCKET_NAME;

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Allow only PDF / Word
    if (!file.mimetype.match(/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
      return cb(new Error('Only PDF or Word documents are allowed for resume'), false);
    }
  } else if (file.fieldname === 'profileImage') {
    // Allow only images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for profile image'), false);
    }
  }
  cb(null, true);
};

const storage = multerS3({
  s3,
  bucket: bucketName,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let folder = 'others';
    if (file.fieldname === 'resume') folder = 'resumes';
    if (file.fieldname === 'profileImage') folder = 'profileImages';
    const key = `${folder}/${Date.now()}-${uuidv4()}${ext}`;
    cb(null, key);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
