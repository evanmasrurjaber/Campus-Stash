const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Post ID is required'],
    },
    postType: {
      type: String,
      required: [true, 'Post type is required'],
      enum: {
        values: ['listing', 'lostItem', 'foundItem', 'saleItem'],
        message: 'Post type must be listing, lostItem, foundItem, or saleItem',
      },
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message content cannot be empty'],
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ postType: 1, postId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, postType: 1, postId: 1, createdAt: 1 });

messageSchema.pre('validate', function validateSelfMessaging() {
  if (this.sender && this.recipient && this.sender.equals(this.recipient)) {
    this.invalidate('recipient', 'Sender and recipient must be different users');
  }
});

messageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Message', messageSchema);