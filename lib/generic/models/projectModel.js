/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
const constants = require('../../constants')

/*#################################            Load modules end            ########################################### */

const Schema = new mongoose.Schema({

    logo: { type: String, default: 'https://res.cloudinary.com/dizkwji5k/image/upload/v1624863422/tvbwjzetukvvjrzzdjol.png' },
    coverImage: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    websiteURL: { type: String },
    githubURL: { type: String },
    linkedIn: { type: String },
    twitter: { type: String },
    category: { type: String, required: true },
    bonus: { type: Number },
    projectCost: { type: Number, default: 0 },
    initiator: { type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    packages: [{
        name: { type: String },
        link: { type: String },
        projectType: { type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.MASTERS },
        issueType: { type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.MASTERS },
        minimumCost: { type: Number },
        expertiseLevel: { type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.MASTERS },
        startDate: { type: Number },
        endDate: { type: Number },
        description: { type: String },
        context: { type: String },
        acceptanceCriteria: { type: String },
        reference: { type: String },
        collaborators: [{ type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.USERS }],
        workStatus: {
            type: String, enum: [constants.PACKAGE_WORK_STATUS.OPEN, constants.PACKAGE_WORK_STATUS.INPROGRESS,
            constants.PACKAGE_WORK_STATUS.COMPLETED, constants.PACKAGE_WORK_STATUS.EXPIRED],
            default: constants.PACKAGE_WORK_STATUS.OPEN
        },
        workProgress: [{
            user: { type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.USERS },
            startedAt: { type: Number },
            submittedAt: { type: Number },
            status: {
                type: String, enum: [constants.USER_WORK_STATUS.INPROGRESS,
                constants.USER_WORK_STATUS.SUBMITTED, constants.USER_WORK_STATUS.SUBMISSION_APPROVED,
                constants.USER_WORK_STATUS.SUBMISSION_REJECTED]
            }
        }],
        requests: [{ type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.USERS }]
        // status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE },
    }],
    totalTeamMembers: [{ type: mongoose.Schema.ObjectId, ref: constants.DB_MODEL_REF.USERS }],
    createdAt: { type: Number },
    createdBy: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    editedAt: { type: Number },
    editedBy: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    projectStatus: {
        type: String, enum: [constants.PROJECT_STATUS.OPEN, constants.PROJECT_STATUS.INPROGRESS, constants.PROJECT_STATUS.COMPLETED, constants.PROJECT_STATUS.CLOSE], default: constants.PACKAGE_WORK_STATUS.OPEN
    },
    adminVerification: { type: String, enum: [constants.VERIFICATION_STATUS.PENDING, constants.VERIFICATION_STATUS.ACCEPTED, constants.VERIFICATION_STATUS.REJECTED], default: constants.VERIFICATION_STATUS.PENDING },
    FAQs: [{
        question: { type: String },
        answer: { type: String },
        status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE] }
    }]
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.PROJECTS, Schema);
