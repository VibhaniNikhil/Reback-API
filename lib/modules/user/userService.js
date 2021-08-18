/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const dao = require('./userDao')
const usrConst = require('./userConstants')
const mapper = require('./userMapper')
const constants = require('../../constants')
const appUtils = require('../../appUtils')
const jwtHandler = require('../../middleware/jwtHandler')
const ObjectId = require('mongoose').Types.ObjectId
const mailHandler = require('../../middleware/email')
const redisServer = require('../../redis')
const socketHandler = require('../../middleware/socketHandler')
var fuzzySearch = require('fuzzy-search');


/*#################################            Load modules end            ########################################### */

/**
 * First step of registration process to check duplications of email id and contact number
 * @param {Object} details email id and contact number to check duplications
 */
function firstStepRegister(details) {

    if (!details || Object.keys(details).length == 0) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let emailQuery = {
            emailId: details.emailId.toLowerCase()
        }

        let contactQuery = {
            contactNumber: details.contactNumber
        }

        return Promise.all([dao.getUserDetails(emailQuery), dao.getUserDetails(contactQuery)]).then((results) => {

            if (results[0]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.EmailAlreadyExists)

            } else if (results[1]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.ContactNumberAlreadyExists)
            } else {

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success)
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Register user
 * @param {Object} details user details to get registered
 * @param {String} queryParams id of referral user
 */
function secondStepRegister(details, queryParams) {

    if (!details || Object.keys(details).length == 0) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let emailQuery = {
            emailId: details.emailId.toLowerCase()
        }

        let contactQuery = {
            contactNumber: details.contactNumber
        }

        return Promise.all([dao.getUserDetails(emailQuery), dao.getUserDetails(contactQuery)]).then(async (results) => {

            if (results[0]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.EmailAlreadyExists)

            } else if (results[1]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.ContactNumberAlreadyExists)

            } else {

                let convertedPass = await appUtils.convertPass(details.password);
                details.password = convertedPass

                let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                console.log({ verificationCode })

                details.OTP = verificationCode
                details.createdAt = new Date().getTime()

                let loginActivity = []
                loginActivity.push({
                    device: details.device,
                    date: details.date,
                    browser: details.browser,
                    ipaddress: details.ipaddress,
                    country: details.country,
                    state: details.state,
                    status: constants.STATUS.ACTIVE
                })

                details.loginActivity = loginActivity

                let emailThirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }
                let SMSThirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.SMS_GATEWAY
                }

                let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)
                if (emailServiceDetails) {

                    // Welcome user mail
                    let welcomeMailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.USER_NEW_REGISTER_WELCOME,
                        status: constants.STATUS.ACTIVE
                    }
                    let welcomeMailTemplateDetails = await dao.getTemplateDetails(welcomeMailQuery)
                    if (welcomeMailTemplateDetails) {

                        let newUserObj = {
                            fullName: details.fullName,
                            emailId: details.emailId.toLowerCase()
                        }
                        let mailSent = mailHandler.SEND_MAIL(newUserObj, welcomeMailTemplateDetails, emailServiceDetails)
                        console.log({ mailSent })
                    }

                    // Send security code mail
                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.NEW_VERIFICATION_CODE,
                        status: constants.STATUS.ACTIVE
                    }

                    let templateDetails = await dao.getTemplateDetails(mailQuery)
                    if (templateDetails) {

                        let userObj = {
                            fullName: details.fullName,
                            emailId: details.emailId.toLowerCase(),
                            verificationCode: verificationCode
                        }
                        let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, emailServiceDetails)
                        console.log({ mailSent })
                    }
                }

                let SMSServiceDetails = await dao.getServiceDetails(SMSThirdPartyServiceQuery)

                if (SMSServiceDetails) {

                    let twilioConfig = {
                        accountSid: SMSServiceDetails.twilioAccountSID,
                        authToken: SMSServiceDetails.twilioAuthToken,
                        fromContact: SMSServiceDetails.twilioContactNumber
                    }

                    // take msg template from database
                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.NOTIFICATION,
                        mailName: constants.EMAIL_TEMPLATES.NOTIFY_SMS_VERIFICATION_CODE,
                        status: constants.STATUS.ACTIVE
                    }
                    let templateDetails = await dao.getTemplateDetails(mailQuery)
                    if (templateDetails) {

                        twilioConfig.msgBody = templateDetails.notificationMessage;

                        let usrObj = {
                            verificationCode: verificationCode
                        }
                        let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, details.contactNumber)
                        console.log({ twilioResponse })
                    }
                }

                if (queryParams.referralId) {

                    details.referredBy = queryParams.referralId
                }
                return dao.createUser(details).then((userCreated) => {

                    if (userCreated) {

                        let filteredUserResponseFields = mapper.filteredUserResponseFields(userCreated)

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.VerificationCodeSentToBoth, filteredUserResponseFields)

                    } else {

                        console.log("Failed to save user")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Verify security code
 * @param {String} id mongo id of user
 * @param {String} code security code to be verified
 */
function verifySecurityCode(id, code) {

    if (!id || !ObjectId.isValid(id) || !code) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let updateObj = {
                    isOTPVerified: true
                }

                return dao.updateProfile(query, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)

                        let usrObj = {
                            _id: userUpdated._id,
                            emailId: userUpdated.emailId.toLowerCase(),
                            contactNumber: userUpdated.contactNumber
                        }
                        let userNotificationQuery = {
                            receiverId: id,
                            isRead: false
                        }
                        return Promise.all([jwtHandler.genUsrToken(usrObj), dao.getNotificationDetails(userNotificationQuery)]).then((results) => {

                            let token = results[0]
                            if (results[1]) {

                                filteredUserResponseFields.isNotification = true
                            } else {

                                filteredUserResponseFields.isNotification = false

                            }
                            filteredUserResponseFields.token = token

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.VerificationSuccess, filteredUserResponseFields)
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })

                    } else {

                        console.log("Failed to update user profile")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidVerificationCode)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Resend verification code
 * @param {String} id mongo id of user
 * @param {Object} details email id or contact number on which verification code is to be sent
 */
function resendCode(id, details) {

    if (!id || !details || (Object.keys(details).length == 0)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }
        return dao.getUserDetails(query).then(async (userDetails) => {

            let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
            console.log({ verificationCode })

            let updateObj = {}
            updateObj.OTP = verificationCode

            if (details.emailId) {

                let thirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }

                let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                if (serviceDetails) {

                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.NEW_VERIFICATION_CODE,
                        status: constants.STATUS.ACTIVE
                    }
                    let templateDetails = await dao.getTemplateDetails(mailQuery)
                    if (templateDetails) {

                        let userMailObj = {
                            fullName: userDetails.fullName,
                            emailId: userDetails.emailId.toLowerCase(),
                            verificationCode: verificationCode
                        }
                        let mailSent = mailHandler.SEND_MAIL(userMailObj, templateDetails, serviceDetails)
                        console.log({ mailSent })
                    }
                }

            } else {

                let thirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.SMS_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }

                let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)

                if (serviceDetails) {

                    let twilioConfig = {
                        accountSid: serviceDetails.twilioAccountSID,
                        authToken: serviceDetails.twilioAuthToken,
                        fromContact: serviceDetails.twilioContactNumber
                    }

                    // take msg template from database
                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.NOTIFICATION,
                        mailName: constants.EMAIL_TEMPLATES.NOTIFY_SMS_VERIFICATION_CODE,
                        status: constants.STATUS.ACTIVE
                    }
                    let templateDetails = await dao.getTemplateDetails(mailQuery)
                    if (templateDetails) {

                        twilioConfig.msgBody = templateDetails.notificationMessage;

                        let usrObj = {
                            verificationCode: verificationCode
                        }
                        let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, details.contactNumber)
                        console.log({ twilioResponse })
                    }
                }

            }

            return dao.updateProfile(query, updateObj).then((userUpdated) => {

                if (userUpdated) {

                    if (details.emailId) {

                        return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.EmailChangeVerificationSent)
                    } else {

                        return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.ContactChangeVerificationSent)
                    }

                } else {

                    console.log("Failed to update new verification code")
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                }
            }).catch((err) => {

                console.log({ err })
                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
            })


        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Login
 * @param {Object} details user details
 */
function login(details) {

    if (!details || Object.keys(details).length == 0) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            status: constants.STATUS.ACTIVE
        }
        if (details.emailId) {

            query.emailId = details.emailId.toLowerCase()
        }
        if (details.contactNumber) {

            query.contactNumber = details.contactNumber
        }

        return dao.getUserDetails(query).then(async (userDetails) => {

            if (userDetails) {

                let isValidPassword = await appUtils.verifyPassword(details, userDetails)
                console.log({ isValidPassword })

                if (isValidPassword) {

                    let prevLoginActivities = userDetails.loginActivity

                    prevLoginActivities.push({
                        device: details.device,
                        date: details.date,
                        browser: details.browser,
                        ipaddress: details.ipaddress,
                        country: details.country,
                        state: details.state,
                    })
                    let updateObj = {
                        loginActivity: prevLoginActivities
                    }

                    let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                    console.log({ verificationCode })

                    updateObj.OTP = verificationCode
                    updateObj.isOTPVerified = false
                    // If login is attempted by email id, then verification code is to be sent to registered email address
                    // If login is attempted by contact number, then verification code is to be sent to registered contact number

                    if (details.emailId) {

                        let thirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                        if (serviceDetails) {

                            let mailQuery = {
                                type: constants.TEMPLATE_TYPES.EMAIL,
                                mailName: constants.EMAIL_TEMPLATES.NEW_VERIFICATION_CODE,
                                status: constants.STATUS.ACTIVE
                            }
                            let templateDetails = await dao.getTemplateDetails(mailQuery)
                            if (templateDetails) {

                                let userMailObj = {
                                    fullName: userDetails.fullName || 'User',
                                    emailId: userDetails.emailId.toLowerCase(),
                                    verificationCode: verificationCode
                                }
                                let mailSent = mailHandler.SEND_MAIL(userMailObj, templateDetails, serviceDetails)
                                console.log({ mailSent })
                            }
                        }
                    } else {

                        let thirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.SMS_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)

                        if (serviceDetails) {

                            let twilioConfig = {
                                accountSid: serviceDetails.twilioAccountSID,
                                authToken: serviceDetails.twilioAuthToken,
                                fromContact: serviceDetails.twilioContactNumber
                            }

                            // take msg template from database
                            let mailQuery = {
                                type: constants.TEMPLATE_TYPES.NOTIFICATION,
                                mailName: constants.EMAIL_TEMPLATES.NOTIFY_SMS_VERIFICATION_CODE,
                                status: constants.STATUS.ACTIVE
                            }
                            let templateDetails = await dao.getTemplateDetails(mailQuery)
                            if (templateDetails) {

                                twilioConfig.msgBody = templateDetails.notificationMessage;

                                let usrObj = {
                                    verificationCode: verificationCode
                                }
                                let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, details.contactNumber)
                                console.log({ twilioResponse })
                            }
                        }
                    }

                    return dao.updateProfile(query, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)

                            if (details.emailId) {

                                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmailChangeVerificationSent, filteredUserResponseFields)
                            } else {

                                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ContactChangeVerificationSent, filteredUserResponseFields)
                            }

                        } else {

                            console.log("Failed to update verification code")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidPassword)

                }
            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Get user profile
 * @param {String} id mongo id of user
 */
function getProfile(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let filteredUserResponseFields = mapper.filteredUserResponseFields(userDetails)
                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, filteredUserResponseFields)

            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update profile
 * @param {String} id mongo id of user
 * @param {Object} details details to be updated
 */
