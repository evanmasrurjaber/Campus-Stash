const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage =
  hasCloudinaryConfig &&
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'campusstash/lost-items',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });

const upload =
  hasCloudinaryConfig &&
  multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 5,
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'));
        return;
      }

      cb(null, true);
    },
  });

const uploadLostItemImages = (req, res, next) => {
  if (!upload) {
    return res.status(500).json({
      success: false,
      message: 'Cloudinary is not configured on this server',
    });
  }

  return upload.array('images', 5)(req, res, (error) => {
    if (!error) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  });
};

module.exports = {
  uploadLostItemImages,
};
