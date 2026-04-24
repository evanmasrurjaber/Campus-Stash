const express = require('express');
const { createLostItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const { uploadLostItemImages } = require('../middleware/upload');

const router = express.Router();

router.post('/lost', protect, uploadLostItemImages, createLostItem);

module.exports = router;
