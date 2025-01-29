const express = require('express');
const { check } = require('express-validator');

exports.Validator = [
    check('permission_name', 'Permission Name is required').notEmpty(),
];

exports.deleteValidator = [
    check('id', 'ID is required').notEmpty(),
];

exports.updateValidator = [
    check('id', 'ID is required').notEmpty(),
    check('permission_name', 'Permission Name is required').notEmpty(),

];