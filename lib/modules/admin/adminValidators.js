/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const admConst = require('./adminConstants')
var ObjectId = require('mongoose').Types.ObjectId;
const jwtHandler = require('../../middleware/jwtHandler');
const mapper = require('./adminMapper');
const appUtils = require('../../appUtils');
const constants = require('../../constants');

/*#################################            Load modules end            ########################################### */

/**
 * Validating login request
 */
function checkLoginRequest(req, res, next) {

    let error = []
    let { emailId, contactNumber, password, device, browser, ipaddress, date, country, state } = req.body

    if ((!emailId && !contactNumber) || !password || !device || !browser || !ipaddress || !country || !state || !date) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating security code verification request
 */
function checkSecurityCodeVerificationRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { code } = req.body

    if (!id || !ObjectId.isValid(id) || !code) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {
        next()
    }
}

/**
 * Validate JWT token
 */
function checkToken(req, res, next) {

    let token = req.headers['authorization']
    let { id } = req.params

    if (!token || !id || (!ObjectId.isValid(id))) {

        res.send(mapper.responseMapping(admConst.CODE.FRBDN, admConst.MESSAGE.TOKEN_NOT_PROVIDED))

        // return new exceptions.unauthorizeAccess(busConst.MESSAGE.TOKEN_NOT_PROVIDED)
    } else {

        return jwtHandler.verifyAdminToken(token).then((result) => {

            if (result && result._id == id) {
                req.tokenPayload = result;
                next()
            } else {

                res.send(mapper.responseMapping(admConst.CODE.FRBDN, admConst.MESSAGE.TOKEN_NOT_PROVIDED))
            }
        })
    }
}

/**
 * Validating update profile request
 */
function checkUpdateProfileRequest(req, res, next) {

    let error = []
    let details = req.body

    if (!details || Object.keys(details).length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating forgot password request
 */
function checkForgotPasswordRequest(req, res, next) {

    let error = []
    let { emailId } = req.body

    if (!emailId || (!appUtils.isValidEmail(emailId))) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }

}

/**
 * Validating set new password by recovery link
 */
function checkSetNewPasswordRequest(req, res, next) {

    let error = []
    let { redisId } = req.params
    let { password } = req.body

    if (!redisId || !password) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating reset password request
 */
function checkResetPasswordRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { oldPassword, newPassword } = req.body

    if (!id || !ObjectId.isValid(id) || !oldPassword || !newPassword) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating email address change request
 */
function checkChangeEmailRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { emailId } = req.body

    if (!id || !ObjectId.isValid(id) || !emailId || !appUtils.isValidEmail(emailId)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating email updating request
 */
function checkUpdateEmailRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { code, emailId } = req.body

    if (!id || !ObjectId.isValid(id) || !code || !emailId || !appUtils.isValidEmail(emailId)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating contact number change request
 */
function checkChangeContactRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { contactNumber } = req.body

    if (!id || !ObjectId.isValid(id) || !contactNumber) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating contact number updating request
 */
function checkUpdateContactRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { code, contactNumber } = req.body

    if (!id || !ObjectId.isValid(id) || !code || !contactNumber) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating resend verification code request
 */
function checkResendCodeRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { emailId, contactNumber } = req.body

    if (!id || !ObjectId.isValid(id) || (!emailId && !contactNumber)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating setting default password request
 */
function checkSettingDefaultPassword(req, res, next) {

    let error = []
    let { id } = req.params
    let { defaultPassword } = req.body

    if (!id || !ObjectId.isValid(id) || !defaultPassword) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating user creating request
 */
function checkCreateUserRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !details || (Object.keys(details).length == 0)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    } else {

        let { emailId, contactNumber, fullName } = details

        if (!emailId || !contactNumber || !fullName) {

            error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

        }
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating user updating request
 */
function checkUpdateUserRequest(req, res, next) {

    let error = []
    let { id, userId } = req.params
    let userDetails = req.body

    if (!id || !ObjectId.isValid(id) || !userId || !ObjectId.isValid(userId) || !userDetails || (Object.keys(userDetails).length == 0)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
* Validating email template creating request
*/
function checkCreateTemplateRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { type, mailName } = req.body

    if (!id || !ObjectId.isValid(id) || !type || !mailName) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

    } else {

        if (type == constants.TEMPLATE_TYPES.EMAIL) {
            let { mailTitle, mailBody, mailSubject, } = req.body

            if (!mailTitle || !mailBody || !mailSubject) {

                error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
            }
        } else {

            let { notificationMessage } = req.body
            if (!notificationMessage || Object.keys(notificationMessage).length == 0) {

                error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
            }
        }
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }

}

/**
* Validating template updating request
*/
function checkUpdateTemplateRequest(req, res, next) {

    let error = []
    let { id, templateId } = req.params
    let templateDetails = req.body

    if (!id || !ObjectId.isValid(id) || !templateId || !ObjectId.isValid(templateId) || !templateDetails || Object.keys(templateDetails).length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}


/**
 * Validating third party service creating request
 */
function checkCreateServiceRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let details = req.body
    let { type } = details

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0 || !type) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    } else {

        if (type == constants.THIRD_PARTY_SERVICES.MAIL_GATEWAY) {

            let { emailId, password } = details

            if (!emailId || !password) {

                error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
            }
        } else if (type == constants.THIRD_PARTY_SERVICES.SMS_GATEWAY) {

            let { twilioAccountSID, twilioAuthToken, twilioContactNumber } = details

            if (!twilioAccountSID || !twilioAuthToken || !twilioContactNumber) {

                error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
            }
        } else if (type == constants.THIRD_PARTY_SERVICES.PAYMENT_GATEWAY) {

            let { paymentClientSecret } = details

            if (!paymentClientSecret) {

                error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
            }
        } else {

            error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

        }
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating third party service updating request
 */
function checkUpdateServiceRequest(req, res, next) {

    let error = []
    let { id, serviceId } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !serviceId || !ObjectId.isValid(serviceId) || !details || Object.keys(details).length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating add project roles request
 */
function checkAddProjectRolesRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { projectRoles } = req.body

    if (!id || !ObjectId.isValid(id) || !projectRoles || projectRoles.length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating update project roles updating request
 */
function checkUpdateProjectRequest(req, res, next) {

    let error = []
    let { id, roleId } = req.params
    let { name } = req.body

    if (!id || !ObjectId.isValid(id) || !roleId || !ObjectId.isValid(roleId) || !name) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}
/*
* Validating CMS page creating request
*/
function checkCreateCMSRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { CMSName, CMSPageDetails } = req.body

    if (!id || !ObjectId.isValid(id) || !CMSName || !CMSPageDetails) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

    }
    if (error.length > 0) {
        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))

    }
    else {
        next()
    }

}

/**
* Validating CMS page updating request
*/
function checkUpdateCMSRequest(req, res, next) {

    let error = []
    let { id, cmsId } = req.params
    let { CMSPageDetails } = req.body

    if (!id || !ObjectId.isValid(id) || !cmsId || !ObjectId.isValid(cmsId) || !CMSPageDetails) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

    }
    if (error.length > 0) {
        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))

    }
    else {
        next()
    }
}

/**
 * Validating master data adding request
 */
function checkCreateMasterRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { type, values } = req.body

    if (!id || !ObjectId.isValid(id) || !type || !values || values.length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

    }
    if (error.length > 0) {
        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))

    }
    else {
        next()
    }

}

