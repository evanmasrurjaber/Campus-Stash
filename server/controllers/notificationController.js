const Notification = require('../models/Notification');
const Item = require('../models/Item');
const { getIO } = require('../utils/socket');

const PAGE_LIMIT = 20;

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNumber - 1) * PAGE_LIMIT;

    const notifications = await Notification.find({ recipient: userId })
      .populate('actor', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_LIMIT);

    const postIds = Array.from(
      new Set(notifications.map((notification) => notification.postId).filter(Boolean)),
    );
    const itemMap = new Map();

    if (postIds.length > 0) {
      const items = await Item.find({ _id: { $in: postIds } }).select('title images');
      items.forEach((item) => {
        itemMap.set(String(item._id), item);
      });
    }

    const hydratedNotifications = notifications.map((notification) => {
      const postId = notification.postId ? String(notification.postId) : '';
      const item = postId ? itemMap.get(postId) : null;

      return {
        ...notification.toJSON(),
        postTitle: item?.title || '',
        postImageUrl: item?.images?.[0]?.url || '',
      };
    });

    const totalCount = await Notification.countDocuments({ recipient: userId });
    const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

    return res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: {
        notifications: hydratedNotifications,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          pageSize: PAGE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Unread count fetched successfully',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count',
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    console.error('Mark as read error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read',
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark all as read error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read',
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
