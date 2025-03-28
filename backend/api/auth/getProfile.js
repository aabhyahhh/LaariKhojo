const auth = require("../../middlewares/authMiddleware");
const authController = require("../../controllers/authController");

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Apply authentication middleware
      await auth(req, res, async () => {
        // Call getProfile controller
        await authController.getProfile(req, res);
      });
    } catch (error) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}