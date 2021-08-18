/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const dao = require('./adminDao')
const admConst = require('./adminConstants')
const mapper = require('./adminMapper')
const constants = require('../../constants')
const appUtils = require('../../appUtils')
const jwtHandler = require('../../middleware/jwtHandler')
var ObjectId = require('mongoose').Types.ObjectId
const mailHandler = require('../../middleware/email')
const redisServer = require('../../redis')
const socketHandler = require('../../middleware/socketHandler')

/*#################################            Load modules end            ########################################### */

/**
 * Login
 * @param {Object} details admin login details
 */
function login(details) {
    if (!details || (Object.keys(details).length == 0)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {}
        if (details.emailId) {
            query.emailId = details.emailId.toLowerCase()

        } else {
            query.contactNumber = details.contactNumber
        }

        return dao.getAdminDetails(query).then(async (adminDetails) => {

            if (adminDetails) {

                let isValidPassword = await appUtils.verifyPassword(details, adminDetails)

                if (isValidPassword) {
                    let prevLoginActivities = adminDetails.loginActivity

                    prevLoginActivities.push({
                        device: details.device,
                        date: details.date,
                        browser: details.browser,
                        ipaddress: details.ipaddress,
                        country: details.country,
                        state: details.state,
                        status: constants.STATUS.ACTIVE
                    })
                    let updateObj = {
                        isLoggedOut: false,
                        loginActivity: prevLoginActivities
                    }

                    if (adminDetails.twoFactorAuthentication) {

                        let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                        console.log({ verificationCode })

                        updateObj.OTP = verificationCode
                        // If login is attempted by email id, then verification code is to be sent to registered email address

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

                                    let userObj = {
                                        emailId: adminDetails.emailId.toLowerCase(),
                                        verificationCode: verificationCode,
                                        fullName: adminDetails.fullName || 'Admin'
                                    }
                                    let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, serviceDetails)
                                    // console.log({ mailSent })
                                }
                            }
                        }
                        // If login is attempted by contact number, then verification code is to be sent to registered contact number

                        if (details.contactNumber) {

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
                                    let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, adminDetails.contactNumber)
                                    // console.log({ twilioResponse })
                                }
                            }

                        }
                    }

                    return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            if (adminUpdated.twoFactorAuthentication) {

                                let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                                if (details.emailId) {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.EmailChangeVerificationSent, filteredAdminResponseFields)
                                } else {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ContactChangeVerificationSent, filteredAdminResponseFields)
                                }

                            } else {

                                let adminObj = {
                                    _id: adminDetails._id,
                                    emailId: adminDetails.emailId.toLowerCase(),
                                    contactNumber: adminDetails.contactNumber
                                }
                                return jwtHandler.genAdminToken(adminObj).then((token) => {

                                    let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                                    filteredAdminResponseFields.token = token

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.LoginSuccess, filteredAdminResponseFields)
                                }).catch((err) => {

                                    console.log({ err })
                                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                                })

                            }

                        } else {

                            console.log("Failed to update admin login status")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidPassword)

                }
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let updateObj = {
                    isOTPVerified: true
                }

                return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                    if (adminUpdated) {

                        let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)

                        let adminObj = {
                            _id: adminUpdated._id,
                            emailId: adminUpdated.emailId.toLowerCase(),
                            contactNumber: adminUpdated.contactNumber
                        }
                        return jwtHandler.genAdminToken(adminObj).then((token) => {

                            filteredAdminResponseFields.token = token

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.VerificationSuccess, filteredAdminResponseFields)
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })

                    } else {

                        console.log("Failed to update admin profile")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidVerificationCode)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Logout
 * @param {String} id mongo id of admin
 * @param {String} activityId mongo id of login activity to be inactivated
 */
function logout(id, activityId) {

    if (!id || !ObjectId.isValid(id) || !activityId || !ObjectId.isValid(activityId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let activities = adminDetails.loginActivity
                let index = activities.findIndex(obj => obj._id == activityId)

                console.log({ index })
                if (index > -1) {

                    activities.splice(index, 1)

                    let updateObj = {
                        loginActivity: activities,
                        isLoggedOut: true
                    }

                    return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.LogoutSuccess)

                        } else {

                            console.log("Failed to update admin login status")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })

                } else {

                    return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.Success)
                }
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get profile
 * @param {string} id mongo id of admin to fetch profile details
 */
function getProfile(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let filteredAdminResponseFields = mapper.filterAdminResponse(adminDetails)

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, filteredAdminResponseFields)
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update profile
 * @param {string} id mongo id of admin
 * @param {object} details admin profile updating details
 */
