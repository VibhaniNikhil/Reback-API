/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */
const { ServiceContext } = require('twilio/lib/rest/chat/v1/service')
const service = require('./adminService')

/*#################################            Load modules end            ########################################### */

/**
 * Login
 * @param {Object} details admin login details
 */
function login(details) {

    return service.login(details).then(data => data)
}

/**
 * Verify security code
 * @param {String} id mongo id of admin
 * @param {String} code security code to be verified
 */
function verifySecurityCode(id, code) {

    return service.verifySecurityCode(id, code).then(data => data)
}

/**
 * Logout
 * @param {String} id mongo id of admin
 * @param {String} activityId mongo id of login activity to be inactivated
 */
function logout(id, activityId) {

    return service.logout(id, activityId).then(data => data)
}

/**
 * Get profile
 * @param {string} id mongo id of admin to fetch profile details
 */
function getProfile(id) {

    return service.getProfile(id).then(data => data)
}

/**
 * Update profile
 * @param {string} id mongo id of admin
 * @param {object} details admin profile updating details
 */
function updateProfile(id, details) {

    return service.updateProfile(id, details).then(data => data)
}

/**
 * Recover password by email
 * @param {string} emailId email id of admin for recover password
 */
function forgotPassword(emailId) {

    return service.forgotPassword(emailId).then(data => data)
}

/**
 * Set new password
 * @param {string} redisId redis id for recovering password
 * @param {string} password new password to set
 */
function setNewPassword(redisId, password) {

    return service.setNewPassword(redisId, password).then(data => data)
}

/**
 * Reset password
 * @param {string} id mongo id of admin
 * @param {string} oldPassword old password to verify
 * @param {string} newPassword new password to reset
 */
function resetPassword(id, oldPassword, newPassword) {

    return service.resetPassword(id, oldPassword, newPassword).then(data => data)
}

/**
 * Change email request
 * @param {String} id mongo id of admin
 * @param {String} emailId new email id to be set
 */
function changeEmailRequest(id, emailId) {

    return service.changeEmailRequest(id, emailId).then(data => data)
}

/**
 * Update email
 * @param {String} id mongo id of admin
 * @param {String} code security code for verification
 * @param {String} emailId new email id to be set
 */
function updateEmail(id, code, emailId) {

    return service.updateEmail(id, code, emailId).then(data => data)
}

/**
 * Change contact number request
 * @param {String} id mongo id of admin
 * @param {String} contactNumber new contact number to be set
 */
function changeContactRequest(id, contactNumber) {

    return service.changeContactRequest(id, contactNumber).then(data => data)
}

/**
 * Update contact number
 * @param {String} id mongo id of admin
 * @param {String} code security code for verification
 * @param {String} contactNumber new contact number to be set
 */
function updateContact(id, code, contactNumber) {

    return service.updateContact(id, code, contactNumber).then(data => data)
}

/**
 * Resend verification code
 * @param {String} id mongo id of admin
 * @param {Object} details email id or contact number on which verification code is to be sent
 */
function resendCode(id, details) {

    return service.resendCode(id, details).then(data => data)
}

/**
 * Set default password
 * @param {String} id mongo id of admin
 * @param {String} defaultPassword default password to be set for creating user
 */
function setDefaultPassword(id, defaultPassword) {

    return service.setDefaultPassword(id, defaultPassword).then(data => data)
}

/**
 * Get default password
 * @param {String} id mongo id of admin
 */
function getDefaultPassword(id) {

    return service.getDefaultPassword(id).then(data => data)
}

/**
 * Get all users
 * @param {String} id mongo id of admin
 * @param {Object} queryParams query params for sorting, paginations
 * @param {Object} filters filters on country, registered dates to be applied
 */
function getAllUsers(id, queryParams, filters) {

    return service.getAllUsers(id, queryParams, filters).then(data => data)
}

/**
 * Get user details
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user to fetch details
 */
function getUserDetails(id, userId) {

    return service.getUserDetails(id, userId).then(data => data)
}

/**
 * Create User
 * @param {String} id mongo id of admin
 * @param {Object} details details of user to be added
 */
function createUser(id, details) {

    return service.createUser(id, details).then(data => data)
}

/**
 * Update user
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id user to be updated
 * @param {Object} userDetails user details to be updated
 */
function updateUser(id, userId, userDetails) {

    return service.updateUser(id, userId, userDetails).then(data => data)
}

/**
 * Delete or Resurrect user
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user to be deleted or resurrected
 */
function deleteUser(id, userId) {

    return service.deleteUser(id, userId).then(data => data)
}

/**
 * Get user counts
 * @param {String} id mongo id of admin
 */
function getUserCounts(id) {

    return service.getUserCounts(id).then(data => data)
}

/**
 * Create template
 * @param {string} id mongo id of admin who is creating template
 * @param {object} templateDetails email template details to be added
 */
function createTemplate(id, templateDetails) {

    return service.createTemplate(id, templateDetails).then(data => data)
}

