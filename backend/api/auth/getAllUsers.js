const authController = require("../../controllers/authController");

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Call getAllUsers controller
      await authController.getAllUsers(req, res);
    } catch (error) {
      res.status(500).json({ 
        error: 'Fetching users failed', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}