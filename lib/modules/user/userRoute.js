/**
 * @author Kavya Patel
 */
/*#################################            Load modules start            ########################################### */

const router = require("express").Router();
const facade = require('./userFacade');
const validators = require('./userValidators');
const usrConst = require('./userConstants');
const mapper = require('./userMapper');

/*#################################            Load modules end            ########################################### */

// PROFILE APIs

router.route('/firstStepRegister').post([validators.checkFirstStepRegisterRequest], (req, res) => {
    let details = req.body
    facade.firstStepRegister(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/secondStepRegister').post([validators.checkSecondStepRegisterRequest], (req, res) => {

    let details = req.body
    let queryParams = req.query

    facade.secondStepRegister(details, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/verifySecurityCode/:id').post([validators.checkSecurityCodeVerificationRequest], (req, res) => {

    let { id } = req.params
    let { code } = req.body

    facade.verifySecurityCode(id, code).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/resendCode/:id').post([validators.checkResendCodeRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.resendCode(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/login').post([validators.checkLoginRequest], (req, res) => {

    let details = req.body

    facade.login(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getProfile/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getProfile(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateProfile/:id').put([validators.checkToken, validators.checkUpdateProfileRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.updateProfile(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/forgotPassword').post([validators.checkForgotPasswordRequest], (req, res) => {

    let { emailId } = req.body

    facade.forgotPassword(emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/setNewPassword/:redisId').post([validators.checkSetNewPasswordRequest], (req, res) => {

    let { redisId } = req.params
    let { password } = req.body

    facade.setNewPassword(redisId, password).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/resetPassword/:id').post([validators.checkToken, validators.checkResetPasswordRequest], (req, res) => {

    let { id } = req.params
    let { oldPassword, newPassword } = req.body

    facade.resetPassword(id, oldPassword, newPassword).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/logout/:id/:activityId').get([validators.checkToken], (req, res) => {

    let { id, activityId } = req.params

    facade.logout(id, activityId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllActivities/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllActivities(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/removeActivity/:id/:activityId').delete([validators.checkToken], (req, res) => {

    let { id, activityId } = req.params

    facade.removeActivity(id, activityId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/removeAllActivities/:id').delete([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.removeAllActivities(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/changeEmailRequest/:id').post([validators.checkToken, validators.checkChangeEmailRequest], (req, res) => {

    let { id } = req.params
    let { emailId } = req.body

    facade.changeEmailRequest(id, emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateEmail/:id').post([validators.checkToken, validators.checkUpdateEmailRequest], (req, res) => {

    let { id } = req.params
    let { code, emailId } = req.body

    facade.updateEmail(id, code, emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/changeContactRequest/:id').post([validators.checkToken, validators.checkChangeContactRequest], (req, res) => {

    let { id } = req.params
    let { contactNumber } = req.body

    facade.changeContactRequest(id, contactNumber).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateContact/:id').post([validators.checkToken, validators.checkUpdateContactRequest], (req, res) => {

    let { id } = req.params
    let { code, contactNumber } = req.body

    facade.updateContact(id, code, contactNumber).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// CMS PAGE API

router.route('/getCMSDetails/:CMSName').get((req, res) => {

    let { CMSName } = req.params

    facade.getCMSDetails(CMSName).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// MASTER API

router.route('/getMasterDetails').get((req, res) => {

    let { id } = req.query
    facade.getMasterDetails(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROJECT APIs

router.route('/createProject/:id').post([validators.checkToken, validators.checkCreateProjectRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.createProject(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getMyInitiatedProjects/:id').post([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query
    let filters = req.body

    facade.getMyInitiatedProjects(id, queryParams, filters).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateProject/:id/:projectId').put([validators.checkToken, validators.checkUpdateProjectRequest], (req, res) => {

    let { id, projectId } = req.params
    let details = req.body

    facade.updateProject(id, projectId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getProjectDetails/:projectId').get((req, res) => {

    let { projectId } = req.params
    let { id } = req.query
    facade.getProjectDetails(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllUsers/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getAllUsers(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addPackage/:id/:projectId').post([validators.checkToken, validators.checkPackageAddingRequest], (req, res) => {

    let { id, projectId } = req.params
    let details = req.body

    facade.addPackage(id, projectId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updatePackage/:id/:projectId/:packageId').put([validators.checkToken, validators.checkUpdatePackageRequest], (req, res) => {

    let { id, projectId, packageId } = req.params
    let details = req.body

    facade.updatePackage(id, projectId, packageId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPackages/:projectId').get((req, res) => {

    let { projectId } = req.params
    let id = req.query.id
    facade.getAllPackages(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROFILE: EMPLOYMENT HISTORY APIs

router.route('/getEmploymentDetails/:id/:employmentId').get([validators.checkToken], (req, res) => {

    let { id, employmentId } = req.params

    facade.getEmploymentDetails(id, employmentId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addEmploymentHistory/:id').post([validators.checkToken, validators.checkEmploymentHistoryAddingRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.addEmploymentHistory(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateEmploymentDetails/:id/:employmentId').put([validators.checkToken, validators.checkUpdateEmploymentDetailsRequest], (req, res) => {

    let { id, employmentId } = req.params
    let details = req.body

    facade.updateEmploymentDetails(id, employmentId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteEmploymentHistory/:id/:employmentId').delete([validators.checkToken], (req, res) => {

    let { id, employmentId } = req.params

    facade.deleteEmploymentHistory(id, employmentId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROFILE: EDUCATION APIs

router.route('/getEducationDetails/:id/:educationId').get([validators.checkToken], (req, res) => {

    let { id, educationId } = req.params
    facade.getEducationDetails(id, educationId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addEducation/:id').post([validators.checkToken, validators.checkEducationAddingRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.addEducation(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateEducationDetails/:id/:educationId').put([validators.checkToken, validators.checkUpdateEducationDetailsRequest], (req, res) => {

    let { id, educationId } = req.params
    let details = req.body

    facade.updateEducation(id, educationId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteEducation/:id/:educationId').delete([validators.checkToken], (req, res) => {

    let { id, educationId } = req.params

    facade.deleteEducation(id, educationId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROFILE: SKILLS APIs

router.route('/addSkills/:id').post([validators.checkToken, validators.checkSkillAddingRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.addSkills(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getSkills/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getSkills(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
// EXPLORE PROJECT APIs

router.route('/exploreProjects').post((req, res) => {

    let { id } = req.query
    let queryParams = req.query
    let filters = req.body
    facade.exploreProjects(id, queryParams, filters).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROFILE: PORTFOLIO APIs

router.route('/removePortfolioProject/:id/:projectId').delete([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params

    facade.removePortfolioProject(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getPortfolioProjectDetails/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params
    facade.getPortfolioProjectDetails(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addPortfolio/:id').post([validators.checkToken, validators.checkPortfolioAddingRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.addPortfolio(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})


// PROFILE MGT APIs

router.route('/removeSkills/:id/:skillId').delete([validators.checkToken], (req, res) => {

    let { id, skillId } = req.params

    facade.removeSkills(id, skillId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// REFERRAL INVITE APIs
router.route('/inviteFriends/:id').post([validators.checkToken, validators.checkInviteFriendsRequest], (req, res) => {

    let { id } = req.params
    let { emailId } = req.body

    facade.inviteFriends(id, emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// JOIN PROJECT APIs

router.route('/joinPackage/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params

    facade.joinPackage(id, projectId, packageId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllProjectRequestReceived/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllProjectRequestReceived(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPackageRequestReceived/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params
    let queryParams = req.query

    facade.getAllPackageRequestReceived(id, projectId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getUserRequestReceived/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params
    let queryParams = req.query

    facade.getUserRequestReceived(id, projectId, packageId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PACKAGE DETAIL API

router.route('/getPackageDetails/:id/:projectId/:packageId').get((req, res) => {

    let { id, projectId, packageId } = req.params
    
    facade.getPackageDetails(id, projectId, packageId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// GET MIN-MAX PROJECT COST API

router.route('/getExploreBudgetRange').get((req, res) => {

    let { id } = req.query
    facade.getExploreBudgetRange(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getMyProjectsBudgetRange/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getMyProjectsBudgetRange(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// GET MY PROJECT NAME LIST API

router.route('/getMyProjectList/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getMyProjectList(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// REQUEST SENT BY COLLABORATOR

router.route('/getAllProjectRequestSent/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllProjectRequestSent(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllPackageRequestSent/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params
    let queryParams = req.query

    facade.getAllPackageRequestSent(id, projectId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// ACCEPT - REJECT COLLABORATOR REQUEST

router.route('/updateJoinRequest/:id/:projectId/:packageId/:userId/:verificationStatus').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId, userId, verificationStatus } = req.params

    facade.updateJoinRequest(id, projectId, packageId, userId, verificationStatus).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// SUPPORT TICKET APIs

router.route('/createSupportTicket/:id/:projectId').post([validators.checkToken, validators.checkSupportTicketRequest], (req, res) => {

    let { id, projectId } = req.params
    let details = req.body

    facade.createSupportTicket(id, projectId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllSupportTicket/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllSupportTicket(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/addComment/:id/:ticketId').post([validators.checkToken, validators.checkCommnetTicketRequest], (req, res) => {

    let { id, ticketId } = req.params
    let details = req.body

    facade.addComment(id, ticketId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// FAQ APIs

router.route('/getAllFAQs/:projectId').get((req, res) => {

    let { projectId } = req.params
    let queryParams = req.query
    let { id } = req.query
    facade.getAllFAQs(id, projectId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/contactUs').post([validators.checkContactUsRequest], (req, res) => {

    let details = req.body

    facade.contactUs(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// PROJECT WORK PROCESS APIs

router.route('/startWork/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params

    facade.startWork(id, projectId, packageId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/submitWork/:id/:projectId/:packageId/:workId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId, workId } = req.params

    facade.submitWork(id, projectId, packageId, workId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/getWorkProgressList/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params
    let queryParams = req.query

    facade.getWorkProgressList(id, projectId, packageId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateSubmissionStatus/:id/:projectId/:packageId/:workId/:status').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId, workId, status } = req.params

    facade.updateSubmissionStatus(id, projectId, packageId, workId, status).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/finishPackage/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params

    facade.finishPackage(id, projectId, packageId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/finishProject/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params

    facade.finishProject(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// NOTIFICATION APIs

router.route('/getAllNotifications/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllNotifications(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

router.route('/updateNotificationStatus/:id').put([validators.checkToken, validators.checkNotificationStatusUpdateRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.updateNotificationStatus(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})

// CHAT APIs

router.route('/getChatList/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getChatList(id, queryParams).then((result) => {

        res.send(result)

    }).catch(err => {

        console.log(err)
        res.send(mapper.responseMapping(usrConst.CODE.badrequest, usrConst.MESSAGE.internalServerError))
    })
})

// router.route('/getChatHistory/:id/:roomId').get([validators.checkToken], (req, res) => {

//     let { id, roomId } = req.params

//     facade.getChatHistory(id, roomId).then((result) => {

//         res.send(result)

//     }).catch(err => {
//         console.log(err)
//         res.send(mapper.responseMapping(usrConst.CODE.badrequest, usrConst.MESSAGE.internalServerError))
//     })
// })

// WITHDRAW PACKAGE COLLABORATING

router.route('/withdrawPackage/:id/:projectId/:packageId').get([validators.checkToken], (req, res) => {

    let { id, projectId, packageId } = req.params

    facade.withdrawPackage(id, projectId, packageId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(usrConst.CODE.INTRNLSRVR, usrConst.MESSAGE.internalServerError))
    })
})
module.exports = router

