/**
 * @author Mukesh Ratnu
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require("mongoose");
const constants = require('../../constants');
let Schema = mongoose.Schema;

/*#################################            Load modules end            ########################################### */

let schema = new Schema({

    receiverId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Number },
    editedAt: { type: Number },
    categoryType: {
        type: String, enums: [constants.NOTIFICATION_CATEGORIES.PROJECT, constants.NOTIFICATION_CATEGORIES.PAYMENT,
        constants.NOTIFICATION_CATEGORIES.SUPPORT_TICKET, constants.NOTIFICATION_CATEGORIES.CHAT]
    },
    refId: { type: mongoose.Schema.Types.ObjectId },
    message: {
        type: String
    },
    status: {
        type: String,
        enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE],
        default: constants.STATUS.ACTIVE
    }

}, {
    strict: true,
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.NOTIFICATIONS, schema);