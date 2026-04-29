const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

const PAGE_LIMIT = 50;
const VALID_POST_TYPES = ['listing', 'lostItem', 'foundItem', 'saleItem'];

const sendMessage = async (req, res) => {
  try {
    const recipientId = String(req.body.recipientId || '').trim();
    const postId = String(req.body.postId || '').trim();
    const postType = String(req.body.postType || '').trim();
    const content = req.body.content;
    const senderId = req.user._id;

    if (!recipientId || !postId || !postType || !content) {
      return res.status(400).json({
        success: false,
        message: 'recipientId, postId, postType, and content are required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'recipientId must be a valid id',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'postId must be a valid id',
      });
    }

    if (!VALID_POST_TYPES.includes(postType)) {
      return res.status(400).json({
        success: false,
        message: 'postType must be listing, lostItem, foundItem, or saleItem',
      });
    }

    if (senderId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a message to yourself',
      });
    }

    const recipientExists = await User.findById(recipientId);
    if (!recipientExists) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found',
      });
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      postId,
      postType,
      content,
    });

    await message.populate('sender', 'fullName email studentId');
    await message.populate('recipient', 'fullName email studentId');

    const notification = await Notification.create({
      recipient: recipientId,
      actor: senderId,
      type: 'message_received',
      title: `New message from ${req.user.fullName}`,
      body: content.substring(0, 100),
      relatedModel: 'Message',
      relatedId: message._id,
      messageId: message._id,
      postId,
      postType,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message,
        notification: {
          id: notification._id,
          type: notification.type,
        },
      },
    });
  } catch (error) {
    console.error('Send message error:', error.message);

    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Message validation failed';
      return res.status(400).json({
        success: false,
        message: firstError,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while sending message',
    });
  }
};

const getInbox = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNumber - 1) * PAGE_LIMIT;

    const [inboxResult] = await Message.aggregate([
      {
        $match: {
          $or: [{ recipient: userId }, { sender: userId }],
        },
      },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender'],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            postId: '$postId',
            postType: '$postType',
            otherUser: '$otherUser',
          },
          latestMessageId: { $first: '$_id' },
          latestCreatedAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: { latestCreatedAt: -1 },
      },
      {
        $facet: {
          metadata: [{ $count: 'totalCount' }],
          data: [{ $skip: skip }, { $limit: PAGE_LIMIT }],
        },
      },
    ]);

    const totalCount = inboxResult?.metadata?.[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / PAGE_LIMIT);
    const latestRows = inboxResult?.data || [];
    const messageIds = latestRows.map((row) => row.latestMessageId);

    const fetchedMessages = await Message.find({ _id: { $in: messageIds } })
      .populate('sender', 'fullName email studentId')
      .populate('recipient', 'fullName email studentId');

    const messageMap = new Map(fetchedMessages.map((msg) => [msg._id.toString(), msg]));
    const messages = latestRows
      .map((row) => messageMap.get(row.latestMessageId.toString()))
      .filter(Boolean);

    const latestMessageContent = messages[0]?.content || null;

    return res.status(200).json({
      success: true,
      message: 'Inbox fetched successfully',
      data: {
        messages,
        latestMessageContent,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          pageSize: PAGE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('Get inbox error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching inbox',
    });
  }
};

const getMessagesOnPost = async (req, res) => {
  try {
    const { postId, postType } = req.params;
    const { page = 1 } = req.query;

    if (!VALID_POST_TYPES.includes(postType)) {
      return res.status(400).json({
        success: false,
        message: 'postType must be listing, lostItem, foundItem, or saleItem',
      });
    }

    const skip = (page - 1) * PAGE_LIMIT;

    const messages = await Message.find({ postId, postType })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(PAGE_LIMIT)
      .populate('sender', 'fullName email studentId')
      .populate('recipient', 'fullName email studentId');

    const totalCount = await Message.countDocuments({ postId, postType });
    const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

    return res.status(200).json({
      success: true,
      message: 'Messages on post fetched successfully',
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          totalCount,
          pageSize: PAGE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('Get messages on post error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
    });
  }
};

const getThreadWithUser = async (req, res) => {
  try {
    const { otherUserId, postId, postType } = req.params;
    const currentUserId = req.user._id;
    const { page = 1 } = req.query;

    if (!VALID_POST_TYPES.includes(postType)) {
      return res.status(400).json({
        success: false,
        message: 'postType must be listing, lostItem, foundItem, or saleItem',
      });
    }

    const skip = (page - 1) * PAGE_LIMIT;

    const messages = await Message.find({
      postId,
      postType,
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(PAGE_LIMIT)
      .populate('sender', 'fullName email studentId')
      .populate('recipient', 'fullName email studentId');

    const totalCount = await Message.countDocuments({
      postId,
      postType,
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId },
      ],
    });

    const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

    return res.status(200).json({
      success: true,
      message: 'Thread fetched successfully',
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          totalCount,
          pageSize: PAGE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('Get thread error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching thread',
    });
  }
};

module.exports = {
  sendMessage,
  getInbox,
  getMessagesOnPost,
  getThreadWithUser,
};
