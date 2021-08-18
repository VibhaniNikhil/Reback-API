/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const usrConst = require('./userConstants')
const jwtHandler = require('../../middleware/jwtHandler')
const ObjectId = require('mongoose').Types.ObjectId
const mapper = require('./userMapper')
const appUtils = require('../../appUtils')

/*#################################            Load modules end            ########################################### */

/**
 * Validating first step register request
 */
function checkFirstStepRegisterRequest(req, res, next) {
    let error = []
    let details = req.body
    if (!details || Object.keys(details).length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    } else {

        let { emailId, contactNumber } = details

        if (!emailId || !contactNumber) {

            error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })

        }
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating register request
 */
function checkSecondStepRegisterRequest(req, res, next) {

    let error = []
    let details = req.body

    if (!details || Object.keys(details).length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    } else {

        let { emailId, contactNumber, fullName, password, device, browser, ipaddress, country, state, date } = details

        if (!fullName || !password || !device || !browser || !ipaddress || !country || !state || !date || !emailId || !contactNumber) {

            error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })

        }
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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
        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating login request
 */
function checkLoginRequest(req, res, next) {

    let error = []
    let { emailId, password, contactNumber, device, browser, ipaddress, country, state, date } = req.body

    if ((!emailId && !contactNumber) || !password || !device || !browser || !ipaddress || !country || !state || !date) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        res.send(mapper.responseMapping(usrConst.CODE.FRBDN, usrConst.MESSAGE.TOKEN_NOT_PROVIDED))

        // return new exceptions.unauthorizeAccess(busConst.MESSAGE.TOKEN_NOT_PROVIDED)
    } else {

        return jwtHandler.verifyUsrToken(token).then((result) => {

            if (result && result._id == id) {
                req.tokenPayload = result;
                next()
            } else {

                res.send(mapper.responseMapping(usrConst.CODE.FRBDN, usrConst.MESSAGE.TOKEN_NOT_PROVIDED))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating project creating request
 */
function checkCreateProjectRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { title, description, category } = req.body

    if (!id || !ObjectId.isValid(id) || !title || !description || !category) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating project updating request
 */
function checkUpdateProjectRequest(req, res, next) {

    let error = []
    let { id, projectId } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !details || Object.keys(details).length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating package adding request
 */
function checkPackageAddingRequest(req, res, next) {

    let error = []
    let { id, projectId } = req.params
    let { name, projectType, issueType, minimumCost, expertiseLevel, startDate, endDate, description, acceptanceCriteria } = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !name || !projectType || !ObjectId.isValid(projectType) ||
        !issueType || !ObjectId.isValid(issueType) || !minimumCost || !expertiseLevel || !ObjectId.isValid(expertiseLevel) || !startDate || !endDate || !description || !acceptanceCriteria) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating package updating request
 */
function checkUpdatePackageRequest(req, res, next) {

    let error = []
    let { id, projectId, packageId } = req.params
    let details = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !packageId || !ObjectId.isValid(packageId) ||
        !details || Object.keys(details).length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating skills adding request
 */
function checkSkillAddingRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { skills } = req.body

    if (!id || !ObjectId.isValid(id) || !skills) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating education history adding request
 */
function checkEmploymentHistoryAddingRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { designation, company, startDate } = req.body

    if (!id || !ObjectId.isValid(id) || !designation || !company || !startDate) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}


/**
 * Validating education history adding request
 */
function checkEducationAddingRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { degree, college, startDate } = req.body

    if (!id || !ObjectId.isValid(id) || !degree || !college || !startDate) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating employment updating request
 */
function checkUpdateEmploymentDetailsRequest(req, res, next) {

    let error = []
    let { id, employmentId } = req.params
    let { _id, designation, company, startDate } = req.body

    if (!id || !ObjectId.isValid(id) || !employmentId || !ObjectId.isValid(employmentId) || !_id || !designation || !company || !startDate) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating education details updating request
 */
function checkUpdateEducationDetailsRequest(req, res, next) {

    let error = []
    let { id, educationId } = req.params
    let { _id, degree, college, startDate } = req.body

    if (!id || !ObjectId.isValid(id) || !educationId || !ObjectId.isValid(educationId) || !_id || !degree || !college || !startDate) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }
    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating portfolio project adding request
 */
function checkPortfolioAddingRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { projectUrl, projectTitle, tags } = req.body

    if (!id || !ObjectId.isValid(id) || !projectUrl || !projectTitle || !tags || tags.length == 0) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating invite friends request
 */
function checkInviteFriendsRequest(req, res, next) {

    let error = []
    let { id } = req.params
    let { emailId } = req.body

    if (!id || !ObjectId.isValid(id) || !emailId) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating ticket creating request
 */
 function checkSupportTicketRequest(req, res, next) {

    let error = []
    let { id, projectId } = req.params
    let { subject, details, reason } = req.body

    if (!id || !ObjectId.isValid(id) || !projectId || !ObjectId.isValid(projectId) || !subject || !details || !reason) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

/**
 * Validating comment request
 */
 function checkCommnetTicketRequest(req, res, next) {

    let error = []
    let { id, ticketId } = req.params
    let { comments } = req.body

    if (!id || !ObjectId.isValid(id) || !comments || !ticketId || !ObjectId.isValid(ticketId)) {

        error.push({ responseCode: TicketConst.CODE.BadRequest, responseMessage: TicketConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(TicketConst.CODE.BadRequest, TicketConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}

function checkContactUsRequest(req, res, next){

    let error = []
    let { emailId, name, message } = req.body

    if (!emailId  || !name  || !message) {

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
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

        error.push({ responseCode: usrConst.CODE.BadRequest, responseMessage: usrConst.MESSAGE.InvalidDetails })
    }

    if (error.length > 0) {

        res.json(mapper.responseMapping(usrConst.CODE.BadRequest, usrConst.MESSAGE.InvalidDetails))
    } else {

        next()
    }
}
module.exports = {

    checkToken,

    checkFirstStepRegisterRequest,

    checkSecondStepRegisterRequest,

    checkResendCodeRequest,

    checkSecurityCodeVerificationRequest,

    checkLoginRequest,

    checkUpdateProfileRequest,

    checkResetPasswordRequest,

    checkForgotPasswordRequest,

    checkSetNewPasswordRequest,

    checkChangeEmailRequest,

    checkUpdateEmailRequest,

    checkChangeContactRequest,

    checkUpdateContactRequest,

    checkCreateProjectRequest,

    checkUpdateProjectRequest,

    checkPackageAddingRequest,

    checkUpdatePackageRequest,

    checkSkillAddingRequest,

    checkEmploymentHistoryAddingRequest,

    checkEducationAddingRequest,

    checkUpdateEmploymentDetailsRequest,

    checkUpdateEducationDetailsRequest,

    checkPortfolioAddingRequest,

    checkInviteFriendsRequest,

    checkSupportTicketRequest,

    checkCommnetTicketRequest,

    checkContactUsRequest,

    checkNotificationStatusUpdateRequest
}