/**
 * Validating adding values to master record request
 */
function checkAddMasterValuesRequest(req, res, next) {

    let error = []
    let { id, masterId } = req.params
    let { values } = req.body

    if (!id || !ObjectId.isValid(id) || !masterId || !ObjectId.isValid(masterId) || !values) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })

    }
    if (error.length > 0) {
        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))

    }
    else {
        next()
    }
}

/**
 * Validating master data updating request
 */
function checkUpdateMasterRequest(req, res, next) {

    let error = []
    let { id, valueId, masterId } = req.params
    let { name } = req.body

    if (!id || !ObjectId.isValid(id) || !valueId || !ObjectId.isValid(valueId) || !masterId || !ObjectId.isValid(masterId) || !name) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating project verification status
 */
function checkUpdateProjectVerificationRequest(req, res, next) {

    let error = []
    let { id, projectId } = req.params
    let { adminVerification } = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !adminVerification) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating comment request
 */
function checkCommentTicketRequest(req, res, next) {

    let error = []
    let { id, ticketId } = req.params
    let { comments } = req.body

    if (!id || !ObjectId.isValid(id) || !comments || !ticketId || !ObjectId.isValid(ticketId)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating status change request
 */
function checkChangeStatusTicketRequest(req, res, next) {

    let error = []
    let { id, ticketId, ticketStatus } = req.params

    if (!id || !ObjectId.isValid(id) || !ticketStatus || !ticketId || !ObjectId.isValid(ticketId)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating update ticket request
 */
function checkUpdateTicketRequest(req, res, next) {

    let error = []
    let { id, ticketId } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !ticketId || !ObjectId.isValid(ticketId) || !details) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating FAQ adding request
 */
function checkFAQAddingRequest(req, res, next) {

    let error = []
    let { id, projectId } = req.params
    let { question, answer } = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !question || !answer) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating FAQ updating request
 */
function checkFAQUpdatingRequest(req, res, next) {

    let error = []
    let { id, projectId, FAQId } = req.params
    let { question, answer } = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || (!question && !answer)) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating notification update status
 */
 function checkNotificationStatusUpdateRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !details || Object.keys(details).length == 0) {

        error.push({ responseCode: admConst.CODE.BadRequest, responseMessage: admConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(admConst.CODE.BadRequest, admConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}
module.exports = {

    checkLoginRequest,

    checkSecurityCodeVerificationRequest,

    checkToken,

    checkUpdateProfileRequest,

    checkForgotPasswordRequest,

    checkSetNewPasswordRequest,

    checkResetPasswordRequest,

    checkChangeEmailRequest,

    checkUpdateEmailRequest,

    checkChangeContactRequest,

    checkUpdateContactRequest,

    checkResendCodeRequest,

    checkSettingDefaultPassword,

    checkCreateUserRequest,

    checkUpdateUserRequest,

    checkCreateTemplateRequest,

    checkUpdateTemplateRequest,

    checkCreateServiceRequest,

    checkUpdateServiceRequest,

    checkAddProjectRolesRequest,

    checkUpdateProjectRequest,

    checkCreateCMSRequest,

    checkUpdateCMSRequest,

    checkCreateMasterRequest,

    checkAddMasterValuesRequest,

    checkUpdateMasterRequest,

    checkUpdateProjectVerificationRequest,

    checkCommentTicketRequest,

    checkChangeStatusTicketRequest,

    checkUpdateTicketRequest,

    checkFAQAddingRequest,

    checkFAQUpdatingRequest,

    checkNotificationStatusUpdateRequest
}
