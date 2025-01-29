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
    role:{
        type: Number,
        default: 0 //0 -> Normal user, 1-> admin, 2-> subadmin, 3 -> editor
    }

},{timestamps: true}
);

module.exports = mongoose.model('User', userSchema);