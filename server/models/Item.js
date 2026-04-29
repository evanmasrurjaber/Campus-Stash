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
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    // Lost item fields
    lostLocation: {
      type: String,
      trim: true,
      maxlength: [250, 'Lost location cannot exceed 250 characters'],
    },
    lostTime: Date,

    // Found item fields
    foundLocation: {
      type: String,
      trim: true,
      maxlength: [250, 'Found location cannot exceed 250 characters'],
    },
    foundTime: Date,
    foundItemStatus: {
      type: String,
      enum: {
        values: ['With me', 'Turned in to Lost & Found'],
        message: 'Found item status must be one of: With me, Turned in to Lost & Found',
      },
    },

    // Sale item fields
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    deliveryLocation: {
      type: String,
      trim: true,
      maxlength: [250, 'Delivery location cannot exceed 250 characters'],
    },
    itemCondition: {
      type: String,
      enum: {
        values: ['New', 'Good', 'Fair', 'Poor'],
        message: 'Item condition must be one of: New, Good, Fair, Poor',
      },
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
itemSchema.index({ title: 'text', description: 'text', category: 'text', tags: 'text' });

// Pre-save validation for required fields based on itemType
itemSchema.pre('save', function () {
  if (this.itemType === 'lost') {
    if (!this.lostLocation || !this.lostLocation.trim()) {
      throw new Error('lostLocation is required for lost items');
    }
    if (!this.lostTime) {
      throw new Error('lostTime is required for lost items');
    }
  }

  if (this.itemType === 'found') {
    if (!this.foundLocation || !this.foundLocation.trim()) {
      throw new Error('foundLocation is required for found items');
    }
    if (!this.foundTime) {
      throw new Error('foundTime is required for found items');
    }
    if (!this.foundItemStatus) {
      throw new Error('foundItemStatus is required for found items');
    }
  }

  if (this.itemType === 'sale') {
    if (this.price === null || this.price === undefined || this.price === '') {
      throw new Error('price is required for sale items');
    }
    if (!this.deliveryLocation || !this.deliveryLocation.trim()) {
      throw new Error('deliveryLocation is required for sale items');
    }
    if (!this.itemCondition) {
      throw new Error('itemCondition is required for sale items');
    }
  }
});

itemSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Item', itemSchema);
