const accountSid =  process.env.TWILIO_ACCOUNT_SID; 
const authToken =  process.env.TWILIO_AUTH_TOKEN; 

 const twilio = require('twilio'); 

const client = twilio(accountSid, authToken); 

const sendMessage = async(req, res)=>{

    try {

        client.messages.create({
            from: 'whatsapp:+14155238886',
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: '{"1":"12/1","2":"3pm"}',
        to: 'whatsapp:+916353050357'
    })
    .then(message => console.log(message.sid));

        return res.status(200).json({ success: true,msg:'Message sent successfully' });
    } catch (error) {
        return res.status(400).json({ success: false,msg:error.message });
    }

} 

require('dotenv').config(); 
const axios = require('axios'); 

async function sendTemplateMessage(){
    try {
        const response = await axios({
            url: 'https://graph.facebook.com/v21.0/547795488423025/messages',
            method: 'POST',  // FIXED: Changed 'METHOD' to 'method'
            headers: {   // FIXED: Changed 'header' to 'headers'
                'Authorization' : `Bearer ${process.env.WHATSAPP_TOKEN}`,
                'Content-Type':'application/json', 
            },
            data: JSON.stringify({
                messaging_product: 'whatsapp', 
                to: '+918130026321',
                type: 'template',
                template: {
                    name: 'hello_world', 
                    language: { code: 'en_US' }
                }
            })
        });
        console.log(response.data);
    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response?.data || error.message);
    }
}
sendTemplateMessage()
module.exports = {
    sendMessage
}




