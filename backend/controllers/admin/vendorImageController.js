const multer = require('multer');
const path = require('path');
const VendorImage = require('../../models/vendorImageModel');
const User = require('../../models/userModel');
const fs = require('fs');
const vendorImagesDir = path.join(__dirname, '../../public/vendor-images');
if (!fs.existsSync(vendorImagesDir)) {
  fs.mkdirSync(vendorImagesDir, { recursive: true });
}

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

// Upload carousel (business) image
const uploadVendorImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('UPLOAD_VENDOR_IMAGE BODY:', req.body);
      console.log('UPLOAD_VENDOR_IMAGE FILE:', req.file);
      const { vendorId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      // Enforce max 20 business images per vendor
      const count = await VendorImage.countDocuments({ vendor: vendorId, type: 'business' });
      if (count >= 20) return res.status(400).json({ error: 'Maximum 20 business images allowed' });
      const image = new VendorImage({
        vendor: vendorId,
        imageUrl: `/public/vendor-images/${req.file.filename}`,
        type: 'business'
      });
      await image.save();
      res.status(201).json({ message: 'Business image uploaded', image });
    } catch (err) {
      console.error('UPLOAD_VENDOR_IMAGE ERROR:', err);
      res.status(500).json({ error: err.message });
    }
  }
];

// Upload or update display picture
const uploadDisplayPicture = [
  upload.single('displayPicture'),
  async (req, res) => {
    try {
      console.log('UPLOAD_DISPLAY_PICTURE BODY:', req.body);
      console.log('UPLOAD_DISPLAY_PICTURE FILE:', req.file);
      const { vendorId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      // Remove old display image if exists
      const oldDisplay = await VendorImage.findOne({ vendor: vendorId, type: 'display' });
      if (oldDisplay) {
        // Optionally: delete old file from disk
        await VendorImage.deleteOne({ _id: oldDisplay._id });
      }
      const image = new VendorImage({
        vendor: vendorId,
        imageUrl: `/public/vendor-images/${req.file.filename}`,
        type: 'display'
      });
      await image.save();
      res.status(200).json({ message: 'Display picture updated', image });
    } catch (err) {
      console.error('UPLOAD_DISPLAY_PICTURE ERROR:', err);
      res.status(500).json({ error: err.message });
    }
  }
];

// Delete a business image
const deleteBusinessImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await VendorImage.findById(imageId);
    if (!image || image.type !== 'business') return res.status(404).json({ error: 'Business image not found' });
    await VendorImage.deleteOne({ _id: imageId });
    // Optionally: delete file from disk
    res.status(200).json({ message: 'Business image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete display picture
const deleteDisplayPicture = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const image = await VendorImage.findOne({ vendor: vendorId, type: 'display' });
    if (!image) return res.status(404).json({ error: 'Display picture not found' });
    await VendorImage.deleteOne({ _id: image._id });
    // Optionally: delete file from disk
    res.status(200).json({ message: 'Display picture deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all business images for a vendor
const getVendorImages = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const images = await VendorImage.find({ vendor: vendorId, type: 'business' });
    res.status(200).json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get display picture for a vendor
const getDisplayPicture = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const image = await VendorImage.findOne({ vendor: vendorId, type: 'display' });
    if (!image) return res.status(404).json({ error: 'Display picture not found' });
    res.status(200).json({ displayPicture: image.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadVendorImage,
  uploadDisplayPicture,
  deleteBusinessImage,
  deleteDisplayPicture,
  getVendorImages,
  getDisplayPicture
}; 