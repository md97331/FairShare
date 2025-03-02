const openaiService = require('./openaiService');

exports.detectText = async (imageBuffer) => {
  try {
    // Use OpenAI Vision API directly
    const parsedReceipt = await openaiService.parseReceiptImage(imageBuffer);
    return parsedReceipt;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw error;
  }
}; 