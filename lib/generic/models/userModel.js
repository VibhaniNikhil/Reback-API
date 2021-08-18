/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
const constants = require('../../constants')

/*#################################            Load modules end            ########################################### */

const Schema = new mongoose.Schema({
    fullName: { type: String },
    emailId: { type: String, lowercase: true },
    contactNumber: { type: String },
    password: { type: String, required: true },
    profilePicture: { type: String, default: 'https://res.cloudinary.com/dizkwji5k/image/upload/v1561362114/nbgeugd7hviq8kgjuacr.jpg' },
    OTP: { type: Number },
    isOTPVerified: { type: Boolean, default: false },
    twitterURL: { type: String },
    linkedIn: { type: String },
    githubURL: { type: String },
    document: [{
        type: { type: String },
        URL: { type: String },
        verified: { type: String, enum: [constants.VERIFICATION_STATUS.PENDING, constants.VERIFICATION_STATUS.ACCEPTED, constants.VERIFICATION_STATUS.REJECTED], default: constants.VERIFICATION_STATUS.PENDING },
        createdAt: { type: Date, default: new Date() },
        approvedAt: { type: Date }
    }],
    isPasswordReset: { type: Boolean, default: true },
    status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE },
    loginActivity: [{
        date: { type: Number },
        device: { type: String },
        browser: { type: String },
        ipaddress: { type: String },
        country: { type: String },
        state: { type: String },
        isLoggedOut: { type: Boolean, default: false },
        loggedOutAt: { type: Number },
        status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE }
    }],
    notifications: [{
        type: { type: String, enum: [constants.TEMPLATE_TYPES.EMAIL] },
        name: {
            type: String
        },
        status: { type: String, enum: [constants.STATUS.ACTIVE, constants.STATUS.INACTIVE], default: constants.STATUS.ACTIVE }
    }],

    basicInfo: { type: String },
    skills: [{ type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.MASTERS }],
    resumePicture: { type: String },

    jobPreferences: {
        jobStatus: { type: String },
        expectation: { type: String },
        languages: { type: String }
    },
    employmentHistory: [{
        designation: { type: String },
        company: { type: String },
        startDate: { type: Number },
        endDate: { type: Number },
    }],
    education: [{
        degree: { type: String },
        college: { type: String },
        startDate: { type: Number },
        endDate: { type: Number },
    }],
    portfolio: [{
        projectUrl: { type: String },
        projectTitle: { type: String },
        tags: [{
            type: String
        }],
        image: { type: String },
        isReBakedProject: { type: Boolean },
        createdAt: { type: Number },
    }],
    projects: [{ type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.PROJECTS }],
    createdAt: { type: Number },
    createdBy: { type: mongoose.Types.ObjectId },
    editedAt: { type: Number },
    editedBy: { type: mongoose.Types.ObjectId },
    referredBy: { type: mongoose.Types.ObjectId, ref: constants.DB_MODEL_REF.USERS },
    socketId: { type: String },
    isLoggedOut: { type: Boolean, default: false },
    adminVerification: { type: String, enum: [constants.VERIFICATION_STATUS.PENDING, constants.VERIFICATION_STATUS.ACCEPTED, constants.VERIFICATION_STATUS.REJECTED], default: constants.VERIFICATION_STATUS.PENDING },
}, {
    versionKey: false,
    timeStamp: true,
    strict: true
})

module.exports = mongoose.model(constants.DB_MODEL_REF.USERS, Schema);
