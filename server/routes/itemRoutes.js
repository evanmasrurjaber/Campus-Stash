const express = require('express');
const { createItem, getItems } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');
const { uploadLostItemImages } = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, uploadLostItemImages, createItem);
router.get('/', getItems);

module.exports = router;
