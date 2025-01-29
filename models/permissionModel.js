const mongoose = require("mongoose");

//admin permission

const permissionSchema = new mongoose.Schema({
  
    permission_name:{
        type: String, 
        required: true
    },

    is_default:{ //defines default permissions given by admin to user 
        type: Number, 
        default: 0 //0-> not default , 1-> default
    }

});

module.exports = mongoose.model("Permission", permissionSchema); 
