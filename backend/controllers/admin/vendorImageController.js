const multer = require('multer');
const path = require('path');
const VendorImage = require('../../models/vendorImageModel');
const User = require('../../models/userModel');

// Multer storage config for vendor images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/vendor-images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Upload carousel image
const uploadVendorImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { vendorId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const image = new VendorImage({
        vendor: vendorId,
        imageUrl: `/public/vendor-images/${req.file.filename}`
      });
      await image.save();
      res.status(201).json({ message: 'Image uploaded', image });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

// Upload or update display picture
const uploadDisplayPicture = [
  upload.single('displayPicture'),
  async (req, res) => {
    try {
      const { vendorId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const user = await User.findById(vendorId);
      if (!user) return res.status(404).json({ error: 'Vendor not found' });
      user.displayPicture = `/public/vendor-images/${req.file.filename}`;
      await user.save();
      res.status(200).json({ message: 'Display picture updated', displayPicture: user.displayPicture });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

// Get all images for a vendor
const getVendorImages = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const images = await VendorImage.find({ vendor: vendorId });
    res.status(200).json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get display picture for a vendor
const getDisplayPicture = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const user = await User.findById(vendorId);
    if (!user) return res.status(404).json({ error: 'Vendor not found' });
    res.status(200).json({ displayPicture: user.displayPicture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadVendorImage,
  uploadDisplayPicture,
  getVendorImages,
  getDisplayPicture
}; 