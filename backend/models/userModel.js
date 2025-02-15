const mongoose = require('mongoose');
const operatingHoursSchema = require('./operatingHoursModel').schema;

const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    contactNumber:{
        type: String, 
        required: true
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

module.exports = mongoose.model('User', userSchema);