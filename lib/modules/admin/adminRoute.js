/**
 * @author Kavya Patel
 */
/*#################################            Load modules start            ########################################### */

const router = require("express").Router();
const facade = require('./adminFacade')
const mapper = require('./adminMapper')
const admConst = require('./adminConstants')
const validators = require('./adminValidators')

/*#################################            Load modules end            ########################################### */

// ADMIN PROFILE APIs

router.route('/login').post([validators.checkLoginRequest], (req, res) => {

    let details = req.body
    facade.login(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/verifySecurityCode/:id').post([validators.checkSecurityCodeVerificationRequest], (req, res) => {

    let { id } = req.params
    let { code } = req.body

    facade.verifySecurityCode(id, code).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/logout/:id/:activityId').get([validators.checkToken], (req, res) => {

    let { id, activityId } = req.params

    facade.logout(id, activityId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getProfile/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getProfile(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateProfile/:id').put([validators.checkToken, validators.checkUpdateProfileRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.updateProfile(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/forgotPassword').post([validators.checkForgotPasswordRequest], (req, res) => {

    let { emailId } = req.body

    facade.forgotPassword(emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/setNewPassword/:redisId').post([validators.checkSetNewPasswordRequest], (req, res) => {

    let { redisId } = req.params
    let { password } = req.body

    facade.setNewPassword(redisId, password).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/resetPassword/:id').post([validators.checkToken, validators.checkResetPasswordRequest], (req, res) => {

    let { id } = req.params
    let { oldPassword, newPassword } = req.body

    facade.resetPassword(id, oldPassword, newPassword).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/changeEmailRequest/:id').post([validators.checkToken, validators.checkChangeEmailRequest], (req, res) => {

    let { id } = req.params
    let { emailId } = req.body

    facade.changeEmailRequest(id, emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateEmail/:id').post([validators.checkToken, validators.checkUpdateEmailRequest], (req, res) => {

    let { id } = req.params
    let { code, emailId } = req.body

    facade.updateEmail(id, code, emailId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/changeContactRequest/:id').post([validators.checkToken, validators.checkChangeContactRequest], (req, res) => {

    let { id } = req.params
    let { contactNumber } = req.body

    facade.changeContactRequest(id, contactNumber).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateContact/:id').post([validators.checkToken, validators.checkUpdateContactRequest], (req, res) => {

    let { id } = req.params
    let { code, contactNumber } = req.body

    facade.updateContact(id, code, contactNumber).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/resendCode/:id').post([validators.checkResendCodeRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.resendCode(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// GENERAL SETTING APIs

router.route('/setDefaultPassword/:id').post([validators.checkToken, validators.checkSettingDefaultPassword], (req, res) => {

    let { id } = req.params
    let { defaultPassword } = req.body

    facade.setDefaultPassword(id, defaultPassword).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getDefaultPassword/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getDefaultPassword(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/addProjectRoles/:id').post([validators.checkToken, validators.checkAddProjectRolesRequest], (req, res) => {

    let { id } = req.params
    let { projectRoles } = req.body

    facade.addProjectRoles(id, projectRoles).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getProjectRoles/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getProjectRoles(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateProjectRole/:id/:roleId').put([validators.checkToken, validators.checkUpdateProjectRequest], (req, res) => {

    let { id, roleId } = req.params
    let { name } = req.body

    facade.updateProjectRoles(id, roleId, name).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteProjectRole/:id/:roleId').delete([validators.checkToken], (req, res) => {

    let { id, roleId } = req.params

    facade.deleteProjectRole(id, roleId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// MANAGE USERS APIs

router.route('/getAllUsers/:id').post([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query
    let filters = req.body

    facade.getAllUsers(id, queryParams, filters).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/createUser/:id').post([validators.checkToken, validators.checkCreateUserRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.createUser(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getUserDetails/:id/:userId').get([validators.checkToken], (req, res) => {

    let { id, userId } = req.params

    facade.getUserDetails(id, userId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateUser/:id/:userId').put([validators.checkToken, validators.checkUpdateUserRequest], (req, res) => {

    let { id, userId } = req.params
    let userDetails = req.body

    facade.updateUser(id, userId, userDetails).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteUser/:id/:userId').delete([validators.checkToken], (req, res) => {

    let { id, userId } = req.params

    facade.deleteUser(id, userId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getUserCounts/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getUserCounts(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// EMAIL TEMPLATE APIs

router.route('/getAllTemplateEntities/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getAllTemplateEntities(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/createTemplate/:id').post([validators.checkToken, validators.checkCreateTemplateRequest], (req, res) => {

    let { id } = req.params
    let templateDetails = req.body

    facade.createTemplate(id, templateDetails).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllTemplates/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllTemplates(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getTemplateDetails/:id/:templateId').get([validators.checkToken], (req, res) => {

    let { id, templateId } = req.params

    facade.getTemplateDetails(id, templateId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateTemplate/:id/:templateId').put([validators.checkToken, validators.checkUpdateTemplateRequest], (req, res) => {

    let { id, templateId } = req.params
    let templateDetails = req.body

    facade.updateTemplate(id, templateId, templateDetails).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteTemplate/:id/:templateId').delete([validators.checkToken], (req, res) => {

    let { id, templateId } = req.params
    facade.deleteTemplate(id, templateId).then((result) => {

        res.send(result)
    }).catch((err) => {
        r
        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// THIRD PARTY SERVICES APIs

router.route('/createService/:id').post([validators.checkToken, validators.checkCreateServiceRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.createService(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {
        r

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllServices/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getAllServices(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getServiceDetails/:id/:serviceId').get([validators.checkToken], (req, res) => {

    let { id, serviceId } = req.params

    facade.getServiceDetails(id, serviceId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateService/:id/:serviceId').put([validators.checkToken, validators.checkUpdateServiceRequest], (req, res) => {

    let { id, serviceId } = req.params
    let details = req.body

    facade.updateService(id, serviceId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteService/:id/:serviceId').delete([validators.checkToken], (req, res) => {

    let { id, serviceId } = req.params

    facade.deleteService(id, serviceId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// USER ACTIVITY MANAGEMENT APIs

router.route('/removeAllActivities/:id/:userId').delete([validators.checkToken], (req, res) => {

    let { id, userId } = req.params;

    facade.removeAllActivities(id, userId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/removeActivity/:id/:userId/:activityId').delete([validators.checkToken], (req, res) => {

    let { id, userId, activityId } = req.params

    facade.removeActivity(id, userId, activityId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// CMS PAGES APIs

router.route('/createCMS/:id').post([validators.checkToken, validators.checkCreateCMSRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.createCMS(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getCMSDetails/:id/:cmsId').get([validators.checkToken], (req, res) => {

    let { id, cmsId } = req.params
    facade.getCMSDetails(id, cmsId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateCMSDetails/:id/:cmsId').put([validators.checkToken, validators.checkUpdateCMSRequest], (req, res) => {

    let { id, cmsId } = req.params
    let details = req.body

    facade.updateCMSDetails(id, cmsId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })

})

router.route('/deleteCMS/:id/:cmsId').delete([validators.checkToken], (req, res) => {

    let { id, cmsId } = req.params
    facade.deleteCMSDetails(id, cmsId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })

})

router.route('/getAllCMS/:id/').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    facade.getAllCMS(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// MASTER MANAGEMENT APIs

router.route('/createMasterData/:id').post([validators.checkToken, validators.checkCreateMasterRequest], (req, res) => {

    let { id } = req.params
    let { type, values } = req.body

    facade.createMasterData(id, type, values).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/addMasterValues/:id/:masterId').post([validators.checkToken, validators.checkAddMasterValuesRequest], (req, res) => {

    let { id, masterId } = req.params
    let { values } = req.body

    facade.addMasterValues(id, masterId, values).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllMasterData/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params

    facade.getAllMasterData(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateMasterData/:id/:masterId/:valueId').put([validators.checkToken, validators.checkUpdateMasterRequest], (req, res) => {

    let { id, masterId, valueId } = req.params
    let { name } = req.body

    facade.updateMasterData(id, masterId, valueId, name).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteMasterData/:id/:masterId/:valueId').delete([validators.checkToken], (req, res) => {

    let { id, masterId, valueId } = req.params

    facade.deleteMasterData(id, masterId, valueId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// PROJECT MANAGEMENT APIs

router.route('/getAllProjects/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query
    // let filters = req.body

    facade.getAllProjects(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getProjectDetails/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params

    facade.getProjectDetails(id, projectId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateProjectVerification/:id/:projectId').put([validators.checkToken, validators.checkUpdateProjectVerificationRequest], (req, res) => {

    let { id, projectId } = req.params
    let { adminVerification } = req.body

    facade.updateProjectVerification(id, projectId, adminVerification).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/addAdmin').post((req, res) => {

    let details = req.body

    facade.addAdmin(details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// SUPPORT TICKET MGT APIs

router.route('/getAllSupportTicket/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    let queryParams = req.query

    facade.getAllSupportTicket(id, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/countForDashboard/:id').get([validators.checkToken], (req, res) => {

    let { id } = req.params
    
    facade.countForDashboard(id).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/addComment/:id/:ticketId').post([validators.checkToken, validators.checkCommentTicketRequest], (req, res) => {

    let { id, ticketId } = req.params
    let details = req.body

    facade.addComment(id, ticketId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/changeTicketStatus/:id/:ticketId/:ticketStatus').get([validators.checkToken, validators.checkChangeStatusTicketRequest], (req, res) => {

    let { id, ticketId, ticketStatus } = req.params

    facade.changeTicketStatus(id, ticketId, ticketStatus).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateTicketDetails/:id/:ticketId').put([validators.checkToken, validators.checkUpdateTicketRequest], (req, res) => {

    let { id, ticketId } = req.params
    let details = req.body

    facade.updateTicketDetails(id, ticketId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// FAQ APIs

router.route('/addFAQ/:id/:projectId').post([validators.checkToken, validators.checkFAQAddingRequest], (req, res) => {

    let { id, projectId } = req.params
    let details = req.body

    facade.addFAQ(id, projectId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getAllFAQs/:id/:projectId').get([validators.checkToken], (req, res) => {

    let { id, projectId } = req.params
    let queryParams = req.query

    facade.getAllFAQs(id, projectId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateFAQ/:id/:projectId/:FAQId').put([validators.checkToken, validators.checkFAQUpdatingRequest], (req, res) => {

    let { id, projectId, FAQId } = req.params
    let details = req.body

    facade.updateFAQ(id, projectId, FAQId, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/deleteFAQ/:id/:projectId/:FAQId').delete([validators.checkToken], (req, res) => {

    let { id, projectId, FAQId } = req.params

    facade.deleteFAQ(id, projectId, FAQId).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

// USER ACTIVITIES APIs

router.route('/getAllUserActivities/:id/:userId').get([validators.checkToken], (req, res) => {

    let { id, userId } = req.params
    let queryParams = req.query

    facade.getAllUserActivities(id, userId, queryParams).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
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
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/updateNotificationStatus/:id').put([validators.checkToken, validators.checkNotificationStatusUpdateRequest], (req, res) => {

    let { id } = req.params
    let details = req.body

    facade.updateNotificationStatus(id, details).then((result) => {

        res.send(result)
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

module.exports = router
