const { validationResult } = require("express-validator");

const Permission = require("../../models/permissionModel");

const addPermission = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors: errors.array(),
      });
    }

    //Permission name is used by admin to assign roles to users
    const { permission_name } = req.body;

    const isExists = await Permission.findOne({ permission_name });

    if (isExists) {
      return res.status(400).json({
        success: false,
        msg: "Permission name already exists!",
      });
    }

    var obj = {
      //variable obj
      permission_name,
    };
    //default is for default user mode
    if (req.body.default) {
      obj.is_default = parseInt(req.body.default);
    }

    const permission = new Permission(obj);
    const newPermission = await permission.save();

    //sending message to api
    return res.status(200).json({
      success: true,
      msg: "Permission added successfully!",
      data: newPermission,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(400).json({
      success: false,
      msg: "Errors",
      error: error.message,
    });
  }
};

////////////////    GET PERMISSIONS BY ADMIN    ///////////////

const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({});

    return res.status(200).json({
      success: true,
      msg: "Permissions Fetched Successfully!",
      data: permissions,
    });
  } catch (error) {

    return res.status(400).json({
      success: false,
      msg: "Errors",
      error: error.message,
    });
  }
};

////////////////    DELETE PERMISSION BY ADMIN    ///////////////

const deletePermission = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors: errors.array(),
      });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        msg: "Missing ID in the request body" 
      });
    }

    await Permission.findByIdAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      msg: "Permission Deleted Successfully!",
    });
  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(400).json({
      success: false,
      msg: "Errors",
      error: error.message,
    });
  }
};

////////////////    UPDATE PERMISSION BY ADMIN    ///////////////

const updatePermission = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors: errors.array(),
      });
    }

    //Permission name is used by admin to assign roles to users
    const { id, permission_name } = req.body;

    const isExists = await Permission.findOne({ _id: id });

    if (!isExists) {
      return res.status(400).json({
        success: false,
        msg: "Permission ID not found!",
      });
    }

    const isNameAssigned = await Permission.findOne({
      _id: { $ne: id },
      permission_name, //checking with other permissions if this permission_name exists for them
    });

    if (isNameAssigned) {
      return res.status(400).json({
        success: false,
        msg: "Permission name already assigned to another permission!",
      });
    }

    var updatePermission = {
      permission_name,
    };

    //default is for default user mode
    if (req.body.default!= null)  {
      updatePermission.is_default = parseInt(req.body.default);
    }

    const updatedPermission = await Permission.findByIdAndUpdate({ _id: id }, { 
        $set: updatePermission 
        }, {new:true});

    //sending message to api
    return res.status(200).json({
      success: true,
      msg: "Permission updated successfully!",
      data: updatedPermission,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Permission ID is not found",
    });
  }
};

module.exports = {
  addPermission,
  getPermissions,
  deletePermission,
  updatePermission,
};
