// webhook.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const VERIFY_TOKEN = "EAAQGkcaPC1sBOZClQADorMDIhnTfWtvZBHcuaZCdmDR37zgXZCOrKa5huuDxxfBGwkky01puurKzZASF4E5C3PuVq3ab8jYaEAM2EBxZB1WDIbT2yKR1NvXoxty0trp5F3GXdJiigIEIZBdVp9qft8UdXaXyn5DUN6jt16DLPLYW9p01rNSH78Wnscd7OoFg2dfwy8kEHXaNiq1gZBgwxl8BZCZCF8FSrF817l";

app.use(express.json());

// Verification endpoint
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  console.log('Received webhook:', JSON.stringify(body, null, 2));

  // Handle messages, statuses, locations here
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Webhook listening on port ${port}`);
});
