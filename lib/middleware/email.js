const nodemailer = require('nodemailer');
var twilio = require('twilio');
// var client = new twilio(process.env.accountSid, process.env.authToken);

function sendEmail(mailOptions, mailConfigs) {

    let EMAIL_CONFIG = {
        pool: true,
        host: process.env.smtp_host,
        port: process.env.smtp_port,
        secure: true,
        auth: {
            // type:'PLAIN',
            user: mailConfigs.emailId, // generated ethereal user
            pass: mailConfigs.password // generated ethereal password
        }
    }
    let transporter = nodemailer.createTransport(EMAIL_CONFIG)

    return transporter.sendMail(mailOptions);
}

/**
 * [createMailOption preparing a mail option model]
 * @param  {[type]} subject [subject of the mail]
 * @param  {[type]} html    [html content]
 * @param  {[type]} toMail  [reciever of the mail]
 * @return {[type]}         [object] 
 */
function createMailOption(subject, html, toMail, sender) {
    let mailOptions = {
        from: sender, // sender address
        to: toMail, // list of receivers
        subject: subject, // Subject line
        text: 'ReBaked', // plain text body
        html: html // html body
    };
    return mailOptions;
}

function value(cn) {
    return cn.replace(/\${(\w+)}/, '$1')
}

async function sending_logic(mailBodyDetails, templateDetails, mailConfigs) {

    if (templateDetails && (Object.keys(templateDetails).length > 0)) {
        let mailBody = templateDetails.mailBody;

        let idx = mailBody.match(new RegExp(/\${\w+}/g));
        if (idx && idx.length > 0) {
            idx.map((val, id) => {
                mailBody = mailBody.replace(/\${(\w+)}/, mailBodyDetails[value(idx[id])])
                return val;
            })
        };
        let returnedValue = await createMailOption(templateDetails.mailSubject, mailBody, mailBodyDetails.emailId, mailConfigs.emailId);
        return sendEmail(returnedValue, mailConfigs)
    } else {
        return true;
    }
}

function SEND_MAIL(mailBodyDetails, templateDetails, mailConfigs) {

    return sending_logic(mailBodyDetails, templateDetails, mailConfigs)
}

function SEND_CONTACT_US_QUERY_MAIL(mailBodyDetails, templateDetails, mailConfigs) {

    return sending_contact_us_query_logic(mailBodyDetails, templateDetails, mailConfigs)
}

function createMailOptionContactUsQuery(subject, html, toMail, fromMail) {

    let mailOptions = {
        from: fromMail, // sender address
        to: toMail, // list of receivers
        subject: subject, // Subject line
        text: 'ReBaked', // plain text body
        html: html, // html body
        replyTo: fromMail
    };
    return mailOptions;
}

async function sending_contact_us_query_logic(mailBodyDetails, templateDetails, mailConfigs) {

    if (templateDetails && (Object.keys(templateDetails).length > 0)) {
        let mailBody = templateDetails.mailBody;

        let idx = mailBody.match(new RegExp(/\${\w+}/g));
        if (idx && idx.length > 0) {
            idx.map((val, id) => {
                mailBody = mailBody.replace(/\${(\w+)}/, mailBodyDetails[value(idx[id])])
                return val;
            })
        };
        let returnedValue = await createMailOptionContactUsQuery(templateDetails.mailSubject, mailBody, mailBodyDetails.adminEmailId, mailBodyDetails.userEmailId);
        return sendEmail(returnedValue, mailConfigs)
    } else {
        return true;
    }

}

function convertNotificationMessage(nameObj, body) {

    let idx = body.match(new RegExp(/\${\w+}/g));
    if (idx && idx.length > 0) {
        idx.map((val, id) => {
            body = body.replace(/\${(\w+)}/, nameObj[value(idx[id])])
            return val;
        })
    };
    return body

}


function sendMessage(configs, msgBodyDetails, userContactNumber) {

    let client = new twilio(configs.accountSid, configs.authToken);

    let msgBody = configs.msgBody;

    let idx = msgBody.match(new RegExp(/\${\w+}/g));
    if (idx && idx.length > 0) {
        idx.map((val, id) => {
            msgBody = msgBody.replace(/\${(\w+)}/, msgBodyDetails[value(idx[id])])
            return val;
        })
    };

    return client.messages
        .create({ body: msgBody, from: configs.fromContact, to: userContactNumber })
        .then(message => {
            return message
        });
}
module.exports = {

    SEND_MAIL,

    convertNotificationMessage,

    sendMessage,

    SEND_CONTACT_US_QUERY_MAIL
}