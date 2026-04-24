const mongoose = require('mongoose');

const normalizeTags = (rawTags) => {
  const source = Array.isArray(rawTags) ? rawTags : [rawTags];

  return source
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean);
};

const itemImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image url is required'],
      trim: true,
    },
    public_id: {
      type: String,
      required: [true, 'Image public_id is required'],
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    lastKnownLocation: {
      type: String,
      required: [true, 'Last known location is required'],
      trim: true,
      maxlength: [250, 'Last known location cannot exceed 250 characters'],
    },
    tags: {
      type: [String],
      default: [],
      set: normalizeTags,
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required'],
      enum: {
        values: ['lost', 'found', 'sale'],
        message: 'Item type must be lost, found, or sale',
      },
      index: true,
    },
    images: {
      type: [itemImageSchema],
      default: [],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ itemType: 1, createdAt: -1 });
itemSchema.index({ reportedBy: 1, createdAt: -1 });

itemSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Item', itemSchema);