function updateProfile(id, details) {

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                if (details.emailId) {
                    delete details.emailId
                }
                if (details.contactNumber) {
                    delete details.contactNumber
                }

                details.editedAt = new Date().getTime()

                return dao.updateProfile(query, details).then(async (adminUpdated) => {

                    if (adminUpdated) {

                        if (details.hasOwnProperty('twoFactorAuthentication')) {

                            let thirdPartyServiceQuery = {
                                type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                                status: constants.STATUS.ACTIVE
                            }

                            let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                            if (serviceDetails) {

                                let mailQuery = {
                                    type: constants.TEMPLATE_TYPES.EMAIL,
                                    status: constants.STATUS.ACTIVE
                                }
                                if (details.twoFactorAuthentication) {

                                    mailQuery.mailName = constants.EMAIL_TEMPLATES.TWO_FACTOR_AUTHENTICATION_ENABLED
                                } else {

                                    mailQuery.mailName = constants.EMAIL_TEMPLATES.TWO_FACTOR_AUTHENTICATION_DISABLED

                                }
                                let templateDetails = await dao.getTemplateDetails(mailQuery);

                                if (templateDetails) {
                                    let adminObj = {
                                        fullName: adminUpdated.fullName,
                                        emailId: adminUpdated.emailId,
                                    }
                                    let mailSent = mailHandler.SEND_MAIL(adminObj, templateDetails, serviceDetails)
                                }
                            }
                        }

                        let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProfileUpdated, filteredAdminResponseFields)

                    } else {

                        console.log("Failed to update profile")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Recover password by email
 * @param {string} emailId email id of admin for recover password
 */
function forgotPassword(emailId) {

    if (!emailId || (!appUtils.isValidEmail(emailId))) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            emailId: emailId.toLowerCase()
        }
        return dao.getAdminDetails(query).then(async (isExist) => {

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
                        mailName: constants.EMAIL_TEMPLATES.ADMIN_FORGOT_PASSWORD,
                        status: constants.STATUS.ACTIVE
                    }
                    let templateDetails = await dao.getTemplateDetails(mailQuery);

                    if (templateDetails) {
                        let adminObj = {
                            fullName: isExist.fullName,
                            emailId: isExist.emailId.toLowerCase(),
                            redisId: redisId
                        }
                        let mailSent = mailHandler.SEND_MAIL(adminObj, templateDetails, serviceDetails)
                    }
                }

                return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.ResetPasswordMailSent)

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((e) => {

            console.log({ e })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

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
                            type: constants.TEMPLATE_TYPES.EMAIL,
                            mailName: constants.EMAIL_TEMPLATES.ADMIN_RESET_PASSWORD,
                            status: constants.STATUS.ACTIVE
                        }
                        let templateDetails = await dao.getTemplateDetails(query)

                        let mailBodyDetails = updateDone

                        let mailConfig = mailHandler.SEND_MAIL(mailBodyDetails, templateDetails, serviceDetails)
                    }

                    return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.PasswordUpdateSuccess)

                } else {
                    console.log("Failed to reset password");
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                }

            }).catch((e) => {

                console.log({ e })
                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
            })

        } else {

            return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ResetPasswordLinkExpired)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let passObj = {
                    password: oldPassword
                }
                return appUtils.verifyPassword(passObj, adminDetails).then(async (isPasswordMatch) => {

                    if (isPasswordMatch) {

                        let password = newPassword;
                        let newPass = await appUtils.convertPass(password);

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
                                        type: constants.TEMPLATE_TYPES.EMAIL,
                                        mailName: constants.EMAIL_TEMPLATES.ADMIN_RESET_PASSWORD,
                                        status: constants.STATUS.ACTIVE
                                    }
                                    let templateDetails = await dao.getTemplateDetails(query);

                                    let mailBodyDetails = updateDone

                                    let mailConfig = mailHandler.SEND_MAIL(mailBodyDetails, templateDetails, serviceDetails)
                                }

                                return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.PasswordUpdateSuccess)

                            } else {
                                console.log("Failed to reset password");
                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                            }
                        }).catch((e) => {

                            console.log({ e });
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })
                    } else {

                        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.OldPasswordNotMatch)
                    }
                }).catch((e) => {

                    console.log({ e });
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let duplicateEmailQuery = {
            emailId: emailId.toLowerCase(),
            _id: { $ne: id }
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getAdminDetails(duplicateEmailQuery)]).then(async (details) => {

            if (!details[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (details[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.EmailAlreadyExists)
            } else {

                if (details[0].emailId.toLowerCase() == emailId.toLowerCase()) {

                    let updateObj = {

                        emailId: emailId.toLowerCase(),
                        editedAt: new Date().getTime()
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.EmailResetSuccessful, filteredAdminResponseFields)

                        } else {

                            console.log("Failed to update email id")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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
                                verificationCode: verificationCode,
                                fullName: details[0].fullName || 'Admin'
                            }
                            let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, serviceDetails)
                            console.log({ mailSent })
                        }
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.EmailChangeVerificationSent)

                        } else {

                            console.log("Failed to update verificationCode")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })

                }
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let updateObj = {
                    emailId: emailId.toLowerCase(),
                    editedAt: new Date().getTime()
                }

                return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                    if (adminUpdated) {

                        let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.EmailResetSuccessful, filteredAdminResponseFields)

                    } else {

                        console.log("Failed to update email id")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidVerificationCode)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let duplicateContactQuery = {
            contactNumber: contactNumber,
            _id: { $ne: id }
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getAdminDetails(duplicateContactQuery)]).then(async (details) => {

            if (!details[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (details[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.ContactNumberAlreadyExists)
            } else {

                if (details[0].contactNumber == contactNumber) {

                    let updateObj = {

                        contactNumber: contactNumber,
                        editedAt: new Date().getTime()
                    }

                    return dao.updateProfile(adminQuery, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ContactResetSuccessful, filteredAdminResponseFields)

                        } else {

                            console.log("Failed to update email id")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

                    return dao.updateProfile(adminQuery, updateObj).then((adminUpdated) => {

                        if (adminUpdated) {

                            return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.ContactChangeVerificationSent)

                        } else {

                            console.log("Failed to update verificationCode")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }

                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })

                }
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
            OTP: code
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let updateObj = {
                    contactNumber: contactNumber,
                    editedAt: new Date().getTime()
                }

                return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                    if (adminUpdated) {

                        let filteredAdminResponseFields = mapper.filterAdminResponse(adminUpdated)
                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ContactResetSuccessful, filteredAdminResponseFields)

                    } else {

                        console.log("Failed to update contact number")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidVerificationCode)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Resend verification code
 * @param {String} id mongo id of admin
 * @param {Object} details email id or contact number on which verification code is to be sent
 */
function resendCode(id, details) {

    if (!id || !details || (Object.keys(details).length == 0)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {}
        if (details.emailId) {
            query.emailId = details.emailId.toLowerCase()
        } else {
            query.contactNumber = details.contactNumber
        }

        return dao.getAdminDetails(query).then(async (adminDetails) => {

            if (adminDetails) {

                let verificationCode = Math.floor(Math.random() * (999999 - 100000) + 100000)
                console.log({ verificationCode })

                let updateObj = {}
                updateObj.OTP = verificationCode
                // If resend is attempted for email id, then verification code is to be sent to registered email address
                // If resend is attempted for contact number, then verification code is to be sent to registered contact number

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

                            let userObj = {
                                emailId: adminDetails.emailId.toLowerCase(),
                                verificationCode: verificationCode,
                                fullName: adminDetails.fullName || 'Admin'
                            }
                            let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, serviceDetails)
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
                            let twilioResponse = mailHandler.sendMessage(twilioConfig, usrObj, adminDetails.contactNumber)
                            console.log({ twilioResponse })
                        }
                    }

                }

                return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                    if (adminUpdated) {

                        if (details.emailId) {

                            return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.EmailChangeVerificationSent)
                        } else {

                            return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.ContactChangeVerificationSent)
                        }

                    } else {

                        console.log("Failed to update new verification code")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Set default password
 * @param {String} id mongo id of admin
 * @param {String} defaultPassword default password to be set for creating user
 */
function setDefaultPassword(id, defaultPassword) {

    if (!id || !defaultPassword) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let updateObj = {
                    defaultPassword: defaultPassword
                }

                return dao.updateProfile(query, updateObj).then((adminUpdated) => {

                    if (adminUpdated) {

                        return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.DefaultPasswordReset)
                    } else {

                        console.log("Failed to set default password")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get default password
 * @param {String} id mongo id of admin
 */
function getDefaultPassword(id) {

    if (!id) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let respObj = {
                    defaultPassword: adminDetails.defaultPassword
                }
                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all users
 * @param {String} id mongo id of admin
 * @param {Object} queryParams query params for sorting, paginations
 * @param {Object} filters filters on country, registered dates to be applied
 */
function getAllUsers(id, queryParams, filters) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then(async (adminDetails) => {

            if (adminDetails) {

                let userQuery = {}

                if (queryParams.search) {

                    userQuery['$or'] = [
                        { 'emailId': { '$regex': queryParams.search, '$options': 'i' } },
                        { 'fullName': { '$regex': queryParams.search, '$options': 'i' } },
                    ]
                }
                if (filters.minDate) {

                    userQuery['createdAt'] = {
                        $gte: filters.minDate
                    }
                }
                if (filters.maxDate) {

                    userQuery['createdAt'] = {
                        ...userQuery['createdAt'],
                        $lte: filters.maxDate
                    }
                }
                if (queryParams.adminVerification) {

                    userQuery['adminVerification'] = queryParams.adminVerification
                }

                console.log(userQuery)

                let totalUsers = await dao.getUserCounts(userQuery)

                let sortQuery = {}
                if (queryParams.column) {

                    sortQuery[queryParams.column] = ((queryParams.dir == "asc") ? 1 : -1)
                } else {

                    sortQuery['createdAt'] = -1
                }

                let aggregateQuery = [
                    {
                        $match: userQuery
                    },
                    {
                        $sort: sortQuery
                    },
                    {
                        $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                    },
                    {
                        $limit: parseInt(queryParams.limit)
                    }, {
                        $project: {
                            '_id': 1,
                            'isOTPVerified': 1,
                            'profilePicture': 1,
                            'status': 1,
                            'fullName': 1,
                            'emailId': 1,
                            'contactNumber': 1,
                            'createdAt': 1,
                            'document': 1,
                            'loginActivity': 1,
                            'adminVerification': 1,
                        }
                    }
                ]

                return dao.getAllUsers(aggregateQuery).then((users) => {

                    let respObj = {
                        "recordsTotal": totalUsers,
                        "recordsFiltered": users.length,
                        "records": users
                    }

                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Create User
 * @param {String} id mongo id of admin
 * @param {Object} details details of user to be added
 */
function createUser(id, details) {

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let adminQuery = {
            _id: id
        }

        let userEmailQuery = {
            emailId: details.emailId.toLowerCase()
        }
        let userContactQuery = {

            contactNumber: details.contactNumber
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userEmailQuery, {}), dao.getUserDetails(userContactQuery, {})]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (results[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.EmailAlreadyExists)
            } else if (results[2]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.ContactNumberAlreadyExists)
            } else {

                let adminDetails = results[0]

                let convertedPassword = await appUtils.convertPass(adminDetails.defaultPassword)
                details.password = convertedPassword

                details.isPasswordReset = false
                details.createdAt = new Date().getTime()
                details.createdBy = id

                return dao.createUser(details).then(async (userCreated) => {

                    if (userCreated) {

                        let filteredUserFields = mapper.filteredUserFields(userCreated)

                        let thirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                        if (serviceDetails) {

                            let mailQuery = {
                                type: constants.TEMPLATE_TYPES.EMAIL,
                                mailName: constants.EMAIL_TEMPLATES.NEW_USER_CREATED_BY_ADMIN,
                                status: constants.STATUS.ACTIVE
                            }

                            let templateDetails = await dao.getTemplateDetails(mailQuery)
                            if (templateDetails) {

                                let userObj = {
                                    emailId: userCreated.emailId.toLowerCase(),
                                    fullName: userCreated.fullName,
                                    password: adminDetails.defaultPassword
                                }
                                let mailSent = mailHandler.SEND_MAIL(userObj, templateDetails, serviceDetails)
                                console.log({ mailSent })
                            }
                        }

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.UserCreatedSuccess, filteredUserFields)
                    } else {

                        console.log("Failed to create user")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get user details
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user to fetch details
 */
function getUserDetails(id, userId) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let userQuery = {
            _id: userId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                let filteredUserDetails = mapper.filteredUserFields(results[1])
                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, filteredUserDetails)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update user
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id user to be updated
 * @param {Object} userDetails user details to be updated
 */
function updateUser(id, userId, userDetails) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId) || !userDetails || (Object.keys(userDetails).length == 0)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let userQuery = {
            _id: userId,
            status: constants.STATUS.ACTIVE
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                userDetails.editedAt = new Date().getTime()
                userDetails.editedBy = id

                return dao.updateUser(userQuery, userDetails).then((userUpdated) => {

                    if (userUpdated) {

                        let filteredUserDetails = mapper.filteredUserFields(userUpdated)
                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.userUpdatedSuccess, filteredUserDetails)
                    } else {

                        console.log("Failed to update user")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete or Resurrect user
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user to be deleted or resurrected
 */
function deleteUser(id, userId) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let userQuery = {
            _id: userId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                let userDetails = results[1]

                if (userDetails.status == constants.STATUS.ACTIVE) {

                    userDetails.status = constants.STATUS.INACTIVE
                } else {

                    userDetails.status = constants.STATUS.ACTIVE
                }
                userDetails.editedAt = new Date().getTime()
                userDetails.editedBy = id

                return dao.updateUser(userQuery, userDetails).then((userUpdated) => {

                    if (userUpdated) {

                        let filteredUserDetails = mapper.filteredUserFields(userUpdated)
                        if (filteredUserDetails.status == constants.STATUS.ACTIVE) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.UserActivated, filteredUserDetails)
                        } else {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.UserDeactivated, filteredUserDetails)
                        }
                    } else {

                        console.log("Failed to update user status")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get user counts
 * @param {String} id mongo id of admin
 */
function getUserCounts(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then(async (adminDetails) => {

            if (adminDetails) {

                let userQuery = {}

                let totalUsers = await dao.getUserCounts(userQuery)

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, totalUsers)

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all template entities
 * @param {String} id mongo id of admin
 */
function getAllTemplateEntities(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let entities = constants.TEMPLATE_ENTITIES
                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, entities)
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Create Template
 * @param {string} id mongo id of admin who is creating template
 * @param {object} templateDetails email template details to be added
 */
function createTemplate(id, templateDetails) {

    if (!id || !ObjectId.isValid(id) || !templateDetails || (Object.keys(templateDetails).length == 0)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let mailQuery = {

                    mailName: templateDetails.mailName
                }

                return dao.getTemplateDetails(mailQuery).then((templateExists) => {

                    if (templateExists) {

                        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.TemplateAlreadyExists)
                    } else {

                        let filterAllowedTemplateFields = mapper.filterAllowedTemplateFields(templateDetails)
                        filterAllowedTemplateFields.createdBy = id
                        filterAllowedTemplateFields.createdAt = new Date().getTime()

                        return dao.createTemplate(filterAllowedTemplateFields).then((templateCreated) => {

                            if (templateCreated) {

                                let allowedTemplateFields = mapper.filterAllowedTemplateFields(templateCreated)
                                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.TemplateCreatedSuccess, allowedTemplateFields)

                            } else {

                                console.log('Failed to create template')
                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all templates
 * @param {string} id mongo id of admin to fetch templates
 * @param {Object} queryParams query params for sorting, paginations
 */
function getAllTemplates(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then(async (adminDetails) => {

            if (adminDetails) {

                let tmpQuery = {}
                if (queryParams.type) {
                    tmpQuery.type = queryParams.type.toUpperCase()
                }

                if (queryParams.search) {

                    tmpQuery['$or'] = [
                        { 'mailTitle': { '$regex': queryParams.search, '$options': 'i' } },
                        { 'mailName': { '$regex': queryParams.search, '$options': 'i' } },
                        { 'mailSubject': { '$regex': queryParams.search, '$options': 'i' } },
                    ]
                }

                let totalTemplates = await dao.getTemplateCounts(tmpQuery)

                let sortQuery = {}
                if (queryParams.column) {

                    sortQuery[queryParams.column] = ((queryParams.dir == "asc") ? 1 : -1)
                } else {

                    sortQuery['createdAt'] = -1
                }

                let aggregateQuery = [
                    {
                        $match: tmpQuery
                    },
                    {
                        $sort: sortQuery
                    },
                    {
                        $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                    },
                    {
                        $limit: parseInt(queryParams.limit)
                    }, {
                        $project: {
                            '_id': 1,
                            'mailName': 1,
                            'mailTitle': 1,
                            'mailSubject': 1,
                            'mailBody': 1,
                            'status': 1,
                            'createdAt': 1,
                            'createdBy': 1,
                            'type': 1,
                            'notificationMessage': 1
                        }
                    }
                ]
                return dao.getAllTemplates(aggregateQuery).then((templates) => {

                    let respObj = {
                        "recordsTotal": totalTemplates,
                        "recordsFiltered": templates.length,
                        "records": templates
                    }
                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get template details
 * @param {string} id mongo id of admin
 * @param {string} templateId mongo id of template to fetch details
 */
function getTemplateDetails(id, templateId) {

    if (!id || !ObjectId.isValid(id) || !templateId || !ObjectId.isValid(templateId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let templateQuery = {
                    _id: templateId
                }

                return dao.getTemplateDetails(templateQuery).then((templateDetails) => {

                    if (templateDetails) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, templateDetails)

                    } else {

                        return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TemplateNotFound)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update template
 * @param {String} id mongo id of admin
 * @param {String} templateId mongo id of template to be updated
 * @param {object} templateUpdatingDetails template updating details
 */
function updateTemplate(id, templateId, templateUpdatingDetails) {

    if (!id || !ObjectId.isValid(id) || !templateId || !ObjectId.isValid(templateId) || !templateUpdatingDetails || Object.keys(templateUpdatingDetails).length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let templateQuery = {
                    _id: templateId,
                    status: constants.STATUS.ACTIVE
                }

                return dao.getTemplateDetails(templateQuery).then((templateDetails) => {

                    if (templateDetails) {

                        let filterTemplateUpdateFields = mapper.filterTemplateUpdateFields(templateUpdatingDetails)
                        filterTemplateUpdateFields.editedAt = new Date().getTime()
                        filterTemplateUpdateFields.editedBy = id

                        return dao.updateTemplate(templateQuery, filterTemplateUpdateFields).then((templateUpdated) => {

                            if (templateUpdated) {

                                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.TemplateUpdated, templateUpdated)
                            } else {

                                console.log("Failed to update template")
                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })

                    } else {

                        return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TemplateNotFound)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete or Resurrect template
 * @param {String} id mongo id of admin
 * @param {String} templateId mongo id of template to deleted or resurrected
 */
function deleteTemplate(id, templateId) {

    if (!id || !ObjectId.isValid(id) || !templateId || !ObjectId.isValid(templateId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let templateQuery = {
                    _id: templateId
                }

                return dao.getTemplateDetails(templateQuery).then((templateDetails) => {

                    if (templateDetails) {

                        let updateObj = {}
                        if (templateDetails.status == constants.STATUS.ACTIVE) {

                            updateObj = {
                                status: constants.STATUS.INACTIVE
                            }
                        } else {

                            updateObj = {
                                status: constants.STATUS.ACTIVE
                            }
                        }
                        return dao.updateTemplate(templateQuery, updateObj).then((templateUpdated) => {

                            if (templateUpdated) {

                                if (templateUpdated.status == constants.STATUS.ACTIVE) {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.TemplateActivated, templateUpdated)
                                } else {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.TemplateDeactivated, templateUpdated)
                                }

                            } else {

                                console.log("Failed to update template")
                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })

                    } else {

                        return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TemplateNotFound)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Create third party service
 * @param {String} id mongo id of admin
 * @param {Object} details third party service credeintials to be set
 */
function createService(id, details) {

    if (!id || (!ObjectId.isValid(id)) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let serviceQuery = {
            type: details.type
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getServiceDetails(serviceQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (results[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.ThirdPartyServiceAlreadyExists)
            } else {

                details.createdAt = new Date().getTime()
                details.createdBy = id

                return dao.createService(details).then((created) => {

                    if (created) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ServiceCreatedSuccess, created)

                    } else {

                        console.log("Failed to create third party service")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

        })
    }
}

/**
 * Get all third party services
 * @param {String} id mongo id of admin
 */
function getAllServices(id) {

    if (!id || (!ObjectId.isValid(id))) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (!adminDetails) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else {

                return dao.getAllServices().then((services) => {

                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, services)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

        })
    }
}

/**
 * Get third party service details
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
*/
function getServiceDetails(id, serviceId) {

    if (!id || !ObjectId.isValid(id) || !serviceId || !ObjectId.isValid(serviceId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let serviceQuery = {
            _id: serviceId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getServiceDetails(serviceQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.InvalidThirdParty)
            } else {

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, results[1])

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update third party service details
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
 * @param {Object} details details to be updated
 */
function updateService(id, serviceId, details) {

    if (!id || !ObjectId.isValid(id) || !serviceId || !ObjectId.isValid(serviceId) || !details || Object.keys(details).length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let serviceQuery = {
            _id: serviceId,
            // status: constants.STATUS.ACTIVE
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getServiceDetails(serviceQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.InvalidThirdParty)
            } else {

                details.editedAt = new Date().getTime()
                details.editedBy = id

                return dao.updateService(serviceQuery, details).then((serviceUpdated) => {

                    if (serviceUpdated) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ThirdPartyServiceUpdated, serviceUpdated)

                    } else {

                        console.log("Failed to update service")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete/ resurrect third party service
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
 */
function deleteService(id, serviceId) {

    if (!id || !ObjectId.isValid(id) || !serviceId || !ObjectId.isValid(serviceId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let serviceQuery = {
            _id: serviceId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getServiceDetails(serviceQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.InvalidThirdParty)
            } else {

                let serviceDetails = results[1]
                let updateObj = {}
                if (serviceDetails.status == constants.STATUS.ACTIVE) {

                    updateObj.status = constants.STATUS.INACTIVE
                } else {

                    updateObj.status = constants.STATUS.ACTIVE
                }

                updateObj.editedAt = new Date().getTime()
                updateObj.editedBy = id

                return dao.updateService(serviceQuery, updateObj).then((serviceUpdated) => {

                    if (serviceUpdated) {

                        if (serviceUpdated.status == constants.STATUS.ACTIVE) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ThirdPartyServiceActivatedSuccess, serviceUpdated)
                        } else {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ThirdPartyServiceDeactivatedSuccess, serviceUpdated)
                        }

                    } else {

                        console.log("Failed to update service")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Add roles which will be available for project
 * @param {String} id mongo id of admin
 * @param {Array} projectRoles list of roles to be added in project
 */
function addProjectRoles(id, projectRoles) {

    if (!id || !projectRoles || projectRoles.length == 0) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                return dao.addRoles(query, projectRoles).then((adminUpdated) => {

                    if (adminUpdated) {

                        let respObj = {
                            projectRoles: adminUpdated.projectRoles
                        }
                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.RolesAdded, respObj)
                    } else {

                        console.log("Failed to set default password")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get project roles
 * @param {String} id mongo id of admin
 */
function getProjectRoles(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let respObj = {
                    projectRoles: adminDetails.projectRoles
                }
                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update project role
 * @param {String} id mongo id of admin
 * @param {String} roleId mongo id of projet role
 * @param {String} name role name to be changed
 */
function updateProjectRoles(id, roleId, name) {

    if (!id || !roleId || !name) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let updateQuery = {
                    _id: id,
                    "projectRoles._id": roleId
                }
                let updateObj = {
                    "projectRoles.$.name": name
                }
                return dao.updateProfile(updateQuery, updateObj).then((updated) => {

                    if (updated) {

                        let respObj = {
                            projectRoles: updated.projectRoles
                        }
                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProjectRoleUpdated, respObj)
                    } else {

                        console.log("Failed to update project role")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete/ resurrect project role
 * @param {String} id mongo id of admin
 * @param {String} roleId mongo id of project role 
 */
function deleteProjectRole(id, roleId) {

    if (!id || !roleId) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((adminDetails) => {

            if (adminDetails) {

                let projectRoles = adminDetails.projectRoles

                let roleDetails = projectRoles.find(obj => obj._id.toString() == roleId.toString())

                let status
                if (roleDetails.status == constants.STATUS.ACTIVE) {
                    status = constants.STATUS.INACTIVE
                } else {
                    status = constants.STATUS.ACTIVE
                }
                let updateQuery = {
                    _id: id,
                    "projectRoles._id": roleId
                }
                let updateObj = {
                    "projectRoles.$.status": status
                }
                return dao.updateProfile(updateQuery, updateObj).then((updated) => {

                    if (updated) {

                        let respObj = {
                            projectRoles: updated.projectRoles
                        }
                        if (roleDetails.status == constants.STATUS.INACTIVE) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProjectRoleActivated, respObj)
                        } else {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProjectRoleDeactivated, respObj)
                        }
                    } else {

                        console.log("Failed to update project role")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Remove all login activities of user
 * @param {String} id mongo id of admin
 */
function removeAllActivities(id, userId) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let userQuery = {
            _id: userId
        }
        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!result[1]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                let updateObj = {
                    'loginActivity.$[].status': constants.STATUS.INACTIVE
                }

                return dao.updateMultipleUsers(userId, updateObj).then((activityRemoved) => {

                    if (activityRemoved) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ActivitiesRemoved, activityRemoved)

                    } else {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Remove system activity
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user whose activity is to be removed
 * @param {String} activityId mongo id of system activity to be removed
 */
function removeActivity(id, userId, activityId) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId) || !activityId || !ObjectId.isValid(activityId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let userQuery = {
            _id: userId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.UserNotFound)

            } else {

                userQuery['loginActivity._id'] = activityId
                let updateObj = {
                    'loginActivity.$.status': constants.STATUS.INACTIVE
                }

                return dao.updateUser(userQuery, updateObj).then((userUpdated) => {

                    if (userUpdated) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ActivityRemoved, userUpdated)

                    } else {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Create CMS page
 * @param {String} id mongo id of admin
 * @param {Object} details CMS page details
 */
function createCMS(id, details) {

    if (!id || !ObjectId.isValid(id) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {
        let query = {
            _id: id
        }

        let cmsNameQuery = {
            CMSName: details.CMSName
        }

        return Promise.all([dao.getAdminDetails(query), dao.getCMSDetails(cmsNameQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (result[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.CMSPageAlreadyExists)
            } else {

                details.createdAt = new Date().getTime()
                details.createdBy = id

                return dao.createCMS(details).then((cmsCreated) => {

                    if (!cmsCreated) {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    } else {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.CMSPageCreatedSuccess, cmsCreated)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get CMS page details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS page
 */
function getCMSDetails(id, cmsId) {

    if (!id || !cmsId || !ObjectId.isValid(id) || !ObjectId.isValid(cmsId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {
        let query = {
            _id: id,
        }

        let cmsQuery = {
            _id: cmsId
        }
        return Promise.all([dao.getAdminDetails(query), dao.getCMSDetails(cmsQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!result[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.CMSPageNotFound)
            } else {

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, result[1])
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update CMS Details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS Page
 * @param {Object} details CMS page details to be updated
 */
function updateCMSDetails(id, cmsId, details) {

    if (!id || !ObjectId.isValid(id) || !cmsId || !ObjectId.isValid(cmsId) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        let cmsQuery = {
            _id: cmsId,
            status: constants.STATUS.ACTIVE
        }
        return dao.getAdminDetails(query).then((result) => {

            if (!result) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {
                return dao.getCMSDetails(cmsQuery).then((cmsDetails) => {

                    if (!cmsDetails) {

                        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.CMSPageNotFound)

                    } else {

                        details.editedAt = new Date().getTime()
                        details.editedBy = id

                        if (details.CMSName) {

                            delete details.CMSName
                        }

                        return dao.updateCMS(cmsQuery, details).then((cmsUpdated) => {

                            if (!cmsUpdated) {

                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                            } else {

                                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.CMSPageUpdatedSuccess, cmsUpdated)

                            }

                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Delete/Resurrect CMS page details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS page
 */
function deleteCMSDetails(id, cmsId) {

    if (!id || !cmsId || !ObjectId.isValid(id) || !ObjectId.isValid(cmsId)) {
        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        let cmsQuery = {
            _id: cmsId
        }

        return dao.getAdminDetails(query).then((result) => {

            if (!result) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                return dao.getCMSDetails(cmsQuery).then((cmsData) => {

                    if (!cmsData) {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    } else {

                        if (cmsData.status == constants.STATUS.ACTIVE) {

                            cmsData.status = constants.STATUS.INACTIVE

                        } else {

                            cmsData.status = constants.STATUS.ACTIVE
                        }

                        cmsData.editedAt = new Date().getTime()
                        cmsData.editedBy = id

                        return dao.updateCMS(cmsQuery, cmsData).then((updatedDetails) => {

                            if (!updatedDetails) {

                                return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                            } else {

                                if (updatedDetails.status == constants.STATUS.ACTIVE) {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.CMSPageActivated, updatedDetails)
                                } else {

                                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.CMSPageDeactivated, updatedDetails)
                                }

                            }
                        }).catch((err) => {

                            console.log({ err })
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        })

                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all CMS Pages
 * @param {String} id mongo id of admin
 */
function getAllCMS(id) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {
        let query = {
            _id: id
        }

        return dao.getAdminDetails(query).then((result) => {

            if (!result) {
                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                return dao.getAllCMSPages().then((cmsData) => {

                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, cmsData)

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }

}

/**
 * Create master data
 * @param {String} id mongo id of admin
 * @param {String} type type of master data
 * @param {Array} values values to be added in master
 */
function createMasterData(id, type, values) {

    if (!id || !type || !values) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let typeQuery = {
            type: type
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getMasterDetails(typeQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (results[1]) {

                return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.MasterAlreadyExists)
            } else {

                let obj = {
                    type: type,
                    values: values,
                    createdAt: new Date().getTime(),
                    createdBy: id
                }

                return dao.createMasterData(obj).then((masterDataCreated) => {
                    if (masterDataCreated) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.MasterDataAdded, masterDataCreated)

                    } else {

                        console.log("Failed to create master data record")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Add values to be added
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master record
 * @param {Array} values name to be added
 */
function addMasterValues(id, masterId, values) {

    if (!id || !masterId || !values) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let masterQuery = {
            _id: ObjectId(masterId)
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getMasterDetails(masterQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.MasterNotFound)
            } else {

                return dao.addValuesToMaster(masterQuery, values).then((valuesAdded) => {

                    if (valuesAdded) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ValuesAddedSuccess, valuesAdded)

                    } else {

                        console.log("Failed to add values")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all master data
 * @param {String} id mongo id of admin
 */
function getAllMasterData(id) {

    if (!id) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let masterQuery = {}
        // return dao.getAllMasterData(masterQuery).then((data) => {

        //     return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, data)

        // }).catch((err) => {

        //     console.log({ err })
        //     return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        // })
        let allUsersQuery = "skills"
        let allProjectTypesQuery = "packages.projectType"
        let allissueTypesQuery = "packages.issueType"
        let allexpertiseLevelQuery = "packages.expertiseLevel"

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getAllMasterData(masterQuery),
        dao.getAllUsedDistinctSkills(allUsersQuery), dao.getAllUsedDistinctProjectValues(allProjectTypesQuery),
        dao.getAllUsedDistinctProjectValues(allissueTypesQuery), dao.getAllUsedDistinctProjectValues(allexpertiseLevelQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.MasterNotFound)
            } else {

                let userSkillsInUse = results[2]
                let projectTypesInUse = results[3]
                let issueTypesInUse = results[4]
                let collaboratorLevelsInUse = results[5]

                let skillMasters = results[1].filter(obj => obj.type == constants.MASTER_TYPES.SKILLS)
                let projectTypeMasters = results[1].filter(obj => obj.type == constants.MASTER_TYPES.PROJECT_TYPES)
                let issueTypeMasters = results[1].filter(obj => obj.type == constants.MASTER_TYPES.ISSUE_TYPES)
                let collaboratorMasters = results[1].filter(obj => obj.type == constants.MASTER_TYPES.COLLABORATOR_LEVEL)

                // Add usage flag in SKILLS
                let skillValues = []
                skillMasters[0].values.map((obj) => {

                    let isExists = userSkillsInUse.find(objj => objj.toString() == obj._id.toString())
                    if (isExists) {
                        skillValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: true
                        })
                    } else {

                        skillValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: false
                        })
                    }
                })
                let updatedSkillMaster = {
                    status: skillMasters[0].status,
                    _id: skillMasters[0]._id,
                    type: skillMasters[0].type,
                    values: skillValues
                }

                // Add usage flag in PROJECT TYPES
                let projectTypesValues = []
                projectTypeMasters[0].values.map((obj) => {

                    let isExists = projectTypesInUse.find(objj => objj.toString() == obj._id.toString())
                    if (isExists) {
                        projectTypesValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: true
                        })
                    } else {

                        projectTypesValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: false
                        })
                    }
                })
                let updatedProjectTypeMaster = {
                    status: projectTypeMasters[0].status,
                    _id: projectTypeMasters[0]._id,
                    type: projectTypeMasters[0].type,
                    values: projectTypesValues
                }

                // Add usage flag in ISSUE TYPES
                let issueTypesValues = []
                issueTypeMasters[0].values.map((obj) => {

                    let isExists = issueTypesInUse.find(objj => objj.toString() == obj._id.toString())
                    if (isExists) {
                        issueTypesValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: true
                        })
                    } else {

                        issueTypesValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: false
                        })
                    }
                })
                let updatedIssueTypeMaster = {
                    status: issueTypeMasters[0].status,
                    _id: issueTypeMasters[0]._id,
                    type: issueTypeMasters[0].type,
                    values: issueTypesValues
                }

                // Add usage flag in COLLABORATOR LEVELS
                let collLevelValues = []
                collaboratorMasters[0].values.map((obj) => {

                    let isExists = collaboratorLevelsInUse.find(objj => objj.toString() == obj._id.toString())
                    if (isExists) {
                        collLevelValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: true
                        })
                    } else {

                        collLevelValues.push({
                            _id: obj._id,
                            name: obj.name,
                            isUsed: false
                        })
                    }
                })
                let updatedCollaboratorLevelMaster = {
                    status: collaboratorMasters[0].status,
                    _id: collaboratorMasters[0]._id,
                    type: collaboratorMasters[0].type,
                    values: collLevelValues
                }

                let finalResp = []
                finalResp.push(updatedSkillMaster)
                finalResp.push(updatedProjectTypeMaster)
                finalResp.push(updatedIssueTypeMaster)
                finalResp.push(updatedCollaboratorLevelMaster)

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, finalResp)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Update master data
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master data
 * @param {String} valueId mongo id of value
 * @param {String} name name to be updated
 */
function updateMasterData(id, masterId, valueId, name) {

    if (!id || !masterId || !valueId || !name) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let masterQuery = {
            _id: ObjectId(masterId)
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getMasterDetails(masterQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.MasterNotFound)
            } else {

                let updateQuery = {
                    _id: ObjectId(masterId),
                    "values._id": ObjectId(valueId)
                }
                let updateObj = {
                    "values.$.name": name
                }
                return dao.updateMasterData(updateQuery, updateObj).then((updated) => {

                    if (updated) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.MasterUpdateSuccess, updated)
                    } else {

                        console.log("Failed to update master data")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete master data
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master data
 * @param {String} valueId mongo id of value
 */
function deleteMasterData(id, masterId, valueId) {

    if (!id || !masterId || !valueId) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let masterQuery = {
            _id: masterId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getMasterDetails(masterQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.MasterNotFound)
            } else {

                let deleteObj = { 'values': { '_id': valueId } }

                return dao.deleteMasterData(masterQuery, deleteObj).then((deleted) => {

                    if (deleted) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.MasterDeletedSuccess, deleted)
                    } else {

                        console.log("Failed to delete master data")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all projects
 * @param {String} id mongo id of admin
 * @param {Object} queryParams params for pagination, sorting, searching 
 */
function getAllProjects(id, queryParams) {

    if (!id) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then(async (adminDetails) => {

            if (!adminDetails) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else {

                let projectQuery = {}

                if (queryParams.search) {

                    projectQuery['$or'] = [
                        { 'title': { '$regex': queryParams.search, '$options': 'i' } },
                    ]
                }

                if (queryParams.adminVerification) {
                    projectQuery.adminVerification = queryParams.adminVerification
                }

                let totalProjects = await dao.getProjectCounts(projectQuery)

                let sortQuery = {}
                if (queryParams.column) {

                    sortQuery[queryParams.column] = ((queryParams.dir == "asc") ? 1 : -1)
                } else {

                    sortQuery['createdAt'] = -1
                }

                let aggregateQuery = [
                    {
                        $match: projectQuery
                    },
                    {
                        $sort: sortQuery
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
                        $skip: parseInt(queryParams.skip) * parseInt(queryParams.limit)
                    },
                    {
                        $limit: parseInt(queryParams.limit)
                    },
                    {
                        $project: {
                            '_id': 1,
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
                            'initiatorDetails._id': 1,
                            'initiatorDetails.fullName': 1,
                            'totalTeamMembers': 1,
                            // 'totalTeamMembers._id': 1,
                            // 'totalTeamMembers.fullName': 1,
                            // 'totalTeamMembers.profilePicture': 1,
                            'packages': 1,
                            'projectStatus': 1,
                            'adminVerification': 1,
                            'createdAt': 1,
                            'editedAt': 1
                        }
                    }
                ]

                return dao.getAllProjects(aggregateQuery).then((projects) => {

                    let respObj = {
                        "recordsTotal": totalProjects,
                        "recordsFiltered": projects.length,
                        "records": projects
                    }

                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get project details
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 */
function getProjectDetails(id, projectId) {

    if (!id || !projectId) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, results[1])

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Update project verification
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} adminVerification verification status to be updated
 */
function updateProjectVerification(id, projectId, adminVerification) {

    if (!id || !projectId || !adminVerification) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        let projectQuery = {
            _id: projectId,
            // adminVerification: constants.VERIFICATION_STATUS.PENDING
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getProjectDetails(projectQuery)]).then(async (results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                let updateObj = {}
                let initiatorQuery = {
                    _id: results[1].initiator,
                    status: constants.STATUS.ACTIVE
                }
                let initiatorDetails = await dao.getUserDetails(initiatorQuery, {})

                if (adminVerification == constants.VERIFICATION_STATUS.ACCEPTED) {

                    // send accepted mail
                    updateObj.adminVerification = constants.VERIFICATION_STATUS.ACCEPTED
                    if (initiatorDetails) {

                        let thirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                        if (serviceDetails) {

                            let mailQuery = {
                                type: constants.TEMPLATE_TYPES.EMAIL,
                                mailName: constants.EMAIL_TEMPLATES.PROJECT_APPROVED_BY_ADMIN,
                                status: constants.STATUS.ACTIVE
                            }
                            let templateDetails = await dao.getTemplateDetails(mailQuery)
                            if (templateDetails) {

                                let mailObj = {
                                    fullName: initiatorDetails.fullName,
                                    emailId: initiatorDetails.emailId.toLowerCase(),
                                    title: results[1].title
                                }
                                let mailSent = mailHandler.SEND_MAIL(mailObj, templateDetails, serviceDetails)
                                // console.log({ mailSent })
                            }
                        }

                        // Create bell notification object for initiator
                        let notificationQuery = {
                            mailName: constants.EMAIL_TEMPLATES.NOTIFY_PROJECT_APPROVED_BY_ADMIN,
                            status: constants.STATUS.ACTIVE
                        }
                        let notificationTemplateDetails = await dao.getTemplateDetails(notificationQuery)
                        if (notificationTemplateDetails) {

                            let notificationMessage = notificationTemplateDetails.notificationMessage

                            let obj = {
                                fullName: initiatorDetails.fullName,
                                projectName: results[1].title
                            }
                            notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                            // let adminDetails = await dao.getAdminDetails()

                            let notificationObject = {
                                message: notificationMessage,
                                isRead: false,
                                receiverId: initiatorDetails._id,
                                createdAt: new Date().getTime(),
                                status: constants.STATUS.ACTIVE,
                                categoryType: constants.NOTIFICATION_CATEGORIES.PROJECT,
                                refId: projectId,
                            }
                            await dao.createNotification(notificationObject)
                            await socketHandler.emitUserNotification(initiatorDetails.socketId)
                        }
                    }
                } else {

                    // send rejected mail
                    updateObj.adminVerification = constants.VERIFICATION_STATUS.REJECTED
                    if (initiatorDetails) {

                        let thirdPartyServiceQuery = {
                            type: constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY,
                            status: constants.STATUS.ACTIVE
                        }

                        let serviceDetails = await dao.getServiceDetails(thirdPartyServiceQuery)
                        if (serviceDetails) {

                            let mailQuery = {
                                type: constants.TEMPLATE_TYPES.EMAIL,
                                mailName: constants.EMAIL_TEMPLATES.PROJECT_REJECTED_BY_ADMIN,
                                status: constants.STATUS.ACTIVE
                            }
                            let templateDetails = await dao.getTemplateDetails(mailQuery)
                            if (templateDetails) {

                                let mailObj = {
                                    fullName: initiatorDetails.fullName,
                                    emailId: initiatorDetails.emailId.toLowerCase(),
                                    title: results[1].title
                                }
                                let mailSent = mailHandler.SEND_MAIL(mailObj, templateDetails, serviceDetails)
                                // console.log({ mailSent })
                            }
                        }

                        // Create bell notification object for initiator
                        let notificationQuery = {
                            mailName: constants.EMAIL_TEMPLATES.NOTIFY_PROJECT_REJECTED_BY_ADMIN,
                            status: constants.STATUS.ACTIVE
                        }
                        let notificationTemplateDetails = await dao.getTemplateDetails(notificationQuery)
                        if (notificationTemplateDetails) {

                            let notificationMessage = notificationTemplateDetails.notificationMessage

                            let obj = {
                                fullName: initiatorDetails.fullName,
                                projectName: results[1].title
                            }
                            notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                            let notificationObject = {
                                message: notificationMessage,
                                isRead: false,
                                receiverId: initiatorDetails._id,
                                createdAt: new Date().getTime(),
                                status: constants.STATUS.ACTIVE,
                                categoryType: constants.NOTIFICATION_CATEGORIES.PROJECT,
                                refId: projectId
                            }
                            await dao.createNotification(notificationObject)
                            await socketHandler.emitUserNotification(initiatorDetails.socketId)
                        }
                    }
                }

                updateObj.editedAt = new Date().getTime()
                updateObj.editedBy = id

                return dao.updateProject(projectQuery, updateObj).then((updated) => {

                    if (updated) {

                        if (adminVerification == constants.VERIFICATION_STATUS.ACCEPTED) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProjectApproved, updated)
                        } else {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ProjectRejected, updated)
                        }
                    } else {

                        console.log("Failed to update project verification")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

async function addAdmin(details) {

    let adminObj = {
        "fullName": 'Admin',
        "password": 'admin@rebaked123',
        "contactNumber": details.contactNumber,
        "emailId": details.emailId,
        "createdAt": new Date().getTime(),
    }

    console.log("adminObj", adminObj)

    let convertedPass = await appUtils.convertPass(adminObj.password);
    adminObj.password = convertedPass

    return dao.createAdmin(adminObj).then((result) => {

        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success)

    }).catch((err) => {

        console.log({ err })
        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
    })
}

/**
 * get all support tickets with admin id
 * @param {String} id mongo id of admin
 * @param {String} queryParams id of referral admin
 */
async function getAllSupportTicket(id, queryParams) {

    if (!id || !ObjectId.isValid(id)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)

    } else {

        let query = {
            _id: id
        }

        let sortQuery = {}
        sortQuery['createdAt'] = -1

        let aggregateQuery = [

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
                $sort: sortQuery
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
                    "comments.senderId": 1,
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

        return Promise.all([dao.getAdminDetails(query), dao.getAllTicketDetails(aggregateQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else {

                result[1].map((data) => {
                    if (data.comments.length > 0) {
                        if (Object.keys(data.comments[0]).length == 0) {
                            data.comments.shift()
                        }
                    }
                })

                let finalResponseObj = {
                    "recordsTotal": allTicketsData.length,
                    "recordsFiltered": result[1].length,
                    "data": result[1]
                }

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, finalResponseObj)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }

}

/**
 * Add comment on support ticket
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of support ticket
 * @param {Object} details comment message to be sent
 */
function addComment(id, ticketId, details) {

    if (!id || !ObjectId.isValid(id) || !ticketId || !ObjectId.isValid(ticketId) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id,
        }

        let ticketQuery = {
            _id: ticketId,
        }
        return Promise.all([dao.getAdminDetails(query), dao.getTicketDetails(ticketQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TicketNotFound)
            } else {

                let commentObj = {
                    senderId: id,
                    msg: details.comments,
                    createdAt: new Date().getTime()
                }
                result[1].comments.push(commentObj)

                return dao.updateTicket(ticketQuery, result[1]).then((commented) => {

                    if (commented) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.CommentSuccess, commented)
                    } else {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)

                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })
            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Change ticket status
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of support ticket
 * @param {String} ticketStatus Status to be updated
 */
function changeTicketStatus(id, ticketId, ticketStatus) {

    if (!id || !ObjectId.isValid(id) || !ticketId || !ObjectId.isValid(ticketId) || !ticketStatus) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let ticketQuery = {
            _id: ticketId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getTicketDetails(ticketQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TicketNotFound)
            } else {

                let ticketDetails = result[1]
                ticketDetails.ticketStatus = ticketStatus
                ticketDetails.editedAt = new Date().getTime()
                ticketDetails.editedBy = id

                return dao.updateTicket(ticketQuery, ticketDetails).then((ticketUpdated) => {

                    if (ticketUpdated) {

                        // SEND MAIL OF STATUS UPDATING

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.ChangeStatusSuccess, ticketUpdated)

                    } else {

                        console.log("Failed to update  ticket status")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}

/**
 * Update ticket details  
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of ticket
 * @param {Object} details details to be updated
 */
function updateTicketDetails(id, ticketId, details) {

    if (!id || !ObjectId.isValid(id) || !ticketId || !ObjectId.isValid(ticketId) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let ticketQuery = {
            _id: ticketId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getTicketDetails(ticketQuery)]).then((result) => {

            if (!result[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!result[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.TicketNotFound)
            } else {

                // let ticketDetails = result[1]
                // ticketDetails.subject = details.subject
                // ticketDetails.details = details.details
                // ticketDetails.reason = details.reason
                if (details.ticketStatus) {
                    delete details.ticketStatus
                }
                if (details.projectId) {
                    delete details.projectId
                }
                if (details.createdBy) {
                    delete details.createdBy
                }
                if (details.comments) {
                    delete details.comments
                }
                details.editedAt = new Date().getTime()
                details.editedBy = id

                return dao.updateTicket(ticketQuery, details).then((ticketUpdated) => {

                    if (ticketUpdated) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.TicketUpdatedSuccess, ticketUpdated)

                    } else {

                        console.log("Failed to update  ticket status")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            }

        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })

    }
}


/**
 * Get all projects and user details
 * @param {String} id mongo id of admin
 */
function countForDashboard(id) {

    if (!id) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (!adminDetails) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else {

                let userQuery = {
                    status: constants.STATUS.ACTIVE
                }

                let projectQuery = {
                    projectStatus: constants.PROJECT_STATUS.OPEN
                    // projectStatus: constants.PROJECT_STATUS.INPROGRESS
                }
                return Promise.all([dao.countUsers(userQuery), dao.countProjects(projectQuery)]).then((result) => {

                    let details = {
                        totalUsers: result[0],
                        totalProjects: result[1],
                    }

                    return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, details)
                })
            }
        })
    }
}

/**
 * Add FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project 
 * @param {Object} details question and answer to be added as FAQ
 */
function addFAQ(id, projectId, details) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
                let FAQs = []
                if (projectDetails.FAQs || projectDetails.FAQs.length > 0) {

                    FAQs = projectDetails.FAQs
                }
                FAQs.push({
                    question: details.question,
                    answer: details.answer,
                    status: constants.STATUS.ACTIVE
                })

                let updateObj = {
                    FAQs: FAQs
                }

                return dao.updateProject(projectQuery, updateObj).then((addedFAQs) => {

                    if (addedFAQs) {

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.FAQAdded, addedFAQs['FAQs'])

                    } else {

                        console.log("Failed to add FAQ")
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }
                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all FAQs added in project
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
function getAllFAQs(id, projectId, queryParams) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
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

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Update FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} FAQId mongo id of FQA
 * @param {Object} details details to be updated
 */
function updateFAQ(id, projectId, FAQId, details) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !FAQId || !ObjectId.isValid(FAQId) || !details) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
                let FAQs = projectDetails['FAQs']

                let FAQObj = FAQs.find(obj => obj._id.toString() == FAQId.toString())

                if (FAQObj) {

                    let updateQuery = {
                        _id: ObjectId(projectId),
                        "FAQs._id": ObjectId(FAQId)
                    }
                    let updateObj = {}

                    if (details.question) {
                        updateObj["FAQs.$.question"] = details.question
                    }
                    if (details.answer) {
                        updateObj["FAQs.$.answer"] = details.answer
                    }

                    return dao.updateProject(updateQuery, updateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.FAQUpdated, updated['FAQs'])

                        } else {

                            console.log("Failed to update FAQ")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.FAQNotFound)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Delete FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} FAQId mongo id of FAQ to be deleted
 */
function deleteFAQ(id, projectId, FAQId) {

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !FAQId || !ObjectId.isValid(FAQId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let query = {
            _id: id
        }

        let projectQuery = {
            _id: projectId
        }

        return Promise.all([dao.getAdminDetails(query), dao.getProjectDetails(projectQuery)]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.ProjectNotFound)

            } else {

                let projectDetails = results[1]
                let FAQs = projectDetails['FAQs']

                let FAQObj = FAQs.find(obj => obj._id.toString() == FAQId.toString())

                if (FAQObj) {

                    let updateQuery = {
                        _id: ObjectId(projectId),
                        "FAQs._id": ObjectId(FAQId)
                    }
                    let updateObj = {
                        "FAQs.$.status": constants.STATUS.INACTIVE
                    }

                    return dao.updateProject(updateQuery, updateObj).then((updated) => {

                        if (updated) {

                            return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.FAQDeleted, updated['FAQs'])

                        } else {

                            console.log("Failed to update FAQ")
                            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                        }
                    }).catch((err) => {

                        console.log({ err })
                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    })
                } else {

                    return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.FAQNotFound)

                }
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}

/**
 * Get all user activities
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user
 * @param {Object} queryParams pagination 
 */
function getAllUserActivities(id, userId, queryParams) {

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId)) {

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }
        let userQuery = {
            _id: userId
        }

        return Promise.all([dao.getAdminDetails(adminQuery), dao.getUserDetails(userQuery, {})]).then((results) => {

            if (!results[0]) {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)

            } else if (!results[1]) {

                return mapper.responseMapping(admConst.CODE.ReqTimeOut, admConst.MESSAGE.UserNotFound)

            } else {

                let allActivities = results[1].loginActivity.filter(obj => obj.status == constants.STATUS.ACTIVE)
                let totalActivitesCount = allActivities.length

                let skip = 0
                let limit = 10
                if (queryParams.skip) {
                    skip = queryParams.skip
                }
                if (queryParams.limit) {
                    limit = queryParams.limit
                }

                allActivities = allActivities.slice(parseInt(skip) * parseInt(limit)).slice(0, parseInt(limit))

                let respObj = {
                    "recordsTotal": totalActivitesCount,
                    "recordsFiltered": allActivities.length,
                    "records": allActivities
                }

                return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)

            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then(async (adminDetails) => {

            if (adminDetails) {

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

                        return mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, respObj)
                    })

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
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

        return mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails)
    } else {

        let adminQuery = {
            _id: id
        }

        return dao.getAdminDetails(adminQuery).then((adminDetails) => {

            if (adminDetails) {

                let notificationQuery = {
                    _id: { $in: details.notificationIds }
                }
                let update = {
                    isRead: true
                }

                return dao.updateNotifications(notificationQuery, update).then((updated) => {

                    if (updated) {

                        return mapper.responseMapping(admConst.CODE.Success, admConst.MESSAGE.NotificationStatusUpdated)
                    } else {

                        return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                    }

                }).catch((err) => {

                    console.log({ err })
                    return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
                })

            } else {

                return mapper.responseMapping(admConst.CODE.DataNotFound, admConst.MESSAGE.InvalidCredentials)
            }
        }).catch((err) => {

            console.log({ err })
            return mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError)
        })
    }
}
module.exports = {

    login,

    verifySecurityCode,

    logout,

    getProfile,

    updateProfile,

    forgotPassword,

    setNewPassword,

    resetPassword,

    changeEmailRequest,

    updateEmail,

    changeContactRequest,

    updateContact,

    resendCode,

    setDefaultPassword,

    getDefaultPassword,

    getAllUsers,

    createUser,

    getUserDetails,

    updateUser,

    deleteUser,

    getUserCounts,

    getAllTemplateEntities,

    createTemplate,

    getAllTemplates,

    getTemplateDetails,

    updateTemplate,

    deleteTemplate,

    createService,

    getAllServices,

    getServiceDetails,

    updateService,

    deleteService,

    addProjectRoles,

    getProjectRoles,

    updateProjectRoles,

    deleteProjectRole,

    removeAllActivities,

    removeActivity,

    createCMS,

    getCMSDetails,

    updateCMSDetails,

    deleteCMSDetails,

    getAllCMS,

    createMasterData,

    addMasterValues,

    getAllMasterData,

    updateMasterData,

    deleteMasterData,

    getAllProjects,

    getProjectDetails,

    updateProjectVerification,

    addAdmin,

    getAllSupportTicket,

    addComment,

    changeTicketStatus,

    updateTicketDetails,

    countForDashboard,

    addFAQ,

    getAllFAQs,

    updateFAQ,

    deleteFAQ,

    getAllUserActivities,

    getAllNotifications,

    updateNotificationStatus

}