function updateProfile(id, details) {

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                if (details.emailId) {

                    delete details.emailId
                }
                if (details.contactNumber) {

                    delete details.contactNumber
                }
                details.editedAt = new Date().getTime()

                return dao.updateProfile(query, details).then((userUpdated) => {

                    if (userUpdated) {
                        let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)
                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ProfileUpdated, filteredUserResponseFields)

                    } else {

                        console.log("Failed to update profile")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Forgot password
 * @param {String} emailId email id of user to send password recovery link
 */
function forgotPassword(emailId) {

    if (!emailId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            emailId: emailId.toLowerCase()
        }
        return dao.getUserDetails(query).then(async (isExist) => {

            if (isExist) {

                let obj = {
                    type: 'FORGOT',
                    userId: isExist._id,
                    emailId: isExist.emailId.toLowerCase(),
                    isActive: true,
                    expiryTime: (new Date().getTime() + (30 * 60 * 1000))
                }

                let redisId = await redisServer.setRedisDetails(obj);

                console.log({ redisId })

                let thirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }

                let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                if (serviceDetails) {

                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.USER_FORGOT_PASSWORD,
                        status: constants.STATUS.ACTIVE
                    }
                    let templateDetails = await dao.getTemplateDetails(mailQuery);

                    if (templateDetails) {
                        let usrObj = {
                            fullName: isExist.fullName || 'User',
                            emailId: isExist.emailId.toLowerCase(),
                            redisId: redisId
                        }
                        let mailSent = mailHandler.SEND_MAIL(usrObj, templateDetails, serviceDetails)
                    }
                }

                return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.ResetPasswordMailSent)

            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((e) => {

            console.log({ e })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Set new password
 * @param {string} redisId redis id for recovering password
 * @param {string} password new password to set
 */
async function setNewPassword(redisId, password) {

    if (!redisId || !password) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let isUserExists = await redisServer.getRedisDetails(redisId)

        if (isUserExists) {

            let newPass = await appUtils.convertPass(password);

            let query = {
                _id: isUserExists.userId
            }
            let updateObj = {
                password: newPass
            }
            return dao.updateProfile(query, updateObj).then(async (updateDone) => {

                if (updateDone) {

                    let thirdPartyServiceQuery = {
                        type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                        status: constants.STATUS.ACTIVE
                    }

                    let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                    if (serviceDetails) {

                        let query = {
                            mailName: constants.EMAIL_TEMPLATES.USER_RESET_PASSWORD,
                            status: constants.STATUS.ACTIVE
                        }
                        let templateDetails = await dao.getTemplateDetails(query);

                        if (!updateDone.fullName) {
                            updateDone.fullName = 'User'
                        }
                        let mailBodyDetails = updateDone

                        let mailConfig = mailHandler.SEND_MAIL(mailBodyDetails, templateDetails, serviceDetails)
                    }

                    return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.PasswordUpdateSuccess)

                } else {
                    console.log("Failed to reset password");
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                }

            }).catch((e) => {

                console.log({ e })
                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
            })

        } else {

            return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ResetPasswordLinkExpired)
        }
    }
}

/**
 * Reset password
 * @param {string} id mongo id of admin
 * @param {string} oldPassword old password to verify
 * @param {string} newPassword new password to reset
 */
function resetPassword(id, oldPassword, newPassword) {

    if (!id || !ObjectId.isValid(id) || !oldPassword || !newPassword) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let passObj = {
                    password: oldPassword
                }
                return appUtils.verifyPassword(passObj, userDetails).then(async (isPasswordMatch) => {

                    if (isPasswordMatch) {

                        let password = newPassword;
                        let newPass = await appUtils.convertPass(password);

                        let updateObj = {
                            password: newPass
                        }

                        if (!userDetails.isPasswordReset) {

                            updateObj.isPasswordReset = true
                        }
                        return dao.updateProfile(query, updateObj).then(async (updateDone) => {

                            if (updateDone) {

                                let userNotificationSettings = userDetails.notifications

                                let notificationObj = userNotificationSettings.find(obj => obj.type == constants.TEMPLATE_TYPES.EMAIL && obj.name == constants.EMAIL_TEMPLATES.USER_RESET_PASSWORD && obj.status == constants.STATUS.ACTIVE)
                                console.log({ notificationObj })

                                if (notificationObj) {

                                    let thirdPartyServiceQuery = {
                                        type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                                        status: constants.STATUS.ACTIVE
                                    }

                                    let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                                    if (serviceDetails) {

                                        let query = {
                                            mailName: constants.EMAIL_TEMPLATES.USER_RESET_PASSWORD,
                                            status: constants.STATUS.ACTIVE
                                        }
                                        let templateDetails = await dao.getTemplateDetails(query)

                                        if (!updateDone.fullName) {
                                            updateDone.fullName = 'User'
                                        }
                                        let mailBodyDetails = updateDone

                                        let mailConfig = mailHandler.SEND_MAIL(mailBodyDetails, templateDetails, serviceDetails)
                                    }
                                }

                                return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.PasswordUpdateSuccess)

                            } else {
                                console.log("Failed to reset password");
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            }
                        }).catch((e) => {

                            console.log({ e });
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })
                    } else {

                        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.OldPasswordNotMatch)
                    }
                }).catch((e) => {

                    console.log({ e });
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Logout
 * @param {String} id mongo id of user
 * @param {String} activityId mongo id of login activity to be inactivated
 */
function logout(id, activityId) {

    if (!id || !ObjectId.isValid(id) || !activityId || !ObjectId.isValid(activityId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let activities = userDetails.loginActivity
                let index = activities.findIndex(obj => obj._id == activityId)

                if (index > -1) {

                    let activity = activities[index]

                    activity.isLoggedOut = true
                    activity.loggedOutAt = new Date().getTime()

                    activities[index] = activity
                    // activities.splice(index, 1)

                    let updateObj = {
                        loginActivity: activities,
                    }

                    return dao.updateProfile(query, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.LogoutSuccess)

                        } else {

                            console.log("Failed to update user login status")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                } else {

                    return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.Success)
                }
            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all system login activities
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination fields to fetch records
 */
function getAllActivities(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let activities = userDetails.loginActivity

                let totalRecords = activities.length

                if (activities.length > 0) {
                    let skip = 0
                    let limit = 10
                    if (queryParams.skip) {
                        skip = queryParams.skip
                    }
                    if (queryParams.limit) {
                        limit = queryParams.limit
                    }
                    activities = activities.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))
                }

                let finalResponseObj = {
                    "draw": 0,
                    "recordsTotal": totalRecords,
                    "recordsFiltered": activities.length,
                    "data": activities
                }
                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, finalResponseObj)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}


/**
 * Remove or disable system activity
 * @param {String} id mongo id of user
 * @param {String} activityId mongo id of system activity to be inactivated
 */
function removeActivity(id, activityId) {

    if (!id || !ObjectId.isValid(id) || !activityId || !ObjectId.isValid(activityId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                query['loginActivity._id'] = activityId
                let updateObj = {
                    'loginActivity.$.status': constants.STATUS.INACTIVE
                }

                return dao.updateProfile(query, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        let activities = userUpdated.loginActivity

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.SingleActivityRemoved, activities)

                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Remove or disable all system activities
 * @param {String} id mongo id of user
 */
function removeAllActivities(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let updateObj = {
                    'loginActivity.$[].status': constants.STATUS.INACTIVE
                }

                return dao.updateProfileMultipleFields(query, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        let activities = userUpdated.loginActivity

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.MultipleActivitiesRemoved, activities)

                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Change email address
 * @param {String} id mongo id of admin
 * @param {String} emailId new email id to be set
 */
function changeEmailRequest(id, emailId) {

    if (!id || !ObjectId.isValid(id) || !emailId || !appUtils.isValidEmail(emailId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let duplicateEmailQuery = {
            emailId: emailId.toLowerCase(),
            _id: { $ne: id }
        }

        return Promise.all([dao.getUserDetails(adminQuery), dao.getUserDetails(duplicateEmailQuery)]).then(async (details) => {

            if (!details[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (details[1]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.EmailAlreadyExists)
            } else {

                if (details[0].emailId.toLowerCase() == emailId.toLowerCase()) {

                    let updateObj = {

                        emailId: emailId.toLowerCase(),
                        editedAt: new Date().getTime()
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)
                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmailResetSuccessful, filteredUserResponseFields)

                        } else {

                            console.log("Failed to update email id")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                } else {

                    let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                    console.log({ verificationCode })

                    let updateObj = {
                        OTP: verificationCode
                    }

                    let thirdPartyServiceQuery = {
                        type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                        status: constants.STATUS.ACTIVE
                    }

                    let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                    if (serviceDetails) {

                        let mailQuery = {
                            type: constants.TEMPLATE_TYPES.EMAIL,
                            mailName: constants.EMAIL_TEMPLATES.CHANGE_EMAIL_ADDRESS,
                            status: constants.STATUS.ACTIVE
                        }
                        let templateDetails = await dao.getTemplateDetails(mailQuery)
                        if (templateDetails) {

                            let userObj = {
                                emailId: emailId.toLowerCase(),
                                verificationCode: verificationCode
                            }
                            let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, serviceDetails)
                            console.log({ mailSent })
                        }
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.EmailChangeVerificationSent)

                        } else {

                            console.log("Failed to update verificationCode")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                }
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update email
 * @param {String} id mongo id of admin
 * @param {String} code security code for verification
 * @param {String} emailId new email id to be set
 */
function updateEmail(id, code, emailId) {

    if (!id || !ObjectId.isValid(id) || !code || !emailId || !appUtils.isValidEmail(emailId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let updateObj = {
                    emailId: emailId.toLowerCase(),
                    editedAt: new Date().getTime()
                }

                return dao.updateProfile(query, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)
                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmailResetSuccessful, filteredUserResponseFields)

                    } else {

                        console.log("Failed to update email id")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidVerificationCode)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Change contact number request
 * @param {String} id mongo id of admin
 * @param {String} contactNumber new contact number to be set
 */
function changeContactRequest(id, contactNumber) {

    if (!id || !ObjectId.isValid(id) || !contactNumber) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let duplicateContactQuery = {
            contactNumber: contactNumber,
            _id: { $ne: id }
        }

        return Promise.all([dao.getUserDetails(adminQuery), dao.getUserDetails(duplicateContactQuery)]).then(async (details) => {

            if (!details[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (details[1]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.ContactNumberAlreadyExists)
            } else {

                if (details[0].contactNumber == contactNumber) {

                    let updateObj = {

                        contactNumber: contactNumber,
                        editedAt: new Date().getTime()
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)
                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ContactResetSuccessful, filteredUserResponseFields)

                        } else {

                            console.log("Failed to update email id")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                } else {

                    let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                    console.log({ verificationCode })

                    let updateObj = {
                        OTP: verificationCode
                    }

                    let thirdPartyServiceQuery = {
                        type: constants.THIRD_PARTY_SERVICES.SMS_GATEWAY,
                        status: constants.STATUS.ACTIVE
                    }

                    let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)

                    if (serviceDetails) {

                        let twilioConfig = {
                            accountSid: serviceDetails.twilioAccountSID,
                            authToken: serviceDetails.twilioAuthToken,
                            fromContact: serviceDetails.twilioContactNumber
                        }

                        // take msg template from database
                        let mailQuery = {
                            type: constants.TEMPLATE_TYPES.NOTIFICATION,
                            mailName: constants.EMAIL_TEMPLATES.NOTIFY_CONTACT_NUMBER_CHANGE_REQUEST,
                            status: constants.STATUS.ACTIVE
                        }
                        let templateDetails = await dao.getTemplateDetails(mailQuery)
                        if (templateDetails) {

                            twilioConfig.msgBody = templateDetails.notificationMessage;

                            let usrObj = {
                                verificationCode: verificationCode
                            }
                            let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, contactNumber)
                            console.log({ twilioResponse })
                        }
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((userUpdated) => {

                        if (userUpdated) {

                            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.ContactChangeVerificationSent)

                        } else {

                            console.log("Failed to update verificationCode")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                }
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update contact number
 * @param {String} id mongo id of admin
 * @param {String} code security code for verification
 * @param {String} contactNumber new contact number to be set
 */
function updateContact(id, code, contactNumber) {

    if (!id || !ObjectId.isValid(id) || !code || !contactNumber) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (userDetails) {

                let updateObj = {
                    contactNumber: contactNumber,
                    editedAt: new Date().getTime()
                }

                return dao.updateProfile(query, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        let filteredUserResponseFields = mapper.filteredUserResponseFields(userUpdated)
                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ContactResetSuccessful, filteredUserResponseFields)

                    } else {

                        console.log("Failed to update contact number")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidVerificationCode)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get CMS page details
 * @param {String} CMSName CMS page name to be fetched
 */
function getCMSDetails(CMSName) {

    if (!CMSName) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let cmsQuery = {
            CMSName: CMSName,
            status: constants.STATUS.ACTIVE
        }

        return dao.getCMSDetails(cmsQuery).then((cmsData) => {

            if (cmsData) {

                let filteredCmsResponseFields = mapper.filteredCmsResponseFields(cmsData)
                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, filteredCmsResponseFields)

            } else {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.CMSPageNotFound)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }

}

/**
 * Get master details list
 * @param {String} id mongo id of user
 */
async function getMasterDetails(id) {

    if (id) {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let userDetails = await dao.getUserDetails(query)

        if (!userDetails) {

            return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

        }
    }

    let masterQuery = {}

    return dao.getAllMasters(masterQuery).then((results) => {

        if (!results) {

            return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.MasterNotFound)
        } else {

            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, results)
        }
    }).catch((err) => {

        console.log({ err })
        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
    })

    // let masterQuery = {}

    // return dao.getAllMasters(masterQuery).then((results) => {
    //     console.log("this is result of master details ", results)
    //     // if (!results[0]) {

    //     //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
    //     // } else 
    //     if (!results) {

    //         return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.MasterNotFound)
    //     } else {

    //         return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, results)
    //     }
    // }).catch((err) => {

    //     console.log({ err })
    //     return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
    // })
    // }
}

/**
 * Create project
 * @param {String} id mongo id of admin
 * @param {Object} details project details to be added
 */
function createProject(id, details) {

    if (!id || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                details.createdAt = new Date().getTime()
                details.createdBy = id
                details.initiator = id

                let emailThirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }
                let newProjectMailQuery = {
                    type: constants.TEMPLATE_TYPES.EMAIL,
                    mailName: constants.EMAIL_TEMPLATES.NEW_PROJECT_CREATED,
                    status: constants.STATUS.ACTIVE
                }
                let adminQuery = {}
                return Promise.all([dao.createProject(details), dao.getServiceDetails(emailThirdPartyServiceQuery), dao.getTemplateDetails(newProjectMailQuery), dao.getAdminDetails(adminQuery)]).then((results) => {

                    let projectCreated = results[0]
                    let emailServiceDetails = results[1]
                    let newProjectMailTemplateDetails = results[2]
                    let adminDetails = results[3]

                    if (projectCreated) {

                        let userProjects = []
                        if (userDetails.projects) {
                            userProjects = userDetails.projects
                        }

                        userProjects.push(projectCreated._id)
                        let userUpdateObj = { projects: userProjects }

                        return dao.updateProfile(query, userUpdateObj).then((userUpdated) => {

                            // Send mail to super admin
                            if (emailServiceDetails) {

                                if (newProjectMailTemplateDetails) {

                                    let mailObj = {
                                        fullName: adminDetails.fullName,
                                        initiatorName: userDetails.fullName,
                                        emailId: adminDetails.emailId.toLowerCase(),
                                        title: projectCreated.title
                                    }
                                    let mailSent = mailHandler.SEND_MAIL(mailObj, newProjectMailTemplateDetails, emailServiceDetails)
                                    console.log({ mailSent })
                                }
                            }

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ProjectCreatedSuccess, projectCreated)

                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })

                    } else {

                        console.log("Failed to create project")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get project initiated by user
 * @param {String} id mongo id of user
 * @param {Object} queryParams sorting, searching and paginations to be applied
 * @param {Object} filters filters to be applied
 */
function getMyInitiatedProjects(id, queryParams, filters) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then(async (userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let aggregateCountQuery = [
                    {
                        $unwind: {
                            path: '$totalTeamMembers',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "totalTeamMembers",
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$userDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "initiator",
                            foreignField: '_id',
                            as: 'initiatorDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$initiatorDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        "$group": {
                            "_id": "$_id",
                            'logo': { "$first": "$logo" },
                            'coverImage': { "$first": "$coverImage" },
                            'title': { "$first": "$title" },
                            'description': { "$first": "$description" },
                            'websiteURL': { "$first": "$websiteURL" },
                            'githubURL': { "$first": "$githubURL" },
                            'linkedIn': { "$first": "$linkedIn" },
                            'twitter': { "$first": "$twitter" },
                            'category': { "$first": "$category" },
                            'adminVerification': { "$first": "$adminVerification" },
                            'bonus': { "$first": "$bonus" },
                            'projectCost': { "$first": "$projectCost" },
                            'initiatorDetails': { "$first": "$initiatorDetails" },
                            'totalTeamMembers': { "$push": "$userDetails" },
                            'packages': { "$first": "$packages" },
                            'projectStatus': { "$first": "$projectStatus" },
                            'createdAt': { "$first": "$createdAt" },
                            'editedAt': { "$first": "$editedAt" },
                        }
                    }, {
                        "$project": {
                            "_id": 1,
                            'logo': 1,
                            'coverImage': 1,
                            'title': 1,
                            'description': 1,
                            'websiteURL': 1,
                            'githubURL': 1,
                            'linkedIn': 1,
                            'twitter': 1,
                            'category': 1,
                            'adminVerification': 1,
                            'bonus': 1,
                            'projectCost': 1,
                            'initiatorDetails._id': 1,
                            'initiatorDetails.fullName': 1,
                            'totalTeamMembers._id': 1,
                            'totalTeamMembers.fullName': 1,
                            'totalTeamMembers.profilePicture': 1,
                            'totalMembers': { "$size": "$totalTeamMembers" },
                            'packages': 1,
                            'projectStatus': 1,
                            'createdAt': 1,
                            'editedAt': 1,
                            'projectStartDate': { $min: '$packages.startDate' },
                            'projectEndDate': { $max: '$packages.endDate' }
                        }
                    }
                ]

                let projectQuery = {
                    "$and": [
                        {
                            '$or': [{
                                'initiatorDetails._id': ObjectId(id),
                            }, {
                                'totalTeamMembers._id': ObjectId(id)
                            }]
                        }
                    ]
                }

                if (queryParams.search) {

                    projectQuery['$or'] = [
                        { 'title': { '$regex': queryParams.search, '$options': 'i' } },
                        // { 'description': { '$regex': queryParams.search, '$options': 'i' } },
                        // { 'websiteURL': { '$regex': queryParams.search, '$options': 'i' } },
                        { 'githubURL': { '$regex': queryParams.search, '$options': 'i' } },
                        // { 'linkedIn': { '$regex': queryParams.search, '$options': 'i' } },
                        // { 'twitter': { '$regex': queryParams.search, '$options': 'i' } },
                        { 'category': { '$regex': queryParams.search, '$options': 'i' } },
                    ]
                }
                if (filters.minPrice) {
                    projectQuery['projectCost'] = {
                        $lte: parseInt(filters.maxPrice),
                        $gte: parseInt(filters.minPrice)
                    }
                }
                if (filters.projectStatus) {
                    projectQuery.projectStatus = filters.projectStatus
                }
                if (filters.collaboratorLevel) {
                    projectQuery['packages'] = {
                        '$elemMatch': { 'expertiseLevel': filters.collaboratorLevel }
                    }
                }
                if (filters.deliveryDate) {
                    projectQuery['packages.endDate'] = {
                        "$gt": new Date().getTime(),
                        "$lt": parseInt(filters.deliveryDate)
                    }
                }
                if (filters.membersRange.length > 0) {
                    let totalMembersQuery = []
                    filters.membersRange.map((obj) => {

                        if (obj == "0-5") {

                            totalMembersQuery.push({ totalMembers: { "$lt": 5 } })
                            // projectQuery['totalMembers'] = { "$lt": 5 }
                        } else if (obj == "5-10") {

                            totalMembersQuery.push({ totalMembers: { "$gte": 5, "$lt": 10 } })
                            // projectQuery['totalMembers'] = { "$gte": 5, "$lt": 10 }
                        } else if (obj == "10-15") {

                            totalMembersQuery.push({ totalMembers: { "$gte": 10, "$lt": 15 } })
                            // projectQuery['totalMembers'] = { "$gte": 10, "$lt": 15 }
                        } else if (obj == "15-20") {

                            totalMembersQuery.push({ totalMembers: { "$gte": 15, "$lt": 20 } })
                            // projectQuery['totalMembers'] = { "$gte": 15, "$lt": 20 }
                        } else {

                            totalMembersQuery.push({ totalMembers: { "$gte": 20 } })
                            // projectQuery['totalMembers'] = { "$gte": 20 }
                        }
                    })
                    projectQuery['$and'].push({ '$or': totalMembersQuery })

                }

                aggregateCountQuery.push({ $match: projectQuery })

                let totalProjects = await dao.getAllProjects(aggregateCountQuery)

                let sortQuery = {}
                if (queryParams.column) {

                    sortQuery[queryParams.column] = ((queryParams.dir == "asc") ? 1 : -1)
                } else {

                    sortQuery['createdAt'] = -1
                }

                aggregateCountQuery.push({ $sort: sortQuery })

                aggregateCountQuery.push({
                    $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                }, {
                    $limit: parseInt(queryParams.limit)
                })

                return dao.getAllProjects(aggregateCountQuery).then((projects) => {

                    let respObj = {
                        "recordsTotal": totalProjects.length,
                        "recordsFiltered": projects.length,
                        "records": projects
                    }

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details details to be updated
 */
function updateProject(id, projectId, details) {

    if (!id || !projectId || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                if (results[1].initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.UpdatingProjectNotAllowed)

                } else {

                    details.editedAt = new Date().getTime()
                    details.editedBy = id
                    return dao.updateProject(projectQuery, details).then((updated) => {

                        if (updated) {

                            // let notificationQuery = {
                            //     mailName: constants.EMAIL_TEMPLATES.NOTIFY_NEW_DISPUTE,
                            //     status: constants.STATUS.ACTIVE
                            // }
                            // let notificationTemplateDetails = await dao.getTemplateDetails(notificationQuery)
                            // if (notificationTemplateDetails) {

                            //     let notificationMessage = notificationTemplateDetails.notificationMessage

                            //     let obj = {
                            //         fullName: userDetails.fullName,
                            //     }
                            //     notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                            //     let notificationObject = {
                            //         message: notificationMessage,
                            //         isRead: false,
                            //         receiverId: adminDetails._id,
                            //         createdAt: new Date().getTime(),
                            //         status: constants.STATUS.ACTIVE,
                            //         categoryType: constants.NOTIFICATION_CATEGORIES.SUPPORT_TICKET,
                            //         refId: ticketCreated._id
                            //     }
                            //     await dao.createNotification(notificationObject)
                            // }

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ProjectUpdatedSuccess, updated)

                        } else {

                            console.log("Failed to update project details")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                }

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get project details
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 */
async function getProjectDetails(id, projectId) {

    if (!projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {
        if (id) {

            let query = {
                _id: id,
                status: constants.STATUS.ACTIVE
            }

            let userDetails = await dao.getUserDetails(query)

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }


        let aggregateCountQuery = [
            {
                $unwind: {
                    path: '$totalTeamMembers',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: constants.DB_MODEL_REF.USERS,
                    localField: "totalTeamMembers",
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    'logo': { "$first": "$logo" },
                    'coverImage': { "$first": "$coverImage" },
                    'title': { "$first": "$title" },
                    'description': { "$first": "$description" },
                    'websiteURL': { "$first": "$websiteURL" },
                    'githubURL': { "$first": "$githubURL" },
                    'linkedIn': { "$first": "$linkedIn" },
                    'twitter': { "$first": "$twitter" },
                    'category': { "$first": "$category" },
                    'bonus': { "$first": "$bonus" },
                    'projectCost': { "$first": "$projectCost" },
                    'totalTeamMembers': { "$push": "$userDetails" },
                    'projectStatus': { "$first": "$projectStatus" },
                    'createdAt': { "$first": "$createdAt" },
                    'initiator': { "$first": "$initiator" },
                    'adminVerification': { "$first": "$adminVerification" },
                }
            }, {
                "$project": {
                    "_id": 1,
                    'logo': 1,
                    'coverImage': 1,
                    'title': 1,
                    'description': 1,
                    'websiteURL': 1,
                    'githubURL': 1,
                    'linkedIn': 1,
                    'twitter': 1,
                    'category': 1,
                    'bonus': 1,
                    'projectCost': 1,
                    'initiator': 1,
                    'totalTeamMembers._id': 1,
                    'totalTeamMembers.fullName': 1,
                    'totalTeamMembers.profilePicture': 1,
                    'totalMembers': { "$size": "$totalTeamMembers" },
                    'projectStatus': 1,
                    'createdAt': 1,
                    'adminVerification': 1
                }
            }
        ]

        let projectQuery = {
            _id: ObjectId(projectId)
        }

        aggregateCountQuery.push({ $match: projectQuery })

        return dao.getAllProjects(aggregateCountQuery).then((results) => {

            // if (!results[0]) {

            //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            // } else

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, results[0])

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all other active users to add as member/collaborator in project
 * @param {String} id mongo id of user
 */
function getAllUsers(id) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let userListQuery = {
                    _id: { $ne: id },
                    status: constants.STATUS.ACTIVE
                }
                let projectionQuery = "_id fullName profilePicture"

                return dao.getAllUsers(userListQuery, projectionQuery).then((userList) => {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, userList)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Add package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details package details to be added in project
 */
function addPackage(id, projectId, details) {

    if (!id || !projectId || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId)
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                if (results[1].initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.AddingPackageNotAllowed)

                } else {

                    // check if members added by initiator in request
                    // If yes, check if any team member added to this project before
                    // If yes, check duplication of members and update count accordingly
                    // If no, update count
                    let projectUpdateObj = {}
                    let projectDetails = results[1]
                    if (details.collaborators && details.collaborators.length > 0) {

                        if (projectDetails.totalTeamMembers.length > 0) {

                            let oldMembers = projectDetails.totalTeamMembers
                            let newMembers = details.collaborators

                            newMembers.map((obj) => {
                                if (!oldMembers.includes(obj)) {
                                    oldMembers.push(obj)
                                }
                            })

                            projectDetails.totalTeamMembers = oldMembers

                        } else {

                            projectDetails.totalTeamMembers = details.collaborators

                        }

                        projectUpdateObj.totalTeamMembers = projectDetails.totalTeamMembers

                    }
                    let totalCost = parseInt(projectDetails.projectCost)
                    totalCost += parseInt(details.minimumCost)
                    projectUpdateObj.projectCost = totalCost

                    console.log({ projectUpdateObj })
                    await dao.updateProject(projectQuery, projectUpdateObj)

                    return dao.addPackage(projectQuery, details).then((packageAdded) => {

                        if (packageAdded) {

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.PackageAddedSuccess, packageAdded.packages)

                        } else {

                            console.log("Failed to add package")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {Object} details details to be updated
 */
function updatePackage(id, projectId, packageId, details) {

    if (!id || !projectId || !packageId || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                if (results[1].initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.AddingPackageNotAllowed)

                } else {

                    // if (details.collaborators) {
                    //     delete details.collaborators
                    // }

                    let updateQuery = {
                        _id: ObjectId(projectId),
                        "packages._id": ObjectId(packageId)
                    }
                    let updateObj = {
                        "packages.$": details
                    }
                    return dao.updateProject(updateQuery, updateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.PackageUpdatedSuccess, updated)
                        } else {

                            console.log("Failed to update master data")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get list of all packages under projects
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 */
async function getAllPackages(id, projectId) {

    if (!projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        if (id) {
            let query = {
                _id: id,
                status: constants.STATUS.ACTIVE
            }
            let userDetails = await dao.getUserDetails(query)

            if (!userDetails) {
                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }

        let projectQuery = {
            _id: projectId
        }

        let projectTypeMasterQuery = {
            'type': constants.MASTER_TYPES.PROJECT_TYPES,
        }

        let issueTypeMasterQuery = {
            'type': constants.MASTER_TYPES.ISSUE_TYPES,
        }

        let expertiseLevelMasterQuery = {
            'type': constants.MASTER_TYPES.COLLABORATOR_LEVEL,
        }

        return Promise.all([dao.getProjectDetails(projectQuery), dao.getMasterDetails(projectTypeMasterQuery), dao.getMasterDetails(issueTypeMasterQuery), dao.getMasterDetails(expertiseLevelMasterQuery)]).then((results) => {

            // if (!results[0]) {

            //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            // } else
            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                let projectDetails = results[0]
                let packages = results[0].packages

                let updatedPackages = []
                packages.map((packageDetails) => {

                    let projectTypeDetails = results[1]
                    let issueTypeDetails = results[2]
                    let expertiseLevelDetails = results[3]

                    let updatedPackageDetails = {}
                    updatedPackageDetails._id = packageDetails._id
                    updatedPackageDetails.name = packageDetails.name
                    updatedPackageDetails.link = packageDetails.link
                    updatedPackageDetails.minimumCost = packageDetails.minimumCost
                    // updatedPackageDetails.expertiseLevel = packageDetails.expertiseLevel
                    updatedPackageDetails.startDate = packageDetails.startDate
                    updatedPackageDetails.endDate = packageDetails.endDate
                    updatedPackageDetails.description = packageDetails.description
                    updatedPackageDetails.context = packageDetails.context
                    updatedPackageDetails.acceptanceCriteria = packageDetails.acceptanceCriteria
                    updatedPackageDetails.reference = packageDetails.reference
                    updatedPackageDetails.workStatus = packageDetails.workStatus
                    updatedPackageDetails.initiator = projectDetails.initiator

                    if (projectTypeDetails) {

                        let values = projectTypeDetails.values
                        let projectType = values.find(obj => obj._id.toString() == packageDetails.projectType.toString())

                        if (projectType) {

                            updatedPackageDetails.projectType = projectType.name
                        }
                    }
                    if (issueTypeDetails) {

                        let values = issueTypeDetails.values
                        let issueType = values.find(obj => obj._id.toString() == packageDetails.issueType.toString())

                        if (issueType) {

                            updatedPackageDetails.issueType = issueType.name
                        }
                    }
                    if (expertiseLevelDetails) {

                        let values = expertiseLevelDetails.values
                        let expertiseLevel = values.find(obj => obj._id.toString() == packageDetails.expertiseLevel.toString())

                        if (expertiseLevel) {

                            updatedPackageDetails.expertiseLevel = expertiseLevel.name
                        }
                    }

                    updatedPackages.push(updatedPackageDetails)
                })
                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, updatedPackages)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Remove or disable skills
 * @param {String} id mongo id of user
 * @param {String} skillId mongo id of skills
 */
function removeSkills(id, skillId) {

    if (!id || !ObjectId.isValid(id) || !skillId || !ObjectId.isValid(skillId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((result) => {

            if (!result) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else {

                return dao.deleteSkills(query, skillId).then((result) => {

                    if (result) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.SkillRemoved)
                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })


            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }
}


/**
 * Remove portfolio project
 * @param {String} id mongo id of user
 * @param {String} projectId title of portfolio project 
 */
function removePortfolioProject(id, projectId) {

    if (!id || !ObjectId.isValid(id) || !projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE,
            'portfolio._id': projectId
        }

        return Promise.all([dao.getUserDetails(query), dao.findPortfolioProjectDetails(projectQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMappingWithData(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let updateProjectData = {

                    portfolio: { _id: projectId }

                };

                return dao.deleteProject(query, updateProjectData).then((result) => {
                    if (result) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.ProjectRemoved)
                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}
/**
 * get portfolio project
 * @param {String} id mongo id of user
 * @param {String} projectId id of portfolio project 
 */
function getPortfolioProjectDetails(id, projectId) {
    if (!id || !ObjectId.isValid(id) || !projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else {

                let portfolioData = userDetails.portfolio
                let portfolioObj = portfolioData.find(obj => obj._id.toString() == projectId.toString())

                if (portfolioObj) {


                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, portfolioObj)

                } else {

                    return mapper.responseMappingWithData(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

                }

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * get employment details
 * @param {String} id mongo id of user
 * @param {String} employmentId id of employment history
 */
function getEmploymentDetails(id, employmentId) {

    if (!id || !ObjectId.isValid(id) || !employmentId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else {

                let employmentData = userDetails.employmentHistory
                let employmentObj = employmentData.find(obj => obj._id.toString() == employmentId.toString())

                if (employmentObj) {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, employmentObj)
                } else {

                    return mapper.responseMappingWithData(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.EmployNotFound)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * get education details
 * @param {String} id mongo id of user
 * @param {String} educationId id of education
 */
function getEducationDetails(id, educationId) {
    if (!id || !ObjectId.isValid(id) || !educationId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else {
                let educationData = userDetails.education
                let educationObj = educationData.find(obj => obj._id.toString() == educationId.toString())

                if (educationObj) {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, educationObj)
                } else {

                    return mapper.responseMappingWithData(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.EducationNotFound)

                }


            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * add skills 
 * @param {String} id mongo id of admin
 * @param {Object} details skill details to be added
 */
function addSkills(id, details) {

    if (!id || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {
                let skillsDetails = details.skills
                let skillsArr = []
                skillsDetails.map((data) => {
                    skillsArr.push(data)
                })
                details.skills = skillsArr
                details.createdAt = new Date().getTime()
                details.createdBy = id

                return dao.updateProfile(query, details).then((skillsAdded) => {

                    if (skillsAdded) {
                        console.log("skills is added succefully")
                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.SkillCreatedSuccess, skillsAdded)

                    } else {

                        console.log("Failed to create project")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get user's skills
 * @param {String} id mongo id of user
 */
function getSkills(id) {
    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            "_id": id,
            "status": constants.STATUS.ACTIVE
        }

        let skillQuery = {
            type: constants.MASTER_TYPES.SKILLS,
            status: constants.STATUS.ACTIVE
        }

        return Promise.all([dao.getUserDetails(query), dao.getMasterDetails(skillQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.SkillNotFound)

            } else {

                let skillsIdArr = result[0].skills

                let skillsData = result[1].values

                let skillsDetails = skillsData.filter(data => skillsIdArr.includes(data.id))

                if (skillsDetails) {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, skillsDetails)

                } else {
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}


/**
 * add Employment History 
 * @param {String} id mongo id of admin
 * @param {Object} details employment details to be added
 */
function addEmploymentHistory(id, details) {

    if (!id || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                userDetails.employmentHistory.push(details)

                return dao.updateProfile(query, userDetails).then((employmentAdded) => {

                    if (employmentAdded) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmploymentCreatedSuccess, employmentAdded.employmentHistory)

                    } else {

                        console.log("Failed to add employment history")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * add Employment History 
 * @param {String} id mongo id of admin
 * @param {Object} details employment details to be added
 */
function addEducation(id, details) {

    if (!id || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                userDetails.education.push(details)

                return dao.updateProfile(query, userDetails).then((eductionAdded) => {

                    if (eductionAdded) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EducationCreatedSuccess, eductionAdded.education)

                    } else {

                        console.log("Failed to add eduction")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Explore projects
 * @param {String} id mongo id of user
 * @param {Object} queryParams query params to get projects
 * @param {Object} filters filters to get projects
 */
async function exploreProjects(id, queryParams, filters) {

    let projectQuery = {
        // 'initiatorDetails._id': { $ne: ObjectId(id) },
        adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
    }
    if (id) {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let userDetails = await dao.getUserDetails(userQuery)

        if (!userDetails) {

            return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

        } else {

            projectQuery['initiatorDetails._id'] = { $ne: ObjectId(id) }
        }
    }

    let aggregateCountQuery = [
        {
            $unwind: {
                path: '$totalTeamMembers',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: constants.DB_MODEL_REF.USERS,
                localField: "totalTeamMembers",
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: constants.DB_MODEL_REF.USERS,
                localField: "initiator",
                foreignField: '_id',
                as: 'initiatorDetails'
            }
        },
        {
            $unwind: {
                path: '$initiatorDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            "$group": {
                "_id": "$_id",
                'logo': { "$first": "$logo" },
                'coverImage': { "$first": "$coverImage" },
                'title': { "$first": "$title" },
                'description': { "$first": "$description" },
                'websiteURL': { "$first": "$websiteURL" },
                'githubURL': { "$first": "$githubURL" },
                'linkedIn': { "$first": "$linkedIn" },
                'twitter': { "$first": "$twitter" },
                'category': { "$first": "$category" },
                'adminVerification': { "$first": "$adminVerification" },
                'bonus': { "$first": "$bonus" },
                'projectCost': { "$first": "$projectCost" },
                'initiatorDetails': { "$first": "$initiatorDetails" },
                'totalTeamMembers': { "$push": "$userDetails" },
                'packages': { "$first": "$packages" },
                'projectStatus': { "$first": "$projectStatus" },
                'createdAt': { "$first": "$createdAt" },
                'editedAt': { "$first": "$editedAt" },
            }
        }, {
            "$project": {
                "_id": 1,
                'logo': 1,
                'coverImage': 1,
                'title': 1,
                'description': 1,
                'websiteURL': 1,
                'githubURL': 1,
                'linkedIn': 1,
                'twitter': 1,
                'category': 1,
                'adminVerification': 1,
                'bonus': 1,
                'projectCost': 1,
                'initiatorDetails._id': 1,
                'initiatorDetails.fullName': 1,
                'totalTeamMembers._id': 1,
                'totalTeamMembers.fullName': 1,
                'totalTeamMembers.profilePicture': 1,
                'totalMembers': { "$size": "$totalTeamMembers" },
                'packages': 1,
                'projectStatus': 1,
                'createdAt': 1,
                'editedAt': 1,
                'timeTable': { $max: '$packages.endDate' }
            }
        }
    ]

    // let projectQuery = {
    // 'initiatorDetails._id': { $ne: ObjectId(id) },
    // adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
    // }

    if (queryParams.search) {

        projectQuery['$or'] = [
            { 'title': { '$regex': queryParams.search, '$options': 'i' } },
            // { 'description': { '$regex': queryParams.search, '$options': 'i' } },
            // { 'websiteURL': { '$regex': queryParams.search, '$options': 'i' } },
            { 'githubURL': { '$regex': queryParams.search, '$options': 'i' } },
            // { 'linkedIn': { '$regex': queryParams.search, '$options': 'i' } },
            // { 'twitter': { '$regex': queryParams.search, '$options': 'i' } },
            { 'category': { '$regex': queryParams.search, '$options': 'i' } },
        ]
    }
    if (filters.minPrice) {
        projectQuery['projectCost'] = {
            $lte: parseInt(filters.maxPrice),
            $gte: parseInt(filters.minPrice)
        }
    }
    if (filters.projectStatus) {
        projectQuery.projectStatus = filters.projectStatus
    }
    if (filters.collaboratorLevel) {
        projectQuery['packages'] = {
            '$elemMatch': { 'expertiseLevel': filters.collaboratorLevel }
        }
    }
    if (filters.deliveryDate) {
        projectQuery['packages.endDate'] = {
            "$gt": new Date().getTime(),
            "$lt": parseInt(filters.deliveryDate)
        }
    }
    if (filters.membersRange.length > 0) {
        let totalMembersQuery = []
        filters.membersRange.map((obj) => {

            if (obj == "0-5") {

                totalMembersQuery.push({ totalMembers: { "$lt": 5 } })
                // projectQuery['totalMembers'] = { "$lt": 5 }
            } else if (obj == "5-10") {

                totalMembersQuery.push({ totalMembers: { "$gte": 5, "$lt": 10 } })
                // projectQuery['totalMembers'] = { "$gte": 5, "$lt": 10 }
            } else if (obj == "10-15") {

                totalMembersQuery.push({ totalMembers: { "$gte": 10, "$lt": 15 } })
                // projectQuery['totalMembers'] = { "$gte": 10, "$lt": 15 }
            } else if (obj == "15-20") {

                totalMembersQuery.push({ totalMembers: { "$gte": 15, "$lt": 20 } })
                // projectQuery['totalMembers'] = { "$gte": 15, "$lt": 20 }
            } else {

                totalMembersQuery.push({ totalMembers: { "$gte": 20 } })
                // projectQuery['totalMembers'] = { "$gte": 20 }
            }
        })
        projectQuery['$or'] = totalMembersQuery

    }

    aggregateCountQuery.push({ $match: projectQuery })

    let totalProjects = await dao.getAllProjects(aggregateCountQuery)

    let sortQuery = {}
    if (queryParams.column) {

        sortQuery[queryParams.column] = ((queryParams.dir == "asc") ? 1 : -1)
    } else {

        sortQuery['createdAt'] = -1
    }

    aggregateCountQuery.push({ $sort: sortQuery })

    aggregateCountQuery.push({
        $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
    }, {
        $limit: parseInt(queryParams.limit)
    })

    return dao.getAllProjects(aggregateCountQuery).then((projects) => {
        let respObj = {
            "recordsTotal": totalProjects.length,
            "recordsFiltered": projects.length,
            "records": projects
        }

        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)
    }).catch((err) => {

        console.log({ err })
        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
    })
    // }
    //  else {

    //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

    // }
    // })
    // .catch((err) => {

    //     console.log({ err })
    //     return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
    // })

    // }
}

/**
 * Update employment history
 * @param {String} id mongo id of user
 * @param {String} employmentId mongo id of employment record
 * @param {Object} details 
 */
function updateEmploymentDetails(id, employmentId, details) {

    if (!id || !employmentId || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let updateQuery = {
                    _id: ObjectId(id),
                    "employmentHistory._id": ObjectId(employmentId)
                }
                let updateObj = {
                    "employmentHistory.$": details
                }
                return dao.updateProfile(updateQuery, updateObj).then((updated) => {

                    if (updated) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmploymentUpdatedSuccess, updated.employmentHistory)
                    } else {

                        console.log("Failed to update employment history")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete employment history
 * @param {String} id mongo id of user
 * @param {String} employmentId mongo id of employment history
 */
function deleteEmploymentHistory(id, employmentId) {

    if (!id || !employmentId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                return dao.deleteEmploymentHistory(query, employmentId).then((updated) => {

                    if (updated) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EmploymentDeletedSuccess, updated.employmentHistory)
                    } else {

                        console.log("Failed to delete employment history")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }

}

/**
 * Update education details
 * @param {String} id mongo id of user
 * @param {String} educationId mongo id of education record
 * @param {Object} details 
 */
function updateEducation(id, educationId, details) {

    if (!id || !educationId || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let updateQuery = {
                    _id: ObjectId(id),
                    "education._id": ObjectId(educationId)
                }
                let updateObj = {
                    "education.$": details
                }
                return dao.updateProfile(updateQuery, updateObj).then((updated) => {

                    if (updated) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EducationUpdatedSuccess, updated.education)
                    } else {

                        console.log("Failed to update education details")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete education
 * @param {String} id mongo id of user
 * @param {String} educationId mongo id of education history
 */
function deleteEducation(id, educationId) {

    if (!id || !educationId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                return dao.deleteEducation(query, educationId).then((updated) => {

                    if (updated) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.EducationDeletedSuccess, updated.education)
                    } else {

                        console.log("Failed to update education details")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Add portfolio
 * @param {String} id mongo id of user
 * @param {Object} details portfolio project details to be added
 */
function addPortfolio(id, details) {

    if (!id || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                if (!details.createdAt) {

                    details.createdAt = new Date().getTime()
                }
                userDetails.portfolio.push(details)

                return dao.updateProfile(query, userDetails).then((portfolioAdded) => {

                    if (portfolioAdded) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.PortfolioCreatedSuccess, portfolioAdded.portfolio)

                    } else {

                        console.log("Failed to add portfolio")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Invite friends
 * @param {String} id mongo id of user
 * @param {String} emailId email id of receiver
 */
function inviteFriends(id, emailId) {

    if (!id || !emailId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let emailUserQuery = {
            emailId: emailId
        }

        return Promise.all([dao.getUserDetails(query), dao.getUserDetails(emailUserQuery)]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (results[1]) {

                return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.EmailAlreadyExists)

            } else {

                let userDetails = results[0]

                let emailThirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }
                let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)

                if (emailServiceDetails) {

                    // invite friends mail
                    let inviteMailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.INVITE_FRIENDS,
                        status: constants.STATUS.ACTIVE
                    }
                    let inviteMailTemplateDetails = await dao.getTemplateDetails(inviteMailQuery)
                    if (inviteMailTemplateDetails) {

                        let mailObj = {
                            senderName: userDetails.fullName,
                            userId: userDetails._id,
                            emailId: emailId.toLowerCase()
                        }
                        let mailSent = mailHandler.SEND_MAIL(mailObj, inviteMailTemplateDetails, emailServiceDetails)
                        console.log({ mailSent })
                    }

                    return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.InvitationMailSent)

                } else {

                    return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.InvitationMailSent)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Join package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function joinPackage(id, projectId, packageId) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId,
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED,
            projectStatus: {
                $in: [constants.PROJECT_STATUS.OPEN, constants.PROJECT_STATUS.INPROGRESS]
            }
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let userDetails = results[0]
                let projectDetails = results[1]

                let packages = projectDetails.packages
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                if (!packageDetails) {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                } else {

                    let requests = packageDetails['requests']
                    if (requests.includes(id)) {

                        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.JoinRequestAlreadyExists)

                    } else {

                        requests.push(id)

                        packageDetails['requests'] = requests
                        let updateQuery = {
                            _id: ObjectId(projectId),
                            "packages._id": ObjectId(packageId)
                        }
                        let updateObj = {
                            "packages.$": packageDetails
                        }
                        return dao.updateProject(updateQuery, updateObj).then(async (updated) => {

                            if (updated) {

                                let initiatorQuery = {
                                    _id: projectDetails.initiator,
                                    status: constants.STATUS.ACTIVE
                                }
                                let initiatorDetails = await dao.getUserDetails(initiatorQuery)
                                if (initiatorDetails) {

                                    let emailThirdPartyServiceQuery = {
                                        type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                                        status: constants.STATUS.ACTIVE
                                    }

                                    let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)
                                    if (emailServiceDetails) {

                                        // Send mail to project initiator

                                        let requestMailQuery = {
                                            type: constants.TEMPLATE_TYPES.EMAIL,
                                            mailName: constants.EMAIL_TEMPLATES.NEW_JOIN_REQUEST,
                                            status: constants.STATUS.ACTIVE
                                        }
                                        let requestMailTemplateDetails = await dao.getTemplateDetails(requestMailQuery)
                                        if (requestMailTemplateDetails) {

                                            let mailObj = {
                                                fullName: initiatorDetails.fullName, // initiator name
                                                collaboratorName: userDetails.fullName,
                                                projectName: projectDetails.title,
                                                packageName: packageDetails.name,
                                                emailId: initiatorDetails.emailId.toLowerCase()
                                            }
                                            let mailSent = mailHandler.SEND_MAIL(mailObj, requestMailTemplateDetails, emailServiceDetails)
                                            console.log({ mailSent })
                                        }

                                    }
                                }
                                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.JoinPackageRequestAdded, packageDetails)
                            } else {

                                console.log("Failed to join package")
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })
                    }

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all project joining request received
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllProjectRequestReceived(id, queryParams) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(userQuery).then(async (userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let projectQuery = {
                    initiator: ObjectId(id),
                    "packages.requests.0": { "$exists": true }
                }

                let aggregateQuery = [
                    {
                        $match: projectQuery
                    },
                    {
                        $project: {
                            '_id': 1,
                            'title': 1,
                            'logo': 1,
                            'description': 1,
                            'projectCost': 1,
                        }
                    }
                ]

                let totalProjects = await dao.getAllProjects(aggregateQuery)

                aggregateQuery.push({
                    $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                }, {
                    $limit: parseInt(queryParams.limit)
                })

                return dao.getAllProjects(aggregateQuery).then((results) => {

                    let respObj = {
                        "recordsTotal": totalProjects.length,
                        "recordsFiltered": results.length,
                        "records": results
                    }
                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get package details
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
async function getPackageDetails(id, projectId, packageId) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        if (id) {

            let query = {
                _id: id,
                status: constants.STATUS.ACTIVE
            }
            let userDetails = await dao.getUserDetails(query)
            if (!userDetails) {
                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }

        let packageQuery = {
            _id: ObjectId(projectId),
            'packages._id': ObjectId(packageId)
        }

        let filterQuery = {
            _id: 0, initiator: 1, packages: { $elemMatch: { _id: ObjectId(packageId) } }
        }

        return dao.getAllProjectList(packageQuery, filterQuery).then((results) => {

            // if (!results[0]) {

            //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            // } else 
            if (!results) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                // console.log(results[1])
                let packageDetails = results['packages'][0]
                if (!packageDetails) {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                } else {

                    let projectTypeMasterQuery = {
                        'type': constants.MASTER_TYPES.PROJECT_TYPES,
                    }

                    let issueTypeMasterQuery = {
                        'type': constants.MASTER_TYPES.ISSUE_TYPES,
                    }

                    let expertiseLevelMasterQuery = {
                        'type': constants.MASTER_TYPES.COLLABORATOR_LEVEL,
                    }

                    return Promise.all([dao.getMasterDetails(projectTypeMasterQuery), dao.getMasterDetails(issueTypeMasterQuery), dao.getMasterDetails(expertiseLevelMasterQuery)]).then((masterDetails) => {

                        let projectTypeDetails = masterDetails[0]
                        let issueTypeDetails = masterDetails[1]
                        let expertiseLevelDetails = masterDetails[2]

                        let updatedPackageDetails = {}
                        updatedPackageDetails._id = packageDetails._id
                        updatedPackageDetails.name = packageDetails.name
                        updatedPackageDetails.link = packageDetails.link
                        updatedPackageDetails.minimumCost = packageDetails.minimumCost
                        // updatedPackageDetails.expertiseLevel = packageDetails.expertiseLevel
                        updatedPackageDetails.startDate = packageDetails.startDate
                        updatedPackageDetails.endDate = packageDetails.endDate
                        updatedPackageDetails.description = packageDetails.description
                        updatedPackageDetails.context = packageDetails.context
                        updatedPackageDetails.acceptanceCriteria = packageDetails.acceptanceCriteria
                        updatedPackageDetails.reference = packageDetails.reference
                        updatedPackageDetails.workStatus = packageDetails.workStatus
                        updatedPackageDetails.requests = packageDetails.requests
                        updatedPackageDetails.initiator = results.initiator
                        updatedPackageDetails.collaborators = packageDetails.collaborators
                        updatedPackageDetails.workProgress = packageDetails.workProgress

                        if (projectTypeDetails) {

                            let values = projectTypeDetails.values
                            let projectType = values.find(obj => obj._id.toString() == packageDetails.projectType.toString())

                            if (projectType) {

                                updatedPackageDetails.projectType = projectType.name
                            }
                        }
                        if (issueTypeDetails) {

                            let values = issueTypeDetails.values
                            let issueType = values.find(obj => obj._id.toString() == packageDetails.issueType.toString())

                            if (issueType) {

                                updatedPackageDetails.issueType = issueType.name
                            }
                        }
                        if (expertiseLevelDetails) {

                            let values = expertiseLevelDetails.values
                            let expertiseLevel = values.find(obj => obj._id.toString() == packageDetails.expertiseLevel.toString())

                            if (expertiseLevel) {

                                updatedPackageDetails.expertiseLevel = expertiseLevel.name
                            }
                        }

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, updatedPackageDetails)
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })

                }

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get minimum and maximum project cost range
 * @param {String} id mongo id of user
 */
async function getExploreBudgetRange(id) {
    let projectQuery = {
        // initiator: { $ne: ObjectId(id) },
        adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
    }
    if (id) {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let userDetails = await dao.getUserDetails(userQuery)

        if (!userDetails) {

            return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

        } else {

            projectQuery['initiator'] = { $ne: ObjectId(id) }
        }
    }

    let aggregateCountQuery = [
        { $match: projectQuery },
        {
            "$group": {
                "_id": null,
                'minProjectCost': { $min: '$projectCost' },
                'maxProjectCost': { $max: '$projectCost' },
            }
        },
        {
            "$project": {
                'minProjectCost': 1,
                'maxProjectCost': 1,
            }
        }
    ]
    return dao.getAllProjects(aggregateCountQuery).then((data) => {

        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, data[0])
    }).catch((err) => {

        console.log({ err })
        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
    })
    // }


}

/**
 * Get minimum and maximum project cost range for user initiated/collaborated projects
 * @param {String} id mongo id of user
 */
function getMyProjectsBudgetRange(id) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(userQuery).then((userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let projectQuery = {
                    '$or': [{
                        'initiator': ObjectId(id),
                    }, {
                        'totalTeamMembers': { $in: [ObjectId(id)] }
                    }]
                }
                let aggregateCountQuery = [
                    { $match: projectQuery },
                    {
                        "$group": {
                            "_id": null,
                            'minProjectCost': { $min: '$projectCost' },
                            'maxProjectCost': { $max: '$projectCost' },
                        }
                    },
                    {
                        "$project": {
                            'minProjectCost': 1,
                            'maxProjectCost': 1,
                        }
                    }
                ]
                return dao.getAllProjects(aggregateCountQuery).then((data) => {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, data[0])
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get my project list
 * @param {String} id mongo id of user
 */
function getMyProjectList(id) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then(async (userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let aggregateQuery = [
                    {
                        $unwind: {
                            path: '$totalTeamMembers',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "totalTeamMembers",
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$userDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "initiator",
                            foreignField: '_id',
                            as: 'initiatorDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$initiatorDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        "$group": {
                            "_id": "$_id",
                            'title': { "$first": "$title" },
                            'initiatorDetails': { "$first": "$initiatorDetails" },
                            'totalTeamMembers': { "$push": "$userDetails" },
                        }
                    },
                    {
                        $match: {
                            // adminVerification: constants.VERIFICATION_STATUS.ACCEPTED,
                            '$or': [{
                                'initiatorDetails._id': ObjectId(id),
                            }, {
                                'totalTeamMembers._id': ObjectId(id)
                            }]
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            'title': 1,
                        }
                    }
                ]

                return dao.getAllProjects(aggregateQuery).then((projects) => {

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, projects)
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all requests received for packages under project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
function getAllPackageRequestReceived(id, projectId, queryParams) {

    if (!id || !projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            initiator: ObjectId(id),
            _id: ObjectId(projectId),
        }
        return Promise.all([dao.getUserDetails(userQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
                let packages = projectDetails['packages']
                let packageList = packages.filter(obj => obj.requests.length > 0)

                let totalRequests = packageList.length

                let skip = 0
                let limit = 10
                if (queryParams.skip) {
                    skip = queryParams.skip
                }
                if (queryParams.limit) {
                    limit = queryParams.limit
                }
                packageList = packageList.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))

                let respObj = {
                    "recordsTotal": totalRequests,
                    "recordsFiltered": packageList.length,
                    "records": packageList
                }

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get user requests received
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {Object} queryParams pagination parameters
 */
function getUserRequestReceived(id, projectId, packageId, queryParams) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            initiator: ObjectId(id),
            _id: ObjectId(projectId),
        }
        return Promise.all([dao.getUserDetails(userQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                let projectDetails = results[1]
                let packages = projectDetails['packages']
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())

                if (packageDetails) {

                    let userRequests = packageDetails['requests']
                    let totalRecords = userRequests.length
                    let skip = 0
                    let limit = 10
                    if (queryParams.skip) {
                        skip = queryParams.skip
                    }
                    if (queryParams.limit) {
                        limit = queryParams.limit
                    }

                    userRequests = userRequests.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))

                    let userQuery = {
                        _id: { $in: userRequests }
                    }
                    let projectionQuery = "_id fullName profilePicture basicInfo"
                    return dao.getAllUsers(userQuery, projectionQuery).then((users) => {

                        let respObj = {
                            "recordsTotal": totalRecords,
                            "recordsFiltered": users.length,
                            "records": users
                        }
                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all requests sent to join a project
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllProjectRequestSent(id, queryParams) {

    if (!id) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(userQuery).then(async (userDetails) => {

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else {

                let projectQuery = {
                    "packages.requests": { "$in": [ObjectId(id)] }
                }
                let aggregateQuery = [
                    {
                        $match: projectQuery
                    },
                    {
                        $project: {
                            '_id': 1,
                            'title': 1,
                            'logo': 1,
                            'description': 1,
                            'projectCost': 1
                        }
                    }
                ]
                let totalProjects = await dao.getAllProjects(aggregateQuery)

                aggregateQuery.push({
                    $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                }, {
                    $limit: parseInt(queryParams.limit)
                })

                return dao.getAllProjects(aggregateQuery).then((results) => {

                    let respObj = {
                        "recordsTotal": totalProjects.length,
                        "recordsFiltered": results.length,
                        "records": results
                    }

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all requests sent for project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project 
 * @param {Object} queryParams pagination parameters
 */
function getAllPackageRequestSent(id, projectId, queryParams) {

    if (!id || !projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId),
        }
        return Promise.all([dao.getUserDetails(userQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
                let packages = projectDetails['packages']
                let packageList = packages.filter(obj => obj.requests.includes(ObjectId(id)))

                let totalRequests = packageList.length
                let skip = 0
                let limit = 10
                if (queryParams.skip) {
                    skip = queryParams.skip
                }
                if (queryParams.limit) {
                    limit = queryParams.limit
                }
                packageList = packageList.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))
                let respObj = {
                    "recordsTotal": totalRequests,
                    "recordsFiltered": packageList.length,
                    "records": packageList
                }

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Accpet or reject collaborator's package joining request
 * @param {String} id mongo id of user (INITIATOR)
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {String} userId mongo id of user (COLLABORATOR)
 * @param {String} verificationStatus request to be accepted or rejected
 */
function updateJoinRequest(id, projectId, packageId, userId, verificationStatus) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !packageId || !ObjectId.isValid(packageId)
        || !userId || !ObjectId.isValid(userId) || !verificationStatus) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let initiatorQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId)
        }
        // Fetching initiator and project details
        return Promise.all([dao.getUserDetails(initiatorQuery), dao.getProjectDetails(projectQuery)]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let initiatorDetails = results[0]
                let projectDetails = results[1]
                let packages = projectDetails['packages']
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())

                // Check if package exists or not
                if (packageDetails) {

                    // Check if project initiator has access for this action or not
                    if (projectDetails.initiator != id) {

                        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.JoinRequestStatusUpdateNotAllowed)

                    } else {

                        let projectUpdateObj = {}
                        let packageUpdateObj = packageDetails

                        let emailThirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)

                        let collaboratorQuery = {
                            _id: userId,
                            status: constants.STATUS.ACTIVE
                        }
                        let collaboratorDetails = await dao.getUserDetails(collaboratorQuery)
                        // If user is accepted
                        if (verificationStatus == constants.VERIFICATION_STATUS.ACCEPTED) {

                            // Check if collaborator exists or not
                            if (!collaboratorDetails) {

                                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.CollaboratorNotFound)

                            } else {

                                // Check if collaborator is already a project team member
                                // If yes, do nothing
                                // If no, insert collaborator in team
                                if (projectDetails.totalTeamMembers.length > 0) {

                                    let oldMembers = projectDetails.totalTeamMembers

                                    if (!oldMembers.includes(userId)) {
                                        oldMembers.push(userId)
                                    }

                                    projectDetails.totalTeamMembers = oldMembers

                                } else {

                                    projectDetails.totalTeamMembers.push(userId)

                                }
                                projectUpdateObj.totalTeamMembers = projectDetails.totalTeamMembers

                                // Check if collaborator is already in package
                                // If yes, do nothing
                                // If no, insert id
                                let packageCollaborators = packageDetails.collaborators
                                if (!packageCollaborators.includes(userId)) {
                                    packageCollaborators.push(userId)
                                }
                                packageUpdateObj.collaborators = packageCollaborators

                                // Delete collaborator's id from requests
                                let packageRequests = packageDetails['requests']

                                let filteredRequests = packageRequests.filter(obj => obj.toString() != userId.toString())
                                packageUpdateObj.requests = filteredRequests

                                // Check if project id is already in user profile
                                // If yes, do nothing
                                // If no, insert id
                                let userProjects = collaboratorDetails['projects']

                                if (!userProjects.includes(projectId)) {
                                    userProjects.push(projectId)

                                    let userUpdateObj = {
                                        projects: userProjects
                                    }
                                    await dao.updateProfile(collaboratorQuery, userUpdateObj)
                                }

                            }

                            // SEND MAIL TO COLLABORATOR FOR REQUEST APPROVAL
                            if (emailServiceDetails) {

                                // Send mail to project initiator

                                let requestMailQuery = {
                                    type: constants.TEMPLATE_TYPES.EMAIL,
                                    mailName: constants.EMAIL_TEMPLATES.JOIN_REQUEST_APPROVED,
                                    status: constants.STATUS.ACTIVE
                                }
                                let requestMailTemplateDetails = await dao.getTemplateDetails(requestMailQuery)
                                if (requestMailTemplateDetails) {

                                    let mailObj = {
                                        fullName: initiatorDetails.fullName, // initiator name
                                        collaboratorName: collaboratorDetails.fullName,
                                        projectName: projectDetails.title,
                                        packageName: packageDetails.name,
                                        emailId: collaboratorDetails.emailId.toLowerCase()
                                    }
                                    let mailSent = mailHandler.SEND_MAIL(mailObj, requestMailTemplateDetails, emailServiceDetails)
                                    console.log({ mailSent })
                                }

                            }

                        } else {

                            // Delete collaborator's id from requests
                            let packageRequests = packageDetails['requests']

                            let filteredRequests = packageRequests.filter(obj => obj.toString() != userId.toString())
                            packageUpdateObj.requests = filteredRequests

                            // SEND MAIL TO COLLABORATOR FOR REQUEST REJECTION
                            if (emailServiceDetails) {

                                // Send mail to project initiator

                                let requestMailQuery = {
                                    type: constants.TEMPLATE_TYPES.EMAIL,
                                    mailName: constants.EMAIL_TEMPLATES.JOIN_REQUEST_REJECTED,
                                    status: constants.STATUS.ACTIVE
                                }
                                let requestMailTemplateDetails = await dao.getTemplateDetails(requestMailQuery)
                                if (requestMailTemplateDetails) {

                                    let mailObj = {
                                        fullName: initiatorDetails.fullName, // initiator name
                                        collaboratorName: collaboratorDetails.fullName,
                                        projectName: projectDetails.title,
                                        packageName: packageDetails.name,
                                        emailId: collaboratorDetails.emailId.toLowerCase()
                                    }
                                    let mailSent = mailHandler.SEND_MAIL(mailObj, requestMailTemplateDetails, emailServiceDetails)
                                    console.log({ mailSent })
                                }

                            }

                        }

                        // Update package details
                        let updateProjectQuery = {
                            _id: ObjectId(projectId),
                            "packages._id": ObjectId(packageId)
                        }
                        projectUpdateObj["packages.$"] = packageUpdateObj

                        return dao.updateProject(updateProjectQuery, projectUpdateObj).then((updated) => {

                            if (updated) {

                                if (verificationStatus == constants.VERIFICATION_STATUS.ACCEPTED) {

                                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.UserRequestAccepted, updated)
                                } else {

                                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.UserRequestRejected, updated)
                                }

                            } else {

                                console.log("Failed to update project joining request")
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })

                    }

                } else {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                }

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Create support ticket
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details support ticket details to be added
 */
function createSupportTicket(id, projectId, details) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId
        }

        let adminDetails = {}

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery), dao.getAdminDetails()]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let userDetails = results[0]
                details.projectId = projectId
                details.createdAt = new Date().getTime()
                details.createdBy = id
                details.projectId = projectId

                return dao.createSupportTicket(details).then(async (ticketCreated) => {

                    if (ticketCreated) {

                        let emailThirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)

                        if (emailServiceDetails) {

                            // New ticket create mail
                            let newTicketMailQuery = {
                                type: constants.TEMPLATE_TYPES.EMAIL,
                                mailName: constants.EMAIL_TEMPLATES.NEW_SUPPORT_TICKET,
                                status: constants.STATUS.ACTIVE
                            }

                            let mailTemplateDetails = await dao.getTemplateDetails(newTicketMailQuery)

                            if (mailTemplateDetails) {

                                let newUserObj = {
                                    fullName: userDetails.fullName,
                                    emailId: userDetails.emailId.toLowerCase(),
                                    subject: details.subject
                                }

                                let mailSent = mailHandler.SEND_MAIL(newUserObj, mailTemplateDetails, emailServiceDetails)
                                console.log({ mailSent })
                            }

                        }

                        // Create bell notification object for admin
                        if (results[2]) {

                            let adminDetails = results[2]
                            let notificationQuery = {
                                mailName: constants.EMAIL_TEMPLATES.NOTIFY_NEW_DISPUTE,
                                status: constants.STATUS.ACTIVE
                            }
                            let notificationTemplateDetails = await dao.getTemplateDetails(notificationQuery)
                            if (notificationTemplateDetails) {

                                let notificationMessage = notificationTemplateDetails.notificationMessage

                                let obj = {
                                    fullName: userDetails.fullName,
                                }
                                notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                                let notificationObject = {
                                    message: notificationMessage,
                                    isRead: false,
                                    receiverId: adminDetails._id,
                                    createdAt: new Date().getTime(),
                                    status: constants.STATUS.ACTIVE,
                                    categoryType: constants.NOTIFICATION_CATEGORIES.SUPPORT_TICKET,
                                    refId: ticketCreated._id
                                }
                                await dao.createNotification(notificationObject)
                                await socketHandler.emitAdminNotification()
                            }
                        }

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.TicketCreatedSuccess, ticketCreated)

                    } else {

                        console.log("Failed to create ticket")
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * get all support ticket
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllSupportTicket(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        return dao.getUserDetails(query).then(async (result) => {

            if (!result) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else {

                let projectArr = result.projects
                let projectQuery = {
                    projectId: {
                        $in: projectArr
                    }
                }
                let sortQuery = {}
                sortQuery['createdAt'] = -1
                let aggregateQuery = [
                    {
                        $match: projectQuery
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.PROJECTS,
                            localField: "projectId",
                            foreignField: '_id',
                            as: 'projectDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$projectDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "createdBy",
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: {
                            path: '$userDetails',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $unwind: {
                            path: "$comments",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: constants.DB_MODEL_REF.USERS,
                            localField: "comments.senderId",
                            foreignField: "_id",
                            as: "comments.senderDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$comments.senderDetails",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $sort: sortQuery
                    },
                    {
                        $group: {
                            "_id": "$_id",
                            "ticketStatus": { "$first": "$ticketStatus" },
                            "subject": { "$first": "$subject" },
                            "details": { "$first": "$details" },
                            "reason": { "$first": "$reason" },
                            "createdAt": { "$first": "$createdAt" },
                            "projectDetails": { "$first": "$projectDetails" },
                            "userDetails": { "$first": "$userDetails" },
                            "comments": { "$addToSet": "$comments" }
                        }
                    },
                    {
                        $project: {
                            "_id": 1,
                            "ticketStatus": 1,
                            "subject": 1,
                            "details": 1,
                            "reason": 1,
                            "createdAt": 1,
                            "projectDetails._id": 1,
                            "projectDetails.title": 1,
                            "projectDetails.logo": 1,
                            "userDetails._id": 1,
                            "userDetails.profilePicture": 1,
                            "userDetails.fullName": 1,
                            "comments.senderDetails._id": 1,
                            "comments.senderDetails.fullName": 1,
                            "comments._id": 1,
                            "comments.msg": 1,
                            "comments.createdAt": 1

                        }
                    }
                ]
                let allTicketsData = await dao.getAllTicketDetails(aggregateQuery)
                aggregateQuery.push({
                    $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                })

                aggregateQuery.push({
                    $limit: parseInt(queryParams.limit)
                })

                return dao.getAllTicketDetails(aggregateQuery).then((projectDetails) => {

                    projectDetails.map((data) => {
                        if (data.comments.length > 0) {
                            if (Object.keys(data.comments[0]).length == 0) {
                                data.comments.shift()
                            }
                        }
                    })

                    let finalResponseObj = {
                        "recordsTotal": allTicketsData.length,
                        "recordsFiltered": projectDetails.length,
                        "records": projectDetails
                    }

                    return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, finalResponseObj)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * add comment on ticket by users
 * @param {String} id mongo id of user id
 * @param {String} ticketId mongo id of ticket
 * @param {String} details comment details 
 */
function addComment(id, ticketId, details) {

    if (!id || !ObjectId.isValid(id) || !ticketId || !ObjectId.isValid(ticketId) || !details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let ticketQuery = {
            _id: ticketId,
        }
        return Promise.all([dao.getUserDetails(query), dao.getTicketDetails(ticketQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.TicketNotFound)
            } else {

                let commentObj = {
                    senderId: id,
                    msg: details.comments,
                    createdAt: new Date().getTime()
                }
                result[1].comments.push(commentObj)

                return dao.updateTicket(ticketQuery, result[1]).then((commented) => {

                    if (commented) {

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.CommentSuccess, commented)
                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }

}

/**
 * Get all FAQs added in project
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
async function getAllFAQs(id, projectId, queryParams) {

    if (!projectId || !ObjectId.isValid(projectId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        if (id) {
            let query = {
                _id: id,
                status: constants.STATUS.ACTIVE
            }
            let userDetails = await dao.getUserDetails(query)

            if (!userDetails) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            }
        }

        let projectQuery = {
            _id: projectId
        }

        return dao.getProjectDetails(projectQuery).then((results) => {

            // if (!results[0]) {

            //     return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            // } else 

            if (!results) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results
                let FAQs = []
                if (projectDetails.FAQs || projectDetails.FAQs.length > 0) {

                    FAQs = projectDetails.FAQs.filter(obj => obj.status == constants.STATUS.ACTIVE)
                }

                let totalRecords = FAQs.length

                let skip = 0
                let limit = 10
                if (queryParams.skip) {
                    skip = queryParams.skip
                }
                if (queryParams.limit) {
                    limit = queryParams.limit
                }
                FAQs = FAQs.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))

                let respObj = {
                    "recordsTotal": totalRecords,
                    "recordsFiltered": FAQs.length,
                    "records": FAQs
                }

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * contactUs
 * @param {String} details contactUs details 
 */
async function contactUs(details) {

    if (!details) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        return dao.getAdminDetails().then(async (adminDetails) => {

            if (adminDetails) {

                let adminEmailId = adminDetails.emailId

                let emailThirdPartyServiceQuery = {
                    type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                    status: constants.STATUS.ACTIVE
                }

                let emailServiceDetails = await dao.getServiceDetails(emailThirdPartyServiceQuery)
                if (emailServiceDetails) {

                    let mailQuery = {
                        type: constants.TEMPLATE_TYPES.EMAIL,
                        mailName: constants.EMAIL_TEMPLATES.CONTACT_US_QUERY,
                        status: constants.STATUS.ACTIVE
                    }

                    let templateDetails = await dao.getTemplateDetails(mailQuery)
                    if (templateDetails) {

                        let mailBodyDetails = {
                            adminEmailId: adminEmailId.toLowerCase(),
                            userEmailId: details.emailId.toLowerCase(),
                            message: details.message,
                            name: details.name,
                            contactNumber: details.contactNumber || "--"
                        }
                        let mailSent = mailHandler.SEND_CONTACT_US_QUERY_MAIL(mailBodyDetails, templateDetails, emailServiceDetails)
                        console.log({ mailSent })
                    }
                }
            }

            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.ContactUsQuerySent)

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })

    }

}

/**
 * Start work
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function startWork(id, projectId, packageId) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId,
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]

                let packages = projectDetails.packages
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                if (!packageDetails) {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                } else {

                    let collaborators = packageDetails['collaborators']
                    if (!collaborators.includes(id)) {

                        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.StartWorkNotAllowed)

                    } else {

                        let workProgress = []
                        if (packageDetails['workProgress'] && packageDetails['workProgress'].length > 0) {
                            workProgress = packageDetails['workProgress']
                        }
                        workProgress.push({
                            user: id,
                            startedAt: new Date().getTime(),
                            status: constants.USER_WORK_STATUS.INPROGRESS
                        })
                        packageDetails['workProgress'] = workProgress
                        packageDetails.workStatus = constants.PACKAGE_WORK_STATUS.INPROGRESS
                        // projectDetails.projectStatus = constants.PROJECT_STATUS.INPROGRESS

                        let updateQuery = {
                            _id: ObjectId(projectId),
                            "packages._id": ObjectId(packageId)
                        }
                        let updateObj = {
                            projectStatus: constants.PROJECT_STATUS.INPROGRESS,
                            "packages.$": packageDetails
                        }
                        return dao.updateProject(updateQuery, updateObj).then((updated) => {

                            if (updated) {

                                return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.WorkStarted)
                            } else {

                                console.log("Failed to start work")
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })
                    }

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Submit work
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {String} workId mongo id of work progress
 */
function submitWork(id, projectId, packageId, workId) {

    if (!id || !projectId || !packageId || !workId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId,
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let userDetails = results[0]
                let projectDetails = results[1]

                let packages = projectDetails.packages
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                if (!packageDetails) {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                } else {

                    let collaborators = packageDetails['collaborators']
                    if (!collaborators.includes(id)) {

                        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.SubmitWorkNotAllowed)

                    } else {

                        let workProgress = packageDetails['workProgress']

                        let workIndex = workProgress.findIndex(obj => obj._id.toString() == workId.toString())
                        console.log({ workIndex })
                        if (workIndex < 0) {

                            return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.SubmitWorkNotAllowed)

                        }
                        workProgress[workIndex].status = constants.USER_WORK_STATUS.SUBMITTED
                        workProgress[workIndex].submittedAt = new Date().getTime()

                        packageDetails['workProgress'] = workProgress

                        let updateQuery = {
                            _id: ObjectId(projectId),
                            "packages._id": ObjectId(packageId)
                        }
                        let updateObj = {
                            "packages.$": packageDetails
                        }

                        return dao.updateProject(updateQuery, updateObj).then((updated) => {

                            if (updated) {

                                return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.WorkSubmitted)
                            } else {

                                console.log("Failed to submit work")
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        })
                    }

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get work progress status of all collaborators
 * @param {String} id mongo id of user/initiator
 * @param {String} projectId mongo id of project 
 * @param {String} packageId mongo id of package
 * @param {Object} queryParams pagination parameters
 */
function getWorkProgressList(id, projectId, packageId, queryParams) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let packageQuery = {
            initiator: ObjectId(id),
            _id: ObjectId(projectId),
            "packages._id": ObjectId(packageId)
        }
        let projectQuery = {
            initiator: ObjectId(id),
            _id: ObjectId(projectId),
        }

        let aggregateQuery = [
            { "$unwind": "$packages" },
            { $match: packageQuery },
            { "$unwind": "$packages.workProgress" },
            {
                $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
            }, {
                $limit: parseInt(queryParams.limit)
            },
            {
                "$lookup": {
                    "from": constants.DB_MODEL_REF.USERS,
                    "localField": "packages.workProgress.user",
                    "foreignField": "_id",
                    "as": "packages.workProgress.user"
                }
            },
            { "$addFields": { "packages.workProgress.user": { "$arrayElemAt": ["$packages.workProgress.user", 0] } } },
            {
                "$group": {
                    "_id": "$packages._id",
                    "workProgress": { "$push": "$packages.workProgress" }
                }
            },
            {
                "$project": {
                    "workProgress._id": 1,
                    "workProgress.user._id": 1,
                    "workProgress.user.fullName": 1,
                    "workProgress.user.profilePicture": 1,
                    "workProgress.status": 1,
                    "workProgress.startedAt": 1,
                    "workProgress.submittedAt": 1,
                }
            }
        ]
        return Promise.all([dao.getUserDetails(userQuery), dao.getAllProjects(aggregateQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[2]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                let projectDetails = results[2]
                let packages = projectDetails.packages
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                let workProgress = packageDetails['workProgress']

                let respObj = {}
                if (results[1] && results[1].length > 0) {

                    respObj = {
                        "recordsTotal": workProgress.length,
                        "recordsFiltered": results[1][0]['workProgress'].length,
                        "records": results[1][0]['workProgress']
                    }
                } else {

                    respObj = {
                        "recordsTotal": workProgress.length,
                        "recordsFiltered": 0,
                        "records": results[1]
                    }
                }

                return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update submission status of collaborator's work
 * @param {String} id mongo id of initiator
 * @param {String} projectId mongo id of project 
 * @param {String} packageId mongo id of package
 * @param {String} workId mongo id of work progress
 * @param {String} status status to be updated
 */
function updateSubmissionStatus(id, projectId, packageId, workId, status) {

    if (!id || !projectId || !packageId || !workId || !status) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: projectId,
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
        }

        return Promise.all([dao.getUserDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]

                if (projectDetails.initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.JoinRequestStatusUpdateNotAllowed)

                } else {

                    let packages = projectDetails.packages
                    let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                    if (!packageDetails) {

                        return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                    } else {

                        let workProgress = packageDetails['workProgress']

                        let workIndex = workProgress.findIndex(obj => obj._id.toString() == workId.toString())

                        if (workIndex < 0) {

                            return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.SubmitWorkNotAllowed)

                        }
                        if (status == constants.USER_WORK_STATUS.SUBMISSION_APPROVED || status == constants.USER_WORK_STATUS.SUBMISSION_REJECTED) {

                            workProgress[workIndex].status = status
                            packageDetails['workProgress'] = workProgress

                            let updateQuery = {
                                _id: ObjectId(projectId),
                                "packages._id": ObjectId(packageId)
                            }
                            let updateObj = {
                                "packages.$": packageDetails
                            }

                            return dao.updateProject(updateQuery, updateObj).then((updated) => {

                                if (updated) {

                                    if (status == constants.USER_WORK_STATUS.SUBMISSION_APPROVED) {

                                        return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.SubmissionApproved)
                                    } else {

                                        return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.SubmissionRejected)

                                    }

                                } else {

                                    console.log("Failed to update submission")
                                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                                }
                            }).catch((err) => {

                                console.log({ err })
                                return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                            })

                        } else {

                            return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.SubmissionStatusNotValid)

                        }

                    }
                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Finish package work
 * @param {String} id mongo id of initiator
 * @param {String} projectId mongo id of project 
 * @param {String} packageId mongo id of package 
 */
function finishPackage(id, projectId, packageId) {

    if (!id || !projectId || !packageId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId),
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
        }

        return Promise.all([dao.getUserDetails(userQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                let projectDetails = results[1]
                if (projectDetails.initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.JoinRequestStatusUpdateNotAllowed)
                }

                let packages = projectDetails.packages
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())
                let workProgress = packageDetails['workProgress']

                let allWorkSubmitted = true
                workProgress.map((obj) => {

                    console.log(obj.status)
                    if (obj.status != constants.USER_WORK_STATUS.SUBMISSION_APPROVED) {
                        allWorkSubmitted = false
                    }
                    console.log({ allWorkSubmitted })
                })

                console.log("OUT", { allWorkSubmitted })

                if (!allWorkSubmitted) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.FinishPackageNotAllowed)

                } else {

                    packageDetails['workStatus'] = constants.PACKAGE_WORK_STATUS.COMPLETED

                    let updateQuery = {
                        _id: ObjectId(projectId),
                        "packages._id": ObjectId(packageId)
                    }
                    let updateObj = {
                        "packages.$": packageDetails
                    }

                    return dao.updateProject(updateQuery, updateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.PackageFinished)

                        } else {

                            console.log("Failed to finish package")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                }

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Finish project
 * @param {String} id mongo id of initiator
 * @param {String} projectId mongo id of project 
 */
function finishProject(id, projectId) {

    if (!id || !projectId) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId),
            adminVerification: constants.VERIFICATION_STATUS.ACCEPTED
        }

        return Promise.all([dao.getUserDetails(userQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)
            } else {

                let projectDetails = results[1]
                if (projectDetails.initiator != id) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.JoinRequestStatusUpdateNotAllowed)
                }

                let packages = projectDetails.packages

                let allPackagesCompleted = true
                packages.map((obj) => {

                    console.log(obj.status)
                    if (obj.workStatus != constants.PROJECT_STATUS.COMPLETED) {
                        allPackagesCompleted = false
                    }
                    console.log({ allPackagesCompleted })
                })

                console.log("OUT", { allPackagesCompleted })

                if (!allPackagesCompleted) {

                    return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.FinishProjectNotAllowed)

                } else {

                    let updateObj = {
                        projectStatus: constants.PROJECT_STATUS.COMPLETED
                    }

                    return dao.updateProject(projectQuery, updateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.ProjectCompleted)

                        } else {

                            console.log("Failed to finish project")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                }

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get admin notifications
 * @param {String} id mongo id of admin
 * @param {Object} queryParams pagination params
 */
function getAllNotifications(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id
        }

        return dao.getUserDetails(userQuery).then(async (userDetails) => {

            if (userDetails) {

                let notificationQuery = {
                    receiverId: id
                }

                let totalRecords = await dao.getNotificationCount(notificationQuery)

                let skip = 0
                let limit = 10
                if (queryParams.skip) {
                    skip = queryParams.skip
                }
                if (queryParams.limit) {
                    limit = queryParams.limit
                }
                return dao.getAllNotifications(notificationQuery, parseInt(skip) * parseInt(limit), parseInt(limit)).then((notifications) => {

                    let ids = []

                    notifications.map((obj) => {
                        ids.push(obj._id)
                    })
                    let query = {
                        _id: { $in: ids }
                    }
                    let update = {
                        isRead: true
                    }

                    return dao.updateNotifications(query, update).then((updated) => {

                        let respObj = {
                            "recordsTotal": totalRecords,
                            "recordsFiltered": notifications.length,
                            "records": notifications
                        }

                        return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)
                    })

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update notification status
 * @param {String} id mongo id of admin
 * @param {Object} details notification records id whose status to be updated
 */
function updateNotificationStatus(id, details) {

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let userQuery = {
            _id: id
        }

        return dao.getUserDetails(userQuery).then((userDetails) => {

            if (userDetails) {

                let notificationQuery = {
                    _id: { $in: details.notificationIds }
                }
                let update = {
                    isRead: true
                }

                return dao.updateNotifications(notificationQuery, update).then((updated) => {

                    if (updated) {

                        return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.NotificationStatusUpdated)
                    } else {

                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get chat list
 * @param {String} id mongo id of user
 * @param {Object} filters searching, pagination parameters
 */
function getChatList(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            $or: [
                { participateId1: ObjectId(id) },
                { participateId2: ObjectId(id) }
            ]
        }

        let sortQuery = {}

        sortQuery['lastMessageTime'] = -1

        let chatQuery = [{
            $match: query
        }, {
            $lookup: {
                from: constants.DB_MODEL_REF.USERS,
                localField: "participateId1",
                foreignField: '_id',
                as: 'participant1Details'
            }
        }, {
            $unwind: "$participant1Details"
        }, {
            $lookup: {
                from: constants.DB_MODEL_REF.USERS,
                localField: "participateId2",
                foreignField: '_id',
                as: 'participant2Details'
            }
        }, {
            $unwind: "$participant2Details"
        },
        {
            $unwind: "$data"
        },
        {
            $group: {
                _id: "$_id",
                lastMessageObj: { $last: "$data" },
                participant1Details: { $first: "$participant1Details" },
                participant2Details: { $first: "$participant2Details" },
                lastMessageTime: { $first: "$lastMessageTime" }
            }
        },
        {
            $project: {
                "participant1Details._id": "$participant1Details._id",
                "participant1Details.profilePicture": "$participant1Details.profilePicture",
                "participant1Details.fullName": "$participant1Details.fullName",
                "participant1Details.isLoggedOut":"$participant1Details.isLoggedOut",

                "participant2Details._id": "$participant2Details._id",
                "participant2Details.profilePicture": "$participant2Details.profilePicture",
                "participant2Details.fullName": "$participant2Details.fullName",
                "participant2Details.isLoggedOut":"$participant2Details.isLoggedOut",
                "lastMessageTime": 1,
                "lastMessageObj": "$lastMessageObj"
            }
        },
        {
            $sort: sortQuery
        }]

        return dao.getChatList(chatQuery).then((chatList) => {

            let updatedChatList = []

            chatList.map((obj) => {

                if (obj.participant1Details._id.toString() == id.toString()) {

                    updatedChatList.push({
                        _id: obj._id,
                        lastMessageTime: obj.lastMessageTime,
                        lastMessageObj: obj.lastMessageObj,
                        participantDetails: obj.participant2Details
                    })
                } else {

                    updatedChatList.push({
                        _id: obj._id,
                        lastMessageTime: obj.lastMessageTime,
                        lastMessageObj: obj.lastMessageObj,
                        participantDetails: obj.participant1Details
                    })
                }
            })

            // let searchQuery = {}
            if (queryParams.search) {

                let searcher = new fuzzySearch(updatedChatList, ['participantDetails.fullName'], {
                    caseSensitive: false,
                });
                updatedChatList = searcher.search(queryParams.search);
            }

            let skip = 0
            let limit = 10
            if (queryParams.skip) {
                skip = queryParams.skip
            }
            if (queryParams.limit) {
                limit = queryParams.limit
            }
            let respObj = {
                "recordsTotal": updatedChatList.length,
                "recordsFiltered": 0,
                "records": updatedChatList
            }
            let paginatedChatList = updatedChatList.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))
            respObj.recordsFiltered = paginatedChatList.length
            respObj.records = paginatedChatList

            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, respObj)

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}

// /**
//  * Get chat history
//  * @param {String} id mongo id of user
//  * @param {String} roomId mongo id of chat room
//  */
// function getChatHistory(id, roomId) {

//     if (!id || !ObjectId.isValid(id) || !roomId) {

//         return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
//     } else {

//         let query = {

//             _id: ObjectId(roomId)
//         }

//         let chatQuery = [{

//             $match: query
//         }, 
//         // {
//         //     $lookup: {
//         //         from: constants.DB_MODEL_REF.USERS,
//         //         localField: "participateId1",
//         //         foreignField: '_id',
//         //         as: 'participant1Details'
//         //     }
//         // }, {
//         //     $unwind: "$participant1Details"
//         // }, {
//         //     $lookup: {
//         //         from: constants.DB_MODEL_REF.USERS,
//         //         localField: "participateId2",
//         //         foreignField: '_id',
//         //         as: 'participant2Details'
//         //     }
//         // }, {
//         //     $unwind: "$participant2Details"
//         // },
//         {
//             $project: {
//                 // "participant1Details._id": "$participant1Details._id",
//                 // "participant1Details.profilePicture": "$participant1Details.profilePicture",
//                 // "participant1Details.fullName": "$participant1Details.fullName",
//                 // "participant2Details._id": "$participant2Details._id",
//                 // "participant2Details.profilePicture": "$participant2Details.profilePicture",
//                 // "participant2Details.fullName": "$participant2Details.fullName",
//                 "data": "$data"
//             }
//         }]
//         return dao.getChats(chatQuery).then((messages) => {

//             if (messages.length > 0) {

//                 return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.Success, messages[0])
//             } else {

//                 return mapper.responseMapping(usrConst.CODE.Success, usrConst.MESSAGE.Success)
//             }

//         }).catch((err) => {

//             console.log({ err })
//             return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
//         })
//     }
// }

/**
 * Withdraw package collaborating
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function withdrawPackage(id, projectId, packageId) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !packageId || !ObjectId.isValid(packageId)) {

        return mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails)
    } else {

        let collaboratorQuery = {
            _id: id,
            status: constants.STATUS.ACTIVE
        }

        let projectQuery = {
            _id: ObjectId(projectId)
        }
        // Fetching collaborator and project details
        return Promise.all([dao.getUserDetails(collaboratorQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(usrConst.CODE.DataNotFound, usrConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.ProjectNotFound)

            } else {

                let collaboratorDetails = results[0]
                let projectDetails = results[1]
                let packages = projectDetails['packages']
                let packageDetails = packages.find(obj => obj._id.toString() == packageId.toString())

                // Check if package exists or not
                if (packageDetails) {

                    let projectUpdateObj = {}
                    let packageUpdateObj = packageDetails
                    let collaborators = packageDetails['collaborators']
                    let updatedCollaborators = collaborators.filter(obj => obj.toString() != id.toString())

                    packageUpdateObj['collaborators'] = updatedCollaborators

                    // Update package details
                    let updateProjectQuery = {
                        _id: ObjectId(projectId),
                        "packages._id": ObjectId(packageId)
                    }
                    projectUpdateObj["packages.$"] = packageUpdateObj

                    // Check if collaborator exists in any other package
                    // If no, then update the project team members
                    // If yes, do nothing
                    let restPackages = packages.filter(obj => obj._id.toString() != packageId.toString())
                    let isUserCollaboratesAnotherPackage = false
                    restPackages.map((obj) => {

                        let collaborators = obj['collaborators']
                        if (collaborators.includes(id)) {
                            isUserCollaboratesAnotherPackage = true
                        }
                    })

                    if (!isUserCollaboratesAnotherPackage) {

                        let updatedTeamMembers = projectDetails['totalTeamMembers'].filter(obj => obj.toString() != id.toString())

                        projectUpdateObj['totalTeamMembers'] = updatedTeamMembers
                    }

                    return dao.updateProject(updateProjectQuery, projectUpdateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMappingWithData(usrConst.CODE.Success, usrConst.MESSAGE.WithdrawPackageSuccess, updated)

                        } else {

                            console.log("Failed to update package withdrawing")
                            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(usrConst.CODE.ReqTimeOut, usrConst.MESSAGE.PackageNotFound)

                }

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError)
        })
    }
}
module.exports = {

    firstStepRegister,

    secondStepRegister,

    verifySecurityCode,

    resendCode,

    login,

    getProfile,

    updateProfile,

    forgotPassword,

    setNewPassword,

    resetPassword,

    logout,

    getAllActivities,

    removeActivity,

    removeAllActivities,

    changeEmailRequest,

    updateEmail,

    changeContactRequest,

    updateContact,

    getCMSDetails,

    getMasterDetails,

    createProject,

    getMyInitiatedProjects,

    updateProject,

    getProjectDetails,

    getAllUsers,

    addPackage,

    updatePackage,

    getAllPackages,

    removePortfolioProject,

    getPortfolioProjectDetails,

    getEmploymentDetails,

    getEducationDetails,

    exploreProjects,

    addSkills,

    getSkills,

    addEmploymentHistory,

    addEducation,

    updateEmploymentDetails,

    deleteEmploymentHistory,

    updateEducation,

    deleteEducation,

    addPortfolio,

    removeSkills,

    inviteFriends,

    joinPackage,

    getAllProjectRequestReceived,

    getPackageDetails,

    getExploreBudgetRange,

    getMyProjectsBudgetRange,

    getMyProjectList,

    getAllPackageRequestReceived,

    getUserRequestReceived,

    getAllProjectRequestSent,

    getAllPackageRequestSent,

    updateJoinRequest,

    createSupportTicket,

    getAllSupportTicket,

    addComment,

    getAllFAQs,

    contactUs,

    startWork,

    submitWork,

    getWorkProgressList,

    updateSubmissionStatus,

    finishPackage,

    finishProject,

    getAllNotifications,

    updateNotificationStatus,

    getChatList,

    // getChatHistory,

    withdrawPackage

}
