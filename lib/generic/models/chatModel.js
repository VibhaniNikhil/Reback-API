/**
 * @author Mukesh Ratnu
 */
/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
const constants = require('../../constants')

/*#################################            Load modules end            ########################################### */

const schema = mongoose.Schema({

    participateId1: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    participateId2: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    data: [{
        sender: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
        receiver: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
        message: { type: String },
        time: { type: Number },
        category: { type: String, enum: [constants.MESSAGE_TYPES.TEXT, constants.MESSAGE_TYPES.FILE], default: constants.MESSAGE_TYPES.TEXT },
        // thumbnail: { type: String },
        fileType: { type: String },
        size: { type: String }
    }],
    lastMessageTime: { type: Number }
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.CHATS, schema);