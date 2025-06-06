const VERIFY_TOKEN = "laarik";

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