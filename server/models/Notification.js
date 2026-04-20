const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['message_received', 'message_reply', 'listing_update', 'lost_item_update', 'system'],
        message: 'Invalid notification type',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
      maxlength: [500, 'Notification body cannot exceed 500 characters'],
    },
    relatedModel: {
      type: String,
      enum: {
        values: ['Message', 'Listing', 'LostItem', 'User'],
        message: 'Related model must be Message, Listing, LostItem, or User',
      },
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    postType: {
      type: String,
      default: null,
      enum: {
        values: ['listing', 'lostItem', null],
        message: 'Post type must be listing, lostItem, or null',
      },
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ relatedModel: 1, relatedId: 1 });

notificationSchema.pre('validate', function validateNotification(next) {
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }

  if (!this.isRead && this.readAt) {
    this.readAt = null;
  }

  next();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);