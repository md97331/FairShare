const OpenAI = require('openai');

// Debug logging
console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI Key length:', process.env.OPENAI_API_KEY?.length);

if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is missing. Please add OPENAI_API_KEY to your .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to validate receipt data and return clean data for the client
function validateReceiptData(parsedData) {
  // Ensure all required fields exist
  const requiredFields = ['merchantName', 'items', 'total'];
  for (const field of requiredFields) {
    if (!parsedData[field]) {
      console.warn(`Missing required field: ${field}`);
      if (field === 'items') parsedData.items = [];
      else if (field === 'total') parsedData.total = 0;
      else parsedData[field] = '';
    }
  }

  // Clean up numbers in items array
  if (Array.isArray(parsedData.items)) {
    parsedData.items = parsedData.items.map(item => ({
      name: String(item.name || '').trim(),
      price: typeof item.price === 'string' ? 
        parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) : 
        Number(item.price) || 0
    }));
  }

  // Initialize otherFees array if not present
  if (!parsedData.otherFees) {
    parsedData.otherFees = [];
  }

  // Find all special fees (any field that's not a standard field and has a numeric value)
  const standardFields = ['merchantName', 'items', 'subtotal', 'tax', 'total', 'date', 'time', 'dateTime', 'otherFees'];
  
  // Look for special fees in the object
  Object.entries(parsedData).forEach(([key, value]) => {
    // If it's not a standard field and has a numeric value or can be converted to one
    if (!standardFields.includes(key)) {
      let feeAmount = 0;
      
      if (typeof value === 'number') {
        feeAmount = value;
      } else if (typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')))) {
        feeAmount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      }
      
      if (feeAmount > 0) {
        // Add to otherFees array
        parsedData.otherFees.push({
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Format camelCase to Title Case
          amount: feeAmount
        });
        
        // Remove the original property
        delete parsedData[key];
      }
    }
  });

  // Handle existing otherFees that might not be in array format
  if (!Array.isArray(parsedData.otherFees)) {
    const fees = [];
    if (typeof parsedData.otherFees === 'object') {
      Object.entries(parsedData.otherFees).forEach(([key, value]) => {
        fees.push({ 
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
          amount: parseFloat(String(value).replace(',', '.')) || 0 
        });
      });
    }
    parsedData.otherFees = fees;
  }

  // Calculate sum of item prices
  const calculatedItemsTotal = parsedData.items.reduce((sum, item) => sum + item.price, 0);
  
  // Calculate sum of other fees
  const otherFeesTotal = parsedData.otherFees.reduce((sum, fee) => sum + fee.amount, 0);

  // If subtotal is missing, use calculated items total
  if (!parsedData.subtotal) {
    parsedData.subtotal = calculatedItemsTotal;
    console.log('Subtotal was missing, calculated from items:', parsedData.subtotal);
  }

  // Check if calculated items total matches subtotal (with small tolerance for rounding)
  const tolerance = 0.02; // 2 cents tolerance
  let hasDiscrepancies = false;
  let discrepancyMessages = [];

  if (Math.abs(calculatedItemsTotal - parsedData.subtotal) > tolerance) {
    const message = `Warning: Calculated items total (${calculatedItemsTotal.toFixed(2)}) doesn't match subtotal (${parsedData.subtotal.toFixed(2)})`;
    console.warn(message);
    discrepancyMessages.push(message);
    hasDiscrepancies = true;
  }

  // Calculate expected total
  const expectedTotal = parsedData.subtotal + (parsedData.tax || 0) + otherFeesTotal;
  
  // Check if calculated total matches the receipt total
  if (Math.abs(expectedTotal - parsedData.total) > tolerance) {
    const message = `Warning: Calculated total (${expectedTotal.toFixed(2)}) doesn't match receipt total (${parsedData.total.toFixed(2)})`;
    console.warn(message);
    discrepancyMessages.push(message);
    hasDiscrepancies = true;
  }

  // Return validation info separately from the data
  return {
    data: {
      merchantName: parsedData.merchantName,
      items: parsedData.items,
      subtotal: parsedData.subtotal,
      tax: parsedData.tax || 0,
      total: parsedData.total,
      otherFeesTotal: otherFeesTotal // Just include the total amount of other fees
    },
    validation: {
      hasDiscrepancies,
      discrepancyMessages,
      calculatedItemsTotal,
      calculatedTotal: expectedTotal,
      otherFeesTotal
    }
  };
}

// Function to correct discrepancies using GPT
async function correctDiscrepancies(validationResult, originalText) {
  const { data, validation } = validationResult;
  
  if (!validation.hasDiscrepancies) {
    return data; // No corrections needed
  }

  try {
    console.log('Attempting to correct discrepancies with GPT...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a receipt analysis expert. Your task is to correct discrepancies in receipt data."
        },
        {
          role: "user",
          content: `I've analyzed a receipt and found some discrepancies:
          
${validation.discrepancyMessages.join('\n')}

Here's the current parsed data:
${JSON.stringify(data, null, 2)}

Please correct the data to resolve these discrepancies. Focus on:
1. Checking if any items are missing or have incorrect prices
2. Verifying if there are additional fees not captured
3. Ensuring the subtotal is the sum of all item prices
4. Ensuring the total equals subtotal + tax + other fees

Return only the corrected JSON object.`
        }
      ],
      max_tokens: 2000
    });

    const correctedText = response.choices[0].message.content;
    
    try {
      // Extract JSON from the response
      const jsonMatch = correctedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No valid JSON found in correction response');
        return data; // Return original if no valid JSON found
      }
      
      const correctedData = JSON.parse(jsonMatch[0]);
      return correctedData;
      
    } catch (parseError) {
      console.error('Error parsing correction response:', parseError);
      return data; // Return original if parsing fails
    }
    
  } catch (error) {
    console.error('Error correcting discrepancies:', error);
    return data; // Return original if correction fails
  }
}

