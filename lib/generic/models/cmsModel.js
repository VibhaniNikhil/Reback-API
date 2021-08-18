/**
 * @author Mukesh Ratnu
 */
/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
const constants = require('../../constants')

/*#################################            Load modules end            ########################################### */

const Schema = mongoose.Schema({
    CMSName: {
        type: String, enum: [constants.CMS.ABOUTUS, constants.CMS.FEATURES,
        constants.CMS.CONTACTUS, constants.CMS.TEAM, constants.CMS.TERMSANDCONDITIONS,
        constants.CMS.PRIVACYPOLICY, constants.CMS.FAQ, constants.CMS.FOOTERLINKS],
        required: true
    },
    CMSPageDetails: { type: String, required: true },
    status: {
        type: String,
        enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE],
        default: constants.STATUS.ACTIVE
    },
    createdAt: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.DB_MODEL_REF.ADMINS },
    editedAt: { type: Number },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: constants.DB_MODEL_REF.ADMINS }
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})


module.exports = mongoose.model(constants.DB_MODEL_REF.CMS_PAGES, Schema)
