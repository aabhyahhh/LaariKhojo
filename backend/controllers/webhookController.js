const VERIFY_TOKEN = "laarik";
const VendorLocation = require('../models/vendorLocationModel');
const { sendLocationConfirmation } = require('../services/whatsappService');

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification attempt:', {
    mode,
    token,
    challenge,
    expectedToken: VERIFY_TOKEN,
    query: req.query
  });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed:', {
      modeMatch: mode === 'subscribe',
      tokenMatch: token === VERIFY_TOKEN
    });
    res.sendStatus(403);
  }
};

const handleLocationMessage = async (message) => {
  try {
    const { from, location } = message;
    const { latitude, longitude } = location;

    // Update or create vendor location
    await VendorLocation.findOneAndUpdate(
      { phone: from },
      {
        phone: from,
        location: {
          lat: latitude,
          lng: longitude
        },
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Send confirmation message to the vendor
    await sendLocationConfirmation(from, latitude, longitude);

    console.log(`Updated location for vendor ${from}:`, { latitude, longitude });
    return true;
  } catch (error) {
    console.error('Error handling location message:', error);
    return false;
  }
};

const handleWebhook = async (req, res) => {
  const body = req.body;

  console.log('Received webhook:', JSON.stringify(body, null, 2));

  try {
    // Check if this is a message event
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const messages = body.entry[0].changes[0].value.messages;

      // Process each message
      for (const message of messages) {
        // Handle location messages
        if (message.type === 'location') {
          await handleLocationMessage(message);
        }
        // Add other message type handlers here as needed
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
};

module.exports = {
  verifyWebhook,
  handleWebhook
}; 