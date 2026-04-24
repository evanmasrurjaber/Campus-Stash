const multer = require('multer');
const cloudinaryStorageModule = require('multer-storage-cloudinary');
const cloudinaryModule = require('cloudinary');
const cloudinary = cloudinaryModule.v2;

const CloudinaryStorage =
  cloudinaryStorageModule.CloudinaryStorage || cloudinaryStorageModule;

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
    cloudinary: cloudinaryModule,
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

const avatarStorage =
  hasCloudinaryConfig &&
  new CloudinaryStorage({
    cloudinary: cloudinaryModule,
    params: {
      folder: 'campusstash/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    },
  });

const avatarUpload =
  hasCloudinaryConfig &&
  multer({
    storage: avatarStorage,
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'));
        return;
      }

      cb(null, true);
    },
  });

const uploadAvatarImage = (req, res, next) => {
  if (!avatarUpload) {
    return res.status(500).json({
      success: false,
      message: 'Cloudinary is not configured on this server',
    });
  }

  return avatarUpload.single('avatar')(req, res, (error) => {
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
  cloudinary,
  hasCloudinaryConfig,
  uploadLostItemImages,
  uploadAvatarImage,
};
