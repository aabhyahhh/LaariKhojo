const VERIFY_TOKEN = "laarik";

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const handleWebhook = (req, res) => {
  const body = req.body;

  console.log('Received webhook:', JSON.stringify(body, null, 2));

  // Handle messages, statuses, locations here
  res.sendStatus(200);
};

module.exports = {
  verifyWebhook,
  handleWebhook
}; 