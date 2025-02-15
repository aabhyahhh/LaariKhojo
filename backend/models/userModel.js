const mongoose = require('mongoose');

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
    },
    mapsLink:{
        type: String, 
    },
    latitude:{
        type: Number, 
    }, 
    longitude: {
        type: Number, 
    }

},{timestamps: true}
);

module.exports = mongoose.model('User', userSchema);