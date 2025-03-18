const express = require("express"); 
const router = express.Router(); 

const bodyParser= require('body-parser'); 
router.use(bodyParser.json()); 
router.use((bodyParser.urlencoded({extended: true}))); 

const userController = require('../controllers/userController'); 

router.post('/send-message', userController.sendMessage); 

module.exports = router; 