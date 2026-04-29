const Item = require('../models/Item');

const normalizeTags = (rawTags) => {
  const source = Array.isArray(rawTags) ? rawTags : [rawTags];

  return source
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean);
};

const mapUploadedImages = (files = []) =>
  files
    .map((file) => ({
      url: file.path || file.secure_url || file.url,
      public_id: file.filename || file.public_id,
    }))
    .filter((image) => image.url && image.public_id);

const createLostItem = async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();
    const lastKnownLocation = (req.body.lastKnownLocation || '').trim();
    const tags = normalizeTags(req.body.tags || []);
    const images = mapUploadedImages(req.files || []);

    if (!title || !description || !lastKnownLocation) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and lastKnownLocation are required',
      });
    }

    const item = await Item.create({
      title,
      description,
      lastKnownLocation,
      tags,
      itemType: 'lost',
      images,
      reportedBy: req.user._id,
    });

    await item.populate('reportedBy', 'fullName email studentId');

    return res.status(201).json({
      success: true,
      message: 'Lost item reported successfully',
      data: {
        item,
      },
    });
  } catch (error) {
    console.error('Create lost item error:', error.message);

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Invalid item data';
      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while reporting lost item',
    });
  }
};

module.exports = {
  createLostItem,
};
