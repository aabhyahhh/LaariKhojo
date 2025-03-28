const auth = require("../../middlewares/authMiddleware");
const authController = require("../../controllers/authController");

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      // Apply authentication middleware
      await auth(req, res, async () => {
        // Call updateProfile controller
        await authController.updateProfile(req, res);
      });
    } catch (error) {
      res.status(401).json({ 
        error: 'Update failed', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
