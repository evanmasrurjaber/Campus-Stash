const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
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

const getItems = async (req, res) => {
  try {
    const {
      itemType,
      state,
      q,
      category,
      itemCondition,
      minPrice,
      maxPrice,
      reportedBy,
      sort = 'recent',
      page = '1',
      limit = '12',
    } = req.query;

    const query = {};
    const activeType = (itemType || state || '').trim().toLowerCase();

    if (activeType && ['lost', 'found', 'sale'].includes(activeType)) {
      query.itemType = activeType;
    }

    if (reportedBy) {
      if (!mongoose.Types.ObjectId.isValid(reportedBy)) {
        return res.status(400).json({
          success: false,
          message: 'reportedBy must be a valid id',
        });
      }

      query.reportedBy = reportedBy;
    }

    if (category) {
      query.category = { $regex: String(category).trim(), $options: 'i' };
    }

    if (q && String(q).trim()) {
      const searchTerm = String(q).trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (itemCondition && query.itemType === 'sale') {
      query.itemCondition = String(itemCondition).trim();
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      query.price = {};

      if (!Number.isNaN(min)) {
        query.price.$gte = min;
      }

      if (!Number.isNaN(max)) {
        query.price.$lte = max;
      }
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 48);
    const skip = (pageNumber - 1) * pageSize;

    const sortOptions =
      sort === 'price_asc'
        ? { price: 1, createdAt: -1 }
        : sort === 'price_desc'
          ? { price: -1, createdAt: -1 }
          : sort === 'oldest'
            ? { createdAt: 1 }
            : { createdAt: -1 };

    const [items, totalItems] = await Promise.all([
      Item.find(query).populate('reportedBy', 'fullName email studentId avatar').sort(sortOptions).skip(skip).limit(pageSize),
      Item.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          totalItems,
          totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
        },
      },
    });
  } catch (error) {
    console.error('Get items error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while loading items',
    });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item id',
      });
    }

    const item = await Item.findById(id).populate('reportedBy', 'fullName email studentId avatar');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        item,
      },
    });
  } catch (error) {
    console.error('Get item by id error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while loading item',
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item id',
      });
    }

    // Fetch existing item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Ownership check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this item',
      });
    }

    // Extract and validate fields
    const itemType = (req.body.itemType || '').trim().toLowerCase();
    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();
    const category = (req.body.category || '').trim();
    const tags = normalizeTags(req.body.tags || []);
    const newImages = mapUploadedImages(req.files || []);

    // Validate itemType
    if (itemType && !['lost', 'found', 'sale'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'itemType must be one of: lost, found, or sale',
      });
    }

    // Validate required common fields
    if (title && !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'title cannot be empty',
      });
    }

    if (description && !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'description cannot be empty',
      });
    }

    // Parse imagesToDelete (array of public_ids to remove)
    let imagesToDelete = [];
    if (req.body.imagesToDelete) {
      try {
        imagesToDelete = typeof req.body.imagesToDelete === 'string'
          ? JSON.parse(req.body.imagesToDelete)
          : Array.isArray(req.body.imagesToDelete)
            ? req.body.imagesToDelete
            : [];
      } catch {
        imagesToDelete = [];
      }
    }

    // Delete images from Cloudinary
    if (imagesToDelete.length > 0) {
      for (const public_id of imagesToDelete) {
        try {
          await cloudinary.uploader.destroy(public_id);
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr);
        }
      }
    }

    // Update basic fields
    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(tags.length > 0 && { tags }),
    };

    // Handle image updates: keep existing (not deleted) + add new ones
    const remainingImages = item.images.filter(
      (img) => !imagesToDelete.includes(img.public_id)
    );
    const allImages = [...remainingImages, ...newImages];

    if (allImages.length > 0) {
      updateData.images = allImages;
    }

    // Handle type-specific fields based on itemType or use existing type
    const finalType = itemType || item.itemType;

    if (finalType === 'lost') {
      const lostLocation = (req.body.lostLocation || '').trim();
      const lostTime = req.body.lostTime;

      if (lostLocation && !lostLocation.trim()) {
        return res.status(400).json({
          success: false,
          message: 'lostLocation cannot be empty',
        });
      }

      if (lostLocation) updateData.lostLocation = lostLocation;
      if (lostTime) updateData.lostTime = lostTime;
    }

    if (finalType === 'found') {
      const foundLocation = (req.body.foundLocation || '').trim();
      const foundTime = req.body.foundTime;
      const foundItemStatus = (req.body.foundItemStatus || '').trim();

      if (foundLocation && !foundLocation.trim()) {
        return res.status(400).json({
          success: false,
          message: 'foundLocation cannot be empty',
        });
      }

      if (foundItemStatus && !foundItemStatus.trim()) {
        return res.status(400).json({
          success: false,
          message: 'foundItemStatus cannot be empty',
        });
      }

      if (foundLocation) updateData.foundLocation = foundLocation;
      if (foundTime) updateData.foundTime = foundTime;
      if (foundItemStatus) updateData.foundItemStatus = foundItemStatus;
    }

    if (finalType === 'sale') {
      const price = req.body.price;
      const deliveryLocation = (req.body.deliveryLocation || '').trim();
      const itemCondition = (req.body.itemCondition || '').trim();

      if (price !== null && price !== undefined && price !== '') {
        if (parseFloat(price) < 0) {
          return res.status(400).json({
            success: false,
            message: 'price cannot be negative',
          });
        }
        updateData.price = parseFloat(price);
      }

      if (deliveryLocation && !deliveryLocation.trim()) {
        return res.status(400).json({
          success: false,
          message: 'deliveryLocation cannot be empty',
        });
      }

      if (itemCondition && !itemCondition.trim()) {
        return res.status(400).json({
          success: false,
          message: 'itemCondition cannot be empty',
        });
      }

      if (deliveryLocation) updateData.deliveryLocation = deliveryLocation;
      if (itemCondition) updateData.itemCondition = itemCondition;
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'fullName email studentId');

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: {
        item: updatedItem,
      },
    });
  } catch (error) {
    console.error('Update item error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      body: req.body,
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
      message: 'Server error while updating item',
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate item id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item id',
      });
    }

    // Fetch item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Ownership check
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item',
      });
    }

    // Delete all images from Cloudinary
    if (item.images && item.images.length > 0) {
      for (const image of item.images) {
        try {
          if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id);
          }
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr);
        }
      }
    }

    // Delete item from database
    await Item.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting item',
    });
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
};