/**
 * Get all templates
 * @param {string} id mongo id of admin to fetch templates
 * @param {Object} queryParams query params for sorting, paginations
 */
function getAllTemplates(id, queryParams) {

    return service.getAllTemplates(id, queryParams).then(data => data)
}

/**
 * Get template details
 * @param {string} id mongo id of admin
 * @param {string} templateId mongo id of template to fetch details
 */
function getTemplateDetails(id, templateId) {

    return service.getTemplateDetails(id, templateId).then(data => data)
}

/**
 * Update template
 * @param {String} id mongo id of admin
 * @param {String} templateId mongo id of template to be updated
 * @param {object} templateDetails template updating details
 */
function updateTemplate(id, templateId, templateDetails) {

    return service.updateTemplate(id, templateId, templateDetails).then(data => data)
}

/**
 * Delete or Resurrect template
 * @param {String} id mongo id of admin
 * @param {String} templateId mongo id of template to deleted or resurrected
 */
function deleteTemplate(id, templateId) {

    return service.deleteTemplate(id, templateId).then(data => data)
}

/**
 * Get all template entities
 * @param {String} id mongo id of admin
 */
function getAllTemplateEntities(id) {

    return service.getAllTemplateEntities(id).then(data => data)
}

/**
 * Create third party service
 * @param {String} id mongo id of admin
 * @param {Object} details third party service credeintials to be set
 */
function createService(id, details) {

    return service.createService(id, details).then(data => data)
}

/**
 * Get all third party services
 * @param {String} id mongo id of admin
 */
function getAllServices(id) {

    return service.getAllServices(id).then(data => data)
}

/**
 * Get third party service details
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
*/
function getServiceDetails(id, serviceId) {

    return service.getServiceDetails(id, serviceId).then(data => data)
}

/**
 * Update third party service details
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
 * @param {Object} details details to be updated
 */
function updateService(id, serviceId, details) {

    return service.updateService(id, serviceId, details).then(data => data)
}

/**
 * Delete/ resurrect third party service
 * @param {String} id mongo id of admin
 * @param {String} serviceId mongo id of third party service
 */
function deleteService(id, serviceId) {

    return service.deleteService(id, serviceId).then(data => data)
}

/**
 * Add roles which will be available for project
 * @param {String} id mongo id of admin
 * @param {Array} projectRoles list of roles to be added in project
 */
function addProjectRoles(id, projectRoles) {

    return service.addProjectRoles(id, projectRoles).then(data => data)
}

/**
 * Get project roles
 * @param {String} id mongo id of admin
 */
function getProjectRoles(id) {

    return service.getProjectRoles(id).then(data => data)
}

/**
 * Update project role
 * @param {String} id mongo id of admin
 * @param {String} roleId mongo id of projet role
 * @param {String} name role name to be changed
 */
function updateProjectRoles(id, roleId, name) {

    return service.updateProjectRoles(id, roleId, name).then(data => data)
}

/**
 * Delete/ resurrect project role
 * @param {String} id mongo id of admin
 * @param {String} roleId mongo id of project role 
 */
function deleteProjectRole(id, roleId) {

    return service.deleteProjectRole(id, roleId).then(data => data)
}

/**
 * Remove all login activities of user
 * @param {String} id mongo id of admin
 */
function removeAllActivities(id, userId) {

    return service.removeAllActivities(id, userId).then(data => data)
}

/**
 * Remove system activity
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user whose activity is to be removed
 * @param {String} activityId mongo id of system activity to be removed
 */
function removeActivity(id, userId, activityId) {

    return service.removeActivity(id, userId, activityId).then(data => data)
}

/**
 * Create CMS page
 * @param {String} id mongo id of admin
 * @param {Object} details CMS page details
 */
function createCMS(id, details) {

    return service.createCMS(id, details).then(data => data)
}

/**
 * Get CMS page details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS page
 */
function getCMSDetails(id, cmsId) {

    return service.getCMSDetails(id, cmsId).then(data => data)
}

/**
 * Update CMS page details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS page
 * @param {Object} details details to be updated
 */
function updateCMSDetails(id, cmsId, details) {

    return service.updateCMSDetails(id, cmsId, details).then((data => data))
}

/**
 * Delete/Resurrect CMS page details
 * @param {String} id mongo id of admin
 * @param {String} cmsId mongo id of CMS page
 */
function deleteCMSDetails(id, cmsId) {

    return service.deleteCMSDetails(id, cmsId).then((data => data))
}

/**
 * Get all CMS Pages
 * @param {String} id mongo id of admin
 */
function getAllCMS(id) {

    return service.getAllCMS(id).then(data => data)
}

/**
 * Create master data
 * @param {String} id mongo id of admin
 * @param {String} type type of master data
 * @param {Array} values values to be added in master
 */
function createMasterData(id, type, values) {

    return service.createMasterData(id, type, values).then(data => data)
}

/**
 * Add values to be added
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master record
 * @param {Array} values names to be added
 */
function addMasterValues(id, masterId, values) {

    return service.addMasterValues(id, masterId, values).then(data => data)
}

