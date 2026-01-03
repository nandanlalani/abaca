const express = require('express');
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    // Add is_read field based on read_at
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      is_read: !!notification.read_at
    }));

    res.json({
      success: true,
      notifications: notificationsWithReadStatus
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    // Return empty array instead of error to prevent UI breaking
    res.json({
      success: true,
      notifications: []
    });
  }
});

// Mark notification as read
router.put('/:notification_id/read', authenticate, async (req, res) => {
  try {
    const { notification_id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { 
        notification_id, 
        user_id: req.user.user_id 
      },
      { 
        $set: { read_at: new Date() } 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        user_id: req.user.user_id,
        read_at: { $exists: false }
      },
      { 
        $set: { read_at: new Date() } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:notification_id', authenticate, async (req, res) => {
  try {
    const { notification_id } = req.params;

    const result = await Notification.deleteOne({
      notification_id,
      user_id: req.user.user_id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;