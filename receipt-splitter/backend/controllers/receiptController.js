const visionService = require('../services/visionService');

exports.scanReceipt = async (req, res) => {
  try {
    // Debug logging
    console.log('Received request with file:', {
      fieldname: req.file?.fieldname,
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Please upload a JPEG, PNG, or GIF image'
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'Please upload an image smaller than 5MB'
      });
    }

    console.log('Processing receipt image...');
    const receiptData = await visionService.detectText(req.file.buffer);
    console.log('Receipt data:', receiptData);

    res.status(200).json(receiptData);
  } catch (error) {
    console.error('Error in scanReceipt:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 