/**
 * Get all master data
 * @param {String} id mongo id of admin
 */
function getAllMasterData(id) {

    return service.getAllMasterData(id).then(data => data)
}

/**
 * Update master data
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master data
 * @param {String} valueId mongo id of value
 * @param {String} name name to be updated
 */
function updateMasterData(id, masterId, valueId, name) {

    return service.updateMasterData(id, masterId, valueId, name).then(data => data)
}

/**
 * Delete master data
 * @param {String} id mongo id of admin
 * @param {String} masterId mongo id of master data
 * @param {String} valueId mongo id of value
 */
function deleteMasterData(id, masterId, valueId) {

    return service.deleteMasterData(id, masterId, valueId).then(data => data)
}

/**
 * Get all projects
 * @param {String} id mongo id of admin
 * @param {Object} queryParams params for pagination, sorting, searching 
 */
function getAllProjects(id, queryParams) {

    return service.getAllProjects(id, queryParams).then(data => data)
}

/**
 * Get project details
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 */
function getProjectDetails(id, projectId) {

    return service.getProjectDetails(id, projectId).then(data => data)
}

/**
 * Update project verification
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} adminVerification verification status to be updated
 */
function updateProjectVerification(id, projectId, adminVerification) {

    return service.updateProjectVerification(id, projectId, adminVerification).then(data => data)
}

/**
 * add admin
 * @param {Object} details details to be add
 */
function addAdmin(details) {

    return service.addAdmin(details).then(data => data)
}

/**
 * get dashboard count 
 * @param {String} id mongo id of admin
 */
function countForDashboard(id) {

    return service.countForDashboard(id).then(data => data)
}
/*
 * get all support ticket details
 * @param {Object} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllSupportTicket(id, queryParams) {

    return service.getAllSupportTicket(id, queryParams).then(data => data)
}

/**
 * Add comment on support ticket
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of support ticket
 * @param {Object} details comment message to be sent
 */
function addComment(id, ticketId, details) {

    return service.addComment(id, ticketId, details).then(data => data)
}

/**
 * Change ticket status
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of support ticket
 * @param {String} ticketStatus Status to be updated
 */
function changeTicketStatus(id, ticketId, ticketStatus) {

    return service.changeTicketStatus(id, ticketId, ticketStatus).then(data => data)
}

/**
 * Update ticket details  
 * @param {String} id mongo id of admin
 * @param {String} ticketId mongo id of ticket
 * @param {Object} details details to be updated
 */
function updateTicketDetails(id, ticketId, details) {

    return service.updateTicketDetails(id, ticketId, details).then(data => data)
}

/**
 * Add FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project 
 * @param {Object} details question and answer to be added as FAQ
 */
function addFAQ(id, projectId, details) {

    return service.addFAQ(id, projectId, details).then(data => data)
}

/**
 * Get all FAQs added in project
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
function getAllFAQs(id, projectId, queryParams) {

    return service.getAllFAQs(id, projectId, queryParams).then(data => data)
}

/**
 * Update FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} FAQId mongo id of FQA
 * @param {Object} details details to be updated
 */
function updateFAQ(id, projectId, FAQId, details) {

    return service.updateFAQ(id, projectId, FAQId, details).then(data => data)
}

/**
 * Delete FAQ
 * @param {String} id mongo id of admin
 * @param {String} projectId mongo id of project
 * @param {String} FAQId mongo id of FAQ to be deleted
 */
function deleteFAQ(id, projectId, FAQId) {

    return service.deleteFAQ(id, projectId, FAQId).then(data => data)
}

/**
 * Get all user activities
 * @param {String} id mongo id of admin
 * @param {String} userId mongo id of user
 * @param {Object} queryParams pagination 
 */
function getAllUserActivities(id, userId, queryParams) {

    return service.getAllUserActivities(id, userId, queryParams).then(data => data)
}

/**
 * Get admin notifications
 * @param {String} id mongo id of admin
 * @param {Object} queryParams pagination params
 */
function getAllNotifications(id, queryParams) {

    return service.getAllNotifications(id, queryParams).then(data => data)
}

/**
 * Update notification status
 * @param {String} id mongo id of admin
 * @param {Object} details notification records id whose status to be updated
 */
function updateNotificationStatus(id, details) {

    return service.updateNotificationStatus(id, details).then(data => data)
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

    getUserDetails,

    createUser,

    updateUser,

    deleteUser,

    createTemplate,

    getAllTemplates,

    getTemplateDetails,

    updateTemplate,

    deleteTemplate,

    getAllTemplateEntities,

    createService,

    getAllServices,

    getServiceDetails,

    updateService,

    deleteService,

    addProjectRoles,

    getProjectRoles,

    updateProjectRoles,

    deleteProjectRole,

    getUserCounts,

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

    countForDashboard,

    getAllSupportTicket,

    addComment,

    changeTicketStatus,

    updateTicketDetails,

    addFAQ,

    getAllFAQs,

    updateFAQ,

    deleteFAQ,

    getAllUserActivities,

    getAllNotifications,

    updateNotificationStatus
}


