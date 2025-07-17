const mongoose = require('mongoose');
const operatingHoursSchema = require('./operatingHoursModel').schema;
const { isVendorOpenNow } = require('../helpers/timeUtils');

const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password:{
        type: String,
        required: true
    },
    contactNumber:{
        type: String, 
        required: function() { return this.role !== 'super admin' && this.role !== 'viewer'; },
        index: true
    },
    mapsLink:{
        type: String, 
        required: function() { return this.role !== 'super admin' && this.role !== 'viewer'; }
    },
    displayPicture: {
        type: String, // stores filename or URL
        default: ''
    },
    role: {
        type: String,
        enum: ['super admin', 'viewer'],
        default: 'viewer',
        index: true
    },
    operatingHours: {
        type: operatingHoursSchema,
        required: function() { return this.role !== 'super admin' && this.role !== 'viewer'; }
      }

},{timestamps: true}
);

userSchema.index({ updatedAt: -1 });

userSchema.on('index', function(err) {
    if (err) {
        console.error('Error creating indexes:', err);
    } else {
        console.log('User model indexes created successfully');
    }
});

module.exports = mongoose.model('User', userSchema);