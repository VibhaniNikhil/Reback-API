/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require("mongoose");
const constants = require('../../constants');
var Schema = mongoose.Schema;

/*#################################            Load modules end            ########################################### */

var schema = new Schema({

    type: { type: String, enum: [constants.TEMPLATE_TYPES.EMAIL, constants.TEMPLATE_TYPES.NOTIFICATION, constants.TEMPLATE_TYPES.BELL_NOTIFICATION] },
    mailName: {
        type: String,
        required: true,
        enum: [constants.EMAIL_TEMPLATES.USER_NEW_REGISTER_WELCOME,
        constants.EMAIL_TEMPLATES.NEW_VERIFICATION_CODE,
        constants.EMAIL_TEMPLATES.LOGIN,
        constants.EMAIL_TEMPLATES.USER_FORGOT_PASSWORD,
        constants.EMAIL_TEMPLATES.ADMIN_FORGOT_PASSWORD,
        constants.EMAIL_TEMPLATES.USER_RESET_PASSWORD,
        constants.EMAIL_TEMPLATES.ADMIN_RESET_PASSWORD,
        constants.EMAIL_TEMPLATES.CHANGE_EMAIL_ADDRESS,
        constants.EMAIL_TEMPLATES.NEW_SUPPORT_TICKET,
        constants.EMAIL_TEMPLATES.CONTACT_US_QUERY,
        constants.EMAIL_TEMPLATES.SUPPORT_TICKET_STATUS_CHANGE,
        constants.EMAIL_TEMPLATES.NOTIFY_CONTACT_NUMBER_CHANGE_REQUEST,
        constants.EMAIL_TEMPLATES.NOTIFY_SMS_VERIFICATION_CODE,
        constants.EMAIL_TEMPLATES.NOTIFY_FOR_NEW_USER_CREATED,
        constants.EMAIL_TEMPLATES.TWO_FACTOR_AUTHENTICATION_ENABLED,
        constants.EMAIL_TEMPLATES.TWO_FACTOR_AUTHENTICATION_DISABLED,
        constants.EMAIL_TEMPLATES.INVITE_FRIENDS,
        constants.EMAIL_TEMPLATES.NEW_USER_CREATED_BY_ADMIN,
        constants.EMAIL_TEMPLATES.NEW_PROJECT_CREATED,
        constants.EMAIL_TEMPLATES.NEW_JOIN_REQUEST,
        constants.EMAIL_TEMPLATES.JOIN_REQUEST_APPROVED,
        constants.EMAIL_TEMPLATES.JOIN_REQUEST_REJECTED,
        constants.EMAIL_TEMPLATES.PROJECT_APPROVED_BY_ADMIN,
        constants.EMAIL_TEMPLATES.PROJECT_REJECTED_BY_ADMIN,
        constants.EMAIL_TEMPLATES.NOTIFY_PROJECT_APPROVED_BY_ADMIN,
        constants.EMAIL_TEMPLATES.NOTIFY_PROJECT_REJECTED_BY_ADMIN,
        constants.EMAIL_TEMPLATES.NOTIFY_BONUS_RECEIVED,
        constants.EMAIL_TEMPLATES.NOTIFY_PAYMENT_RECEIVED,
        constants.EMAIL_TEMPLATES.NOTIFY_NEW_DISPUTE,
        constants.EMAIL_TEMPLATES.NOTIFY_UPDATE_PROJECT,
        constants.EMAIL_TEMPLATES.NOTIFY_NEW_MESSAGE

        ]
    },
    mailTitle: {
        type: String,
        required: function () {
            return (this.type == constants.TEMPLATE_TYPES.EMAIL) ? true : false
        }
    },
    mailBody: {
        type: String,
        required: function () {
            return (this.type == constants.TEMPLATE_TYPES.EMAIL) ? true : false
        }
    },
    mailSubject: {
        type: String,
        required: function () {
            return (this.type == constants.TEMPLATE_TYPES.EMAIL) ? true : false
        }
    },
    notificationMessage: {
        type: String,
        required: function () {
            return (this.type == constants.TEMPLATE_TYPES.NOTIFICATION) ? true : false
        }
    },
    createdAt: { type: Number },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: constants.DB_MODEL_REF.ADMINS
    },
    editedAt: { type: Number },
    editedBy: {
        type: mongoose.Types.ObjectId,
        ref: constants.DB_MODEL_REF.ADMINS
    },
    status: {
        type: String,
        enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE],
        default: constants.STATUS.ACTIVE
    },
}, {
    strict: true,
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.EMAILTEMPLATES, schema);