exports.parseReceiptImage = async (imageBuffer) => {
  try {
    // Convert buffer to base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Maximum number of retries
    const MAX_RETRIES = 3;
    let currentTry = 0;
    let bestData = null;
    let bestValidation = null;
    let lowestDiscrepancyCount = Infinity;
    let hasDiscrepancies = true;

    while (currentTry < MAX_RETRIES && hasDiscrepancies) {
      currentTry++;
      console.log(`Attempt ${currentTry} to parse receipt...`);

      try {
        // If this is a retry, modify the prompt to emphasize accuracy
        const retryEmphasis = currentTry > 1 
          ? `IMPORTANT: Previous attempt had calculation errors. Please ensure all numbers add up correctly. The sum of item prices MUST equal the subtotal, and subtotal + tax + other fees MUST equal the total.` 
          : '';

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this receipt and provide the following details in a JSON format:
1. Store name (merchantName)
2. List of items purchased with their prices
3. Subtotal, tax, and total amounts
4. Any additional fees like tips, service charges, healthcare surcharges, etc. should be included in an array called 'otherFees' with each fee having a 'name' and 'amount' property. Do not create separate fields for these fees.

Make sure to format numbers as actual numbers, not strings. Ensure that the sum of item prices equals the subtotal, and that subtotal + tax + other fees equals the total.

${retryEmphasis}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4096
        });

        const responseText = response.choices[0].message.content;
        console.log(`Attempt ${currentTry} response:`, responseText.substring(0, 200) + '...');

        // Try to extract JSON from the response
        let extractedData;
        try {
          // First try direct JSON parse
          extractedData = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Direct JSON parse failed, trying to extract JSON from text');
          // Try to find JSON in the text
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }

        // Validate the extracted data
        const validationResult = validateReceiptData(extractedData);
        
        // Track the best result we've seen so far (with fewest discrepancies)
        const discrepancyCount = validationResult.validation.discrepancyMessages.length;
        if (discrepancyCount < lowestDiscrepancyCount) {
          lowestDiscrepancyCount = discrepancyCount;
          bestData = validationResult.data;
          bestValidation = validationResult.validation;
          console.log(`New best result found on attempt ${currentTry} with ${discrepancyCount} discrepancies`);
        }
        
        hasDiscrepancies = validationResult.validation.hasDiscrepancies;
        
        if (!hasDiscrepancies) {
          console.log(`Successfully parsed receipt on attempt ${currentTry}`);
          return validationResult.data;
        } else if (currentTry < MAX_RETRIES) {
          console.log(`Discrepancies found on attempt ${currentTry}, trying to correct...`);
          
          try {
            // Try to correct with GPT
            const correctedData = await correctDiscrepancies(validationResult, responseText);
            // Validate the corrected data
            const correctedValidation = validateReceiptData(correctedData);
            
            // Check if the correction is better than what we had before
            const correctedDiscrepancyCount = correctedValidation.validation.discrepancyMessages.length;
            if (correctedDiscrepancyCount < lowestDiscrepancyCount) {
              lowestDiscrepancyCount = correctedDiscrepancyCount;
              bestData = correctedValidation.data;
              bestValidation = correctedValidation.validation;
              console.log(`New best result found after correction with ${correctedDiscrepancyCount} discrepancies`);
            }
            
            if (!correctedValidation.validation.hasDiscrepancies) {
              console.log(`Successfully corrected receipt on attempt ${currentTry}`);
              return correctedValidation.data;
            }
          } catch (correctionError) {
            console.error(`Error during correction on attempt ${currentTry}:`, correctionError);
            // Continue with next attempt even if correction fails
          }
        }
      } catch (error) {
        console.error(`Error on attempt ${currentTry}:`, error);
        // Continue with next attempt
      }
    }

    // If we've exhausted all retries, return the best result we found
    if (bestData) {
      console.log('Returning best attempt with', lowestDiscrepancyCount, 'discrepancies');
      
      // If there are still discrepancies, add a warning
      if (lowestDiscrepancyCount > 0) {
        return {
          ...bestData,
          warning: 'Receipt calculations may be inaccurate. Please verify the amounts manually.',
          discrepancies: bestValidation.discrepancyMessages.length > 0 ? 
            bestValidation.discrepancyMessages : undefined
        };
      }
      
      return bestData;
    }

    throw new Error('Failed to parse receipt after multiple attempts');

  } catch (error) {
    console.error('Final Error:', error);
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw new Error(`Failed to analyze receipt image: ${error.message}`);
  }
};