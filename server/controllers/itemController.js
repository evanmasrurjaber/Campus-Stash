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

const createItem = async (req, res) => {
  try {
    const itemType = (req.body.itemType || '').trim().toLowerCase();
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();
    const category = (req.body.category || '').trim();
    const tags = normalizeTags(req.body.tags || []);
    const images = mapUploadedImages(req.files || []);

    // Validate itemType
    if (!itemType || !['lost', 'found', 'sale'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'itemType must be one of: lost, found, or sale',
      });
    }

    // Validate common required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'title and description are required',
      });
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    // Prepare item data
    const itemData = {
      title,
      description,
      category,
      tags,
      itemType,
      images,
      reportedBy: req.user._id,
    };

    // Mode-specific field handling
    if (itemType === 'lost') {
      const lostLocation = (req.body.lostLocation || '').trim();
      const lostTime = req.body.lostTime;

      if (!lostLocation) {
        return res.status(400).json({
          success: false,
          message: 'lostLocation is required for lost items',
        });
      }

      if (!lostTime) {
        return res.status(400).json({
          success: false,
          message: 'lostTime is required for lost items',
        });
      }

      itemData.lostLocation = lostLocation;
      itemData.lostTime = lostTime;
    }

    if (itemType === 'found') {
      const foundLocation = (req.body.foundLocation || '').trim();
      const foundTime = req.body.foundTime;
      const foundItemStatus = (req.body.foundItemStatus || '').trim();

      if (!foundLocation) {
        return res.status(400).json({
          success: false,
          message: 'foundLocation is required for found items',
        });
      }

      if (!foundTime) {
        return res.status(400).json({
          success: false,
          message: 'foundTime is required for found items',
        });
      }

      if (!foundItemStatus) {
        return res.status(400).json({
          success: false,
          message: 'foundItemStatus is required for found items',
        });
      }

      itemData.foundLocation = foundLocation;
      itemData.foundTime = foundTime;
      itemData.foundItemStatus = foundItemStatus;
    }

    if (itemType === 'sale') {
      const price = req.body.price;
      const deliveryLocation = (req.body.deliveryLocation || '').trim();
      const itemCondition = (req.body.itemCondition || '').trim();

      if (price === null || price === undefined || price === '') {
        return res.status(400).json({
          success: false,
          message: 'price is required for sale items',
        });
      }

      if (parseFloat(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'price cannot be negative',
        });
      }

      if (!deliveryLocation) {
        return res.status(400).json({
          success: false,
          message: 'deliveryLocation is required for sale items',
        });
      }

      if (!itemCondition) {
        return res.status(400).json({
          success: false,
          message: 'itemCondition is required for sale items',
        });
      }

      itemData.price = parseFloat(price);
      itemData.deliveryLocation = deliveryLocation;
      itemData.itemCondition = itemCondition;
    }

    // Create item
    const item = await Item.create(itemData);

    await item.populate('reportedBy', 'fullName email studentId');

    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: {
        item,
      },
    });
  } catch (error) {
    console.error('Create item error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      body: req.body,
      files: (req.files || []).map((file) => ({
        path: file.path,
        secure_url: file.secure_url,
        url: file.url,
        filename: file.filename,
        public_id: file.public_id,
      })),
    });

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Invalid item data';
      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating item',
    });
  }
};

module.exports = {
  createItem,
};
