/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
const constants = require('../../constants')

/*#################################            Load modules end            ########################################### */

const Schema = new mongoose.Schema({

    type: {
        type: String, required: true,
        enum: [constants.MASTER_TYPES.PROJECT_TYPES, constants.MASTER_TYPES.ISSUE_TYPES,
        constants.MASTER_TYPES.COLLABORATOR_LEVEL, constants.MASTER_TYPES.SKILLS]
    },
    values: [{
        name: { type: String }
    }],
    status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE },
    createdAt: { type: Number },
    createdBy: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    editedAt: { type: Number },
    editedBy: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.MASTERS, Schema);
