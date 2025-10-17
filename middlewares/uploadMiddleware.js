// middlewares/uploadMiddleware.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utils/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const bucketName = process.env.AWS_BUCKET_NAME;

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: bucketName,
    // acl: 'public-read',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const key = `resumes/${Date.now()}-${uuidv4()}${ext}`;
      cb(null, key);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
      return cb(new Error('Only PDF or Word documents are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
