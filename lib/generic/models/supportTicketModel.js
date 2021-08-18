/**
 * @author Mukesh Ratnu
 */

/*#################################            Load modules start            ########################################### */

const constants = require('../../constants')
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

/*#################################            Load modules end            ########################################### */

let supportTicket = new Schema({
    // ticketNo: { type: String, required: true },
    subject: { type: String },
    details: { type: String },
    reason: { type: String },
    projectId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Number },
    ticketStatus: { type: String, enum: [constants.SUPPORT_TICKET_STATUS.OPEN, constants.SUPPORT_TICKET_STATUS.INPROGRESS, constants.SUPPORT_TICKET_STATUS.COMPLETED], default: constants.SUPPORT_TICKET_STATUS.OPEN },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    comments: [{
        senderId: { type: mongoose.Schema.Types.ObjectId },
        // fullName: { type: String },
        msg: { type: String },
        createdAt: { type: Number }
    }]

}, {
    strict: true,
    versionKey: false,
    timestamp: true
});

module.exports = mongoose.model(constants.DB_MODEL_REF.SUPPORT_TICKETS, supportTicket);
