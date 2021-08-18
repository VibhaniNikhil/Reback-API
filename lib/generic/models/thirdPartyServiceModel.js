/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const constants = require('../../constants')
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

/*#################################            Load modules end            ########################################### */

let thirdPartyService = new Schema({

    type: {
        type: String,
        enum: [constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY, constants.THIRD_PARTY_SERVICES.SMS_GATEWAY, constants.THIRD_PARTY_SERVICES.PAYMENT_GATEWAY],
        required: true
    },

    emailId: {
        type: String,
        required: function () {
            return (this.type == constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY) ? true : false
        }
    },
    password: {
        type: String,
        required: function () {
            return (this.type == constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY) ? true : false
        }
    },
    twilioAccountSID: {
        type: String,
        required: function () {
            return (this.type == constants.THIRD_PARTY_SERVICES.SMS_GATEWAY) ? true : false
        }
    },
    twilioAuthToken: {
        type: String,
        required: function () {
            return (this.type == constants.THIRD_PARTY_SERVICES.SMS_GATEWAY) ? true : false
        }
    },
    twilioContactNumber: {
        type: String,
        required: function () {
            return (this.type == constants.THIRD_PARTY_SERVICES.SMS_GATEWAY) ? true : false
        }
    },

    paymentClientSecret: { type: String },

    createdAt: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.DB_MODEL_REF.ADMINS },
    editedAt: { type: Number },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.DB_MODEL_REF.ADMINS },
    status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE }

}, {
    strict: false,
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model(constants.DB_MODEL_REF.THIRD_PARTY_SERVICE, thirdPartyService);
