const mongoose = require('mongoose');
const operatingHoursSchema = require('./operatingHoursModel').schema;

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
        required: true,
        index: true
    },
    mapsLink:{
        type: String, 
        required: true
    },
    operatingHours: {
        type: operatingHoursSchema,
        required: true
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