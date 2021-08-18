/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */
const service = require('./userService')

/*#################################            Load modules end            ########################################### */

/**
 * First step of registration process to check duplications of email id and contact number
 * @param {Object} details email id and contact number to check duplications
 */
function firstStepRegister(details) {

    return service.firstStepRegister(details).then(data => data)
}

/**
 * Register user with all the details
 * @param {Object} details user details to get registered
 * @param {String} queryParams id of referral user
 */
function secondStepRegister(details, queryParams) {

    return service.secondStepRegister(details, queryParams).then(data => data)
}

/**
 * Verify security code
 * @param {String} id mongo id of user
 * @param {String} code security code to be verified
 */
function verifySecurityCode(id, code) {

    return service.verifySecurityCode(id, code).then(data => data)
}

/**
 * Resend verification code
 * @param {String} id mongo id of user
 * @param {Object} details email id or contact number on which verification code is to be sent
 */
function resendCode(id, details) {

    return service.resendCode(id, details).then(data => data)
}

/**
 * Login
 * @param {Object} details user details
 */
function login(details) {

    return service.login(details).then(data => data)
}

/**
 * Get user profile
 * @param {String} id mongo id of user
 */
function getProfile(id) {

    return service.getProfile(id).then(data => data)
}

/**
 * Update profile
 * @param {String} id mongo id of user
 * @param {Object} details details to be updated
 */
function updateProfile(id, details) {

    return service.updateProfile(id, details).then(data => data)
}

/**
 * Forgot password
 * @param {String} emailId email id of user to send password recovery link
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
 * @param {String} id mongo id of user to reset password
 * @param {String} oldPassword old password for authentication
 * @param {String} newPassword new password to be set
 */
function resetPassword(id, oldPassword, newPassword) {

    return service.resetPassword(id, oldPassword, newPassword).then(data => data)
}

/**
 * Logout
 * @param {String} id mongo id of user
 * @param {String} activityId mongo id of login activity to be inactivated
 */
function logout(id, activityId) {

    return service.logout(id, activityId).then(data => data)
}

/**
 * Get all system login activities
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination fields to fetch records
 */
function getAllActivities(id, queryParams) {

    return service.getAllActivities(id, queryParams).then(data => data)
}

/**
 * Remove or disable system activity
 * @param {String} id mongo id of user
 * @param {String} activityId mongo id of system activity to be inactivated
 */
function removeActivity(id, activityId) {

    return service.removeActivity(id, activityId).then(data => data)
}

/**
 * Remove or disable all system activities
 * @param {String} id mongo id of user
 */
function removeAllActivities(id) {

    return service.removeAllActivities(id).then(data => data)
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
 * Get CMS page details
 * @param {String} CMSName CMS page name to be fetched
 */
function getCMSDetails(CMSName) {

    return service.getCMSDetails(CMSName).then(data => data)
}

/**
 * Get master details list
 * @param {String} id mongo id of user
 */
function getMasterDetails(id) {

    return service.getMasterDetails(id).then(data => data)
}

/**
 * Create project
 * @param {String} id mongo id of user
 * @param {Object} details project details to be added
 */
function createProject(id, details) {

    return service.createProject(id, details).then(data => data)
}

/**
 * Get project initiated by user
 * @param {String} id mongo id of user
 * @param {Object} queryParams sorting, searching and paginations to be applied
 * @param {Object} filters filters to be applied
 */
function getMyInitiatedProjects(id, queryParams, filters) {

    return service.getMyInitiatedProjects(id, queryParams, filters).then(data => data)
}

/**
 * Update project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details details to be updated
 */
function updateProject(id, projectId, details) {

    return service.updateProject(id, projectId, details).then(data => data)
}

/**
 * Get project details
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 */
function getProjectDetails(id, projectId) {

    return service.getProjectDetails(id, projectId).then(data => data)
}

/**
 * Get all other active users to add as member/collaborator in project
 * @param {String} id mongo id of user
 */
function getAllUsers(id) {

    return service.getAllUsers(id).then(data => data)
}

/**
 * Add package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details package details to be added in project
 */
function addPackage(id, projectId, details) {

    return service.addPackage(id, projectId, details).then(data => data)
}

/**
 * Update package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {Object} details details to be updated
 */
function updatePackage(id, projectId, packageId, details) {

    return service.updatePackage(id, projectId, packageId, details).then(data => data)
}

/**
 * Get list of all packages under projects
 * @param {String} id mongo id of user
 * @param {String} projectId mongo if of project
 */
function getAllPackages(id, projectId) {

    return service.getAllPackages(id, projectId).then(data => data)
}

/**
 * Remove or disable skills
 * @param {String} id mongo id of user
 * @param {String} skillId mongo id of skills
 */
function removeSkills(id, skillId) {

    return service.removeSkills(id, skillId).then(data => data)
}

/**
 * Remove portfolio project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of portfolio project
 */
function removePortfolioProject(id, projectId) {

    return service.removePortfolioProject(id, projectId).then(data => data)
}

/**
 * get portfolio project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of portfolio project
 */
function getPortfolioProjectDetails(id, projectId) {

    return service.getPortfolioProjectDetails(id, projectId).then(data => data)
}

/**
 * get employment History
 * @param {String} id mongo id of user
 * @param {String} employmentId mongo id of  employment history
 */
function getEmploymentDetails(id, employmentId) {

    return service.getEmploymentDetails(id, employmentId).then(data => data)
}

/**
 * get education details
 * @param {String} id mongo id of user
 * @param {String} educationId mongo id of education
 */
function getEducationDetails(id, educationId) {

    return service.getEducationDetails(id, educationId).then(data => data)
}

/**
 * Add Skills
 * @param {String} id mongo id of user
 * @param {Object} details skills details to be added in skills
 */
function addSkills(id, details) {

    return service.addSkills(id, details).then(data => data)
}

/**
 * Get user's skils
 * @param {String} id mongo id of user
 */
function getSkills(id) {

    return service.getSkills(id).then(data => data)
}

/**
 * Add employment history
 * @param {String} id mongo id of user
 * @param {Object} details employment details to be added in employment history
 */
function addEmploymentHistory(id, details) {

    return service.addEmploymentHistory(id, details).then(data => data)
}

/**
 * Add eduction
 * @param {String} id mongo id of user
 * @param {Object} details eduction details to be added in eduction
 */
function addEducation(id, details) {

    return service.addEducation(id, details).then(data => data)
}

/**
 * Delete education
 * @param {String} id mongo id of user
 * @param {String} educationId mongo id of education history
 */
function deleteEducation(id, educationId) {

    return service.deleteEducation(id, educationId).then(data => data)
}

/**
 * Add portfolio
 * @param {String} id mongo id of user
 * @param {Object} details portfolio details to be added in portfolio
 */
function addPortfolio(id, details) {

    return service.addPortfolio(id, details).then(data => data)
}

/**
 * Update eduction
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of educationId
 * @param {Object} details details to be updated
 */
function updateEducation(id, educationId, details) {

    return service.updateEducation(id, educationId, details).then(data => data)
}

/**
 * Update employment history
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of employmentId
 * @param {Object} details details to be updated
 */
function updateEmploymentDetails(id, employmentId, details) {

    return service.updateEmploymentDetails(id, employmentId, details).then(data => data)
}

/**
 * Delete employment history
 * @param {String} id mongo id of user
 * @param {String} employmentId mongo id of employment history
 */
function deleteEmploymentHistory(id, employmentId) {

    return service.deleteEmploymentHistory(id, employmentId).then(data => data)
}

/**
 * Explore projects
 * @param {String} id mongo id of user
 * @param {Object} queryParams query params for exploring projects
 * @param {Object} filters filters for exploring projects
 */
function exploreProjects(id, queryParams, filters) {

    return service.exploreProjects(id, queryParams, filters).then(data => data)
}

/**
 * Invite friends
 * @param {String} id mongo id of user
 * @param {String} emailId email id of receiver
 */
function inviteFriends(id, emailId) {

    return service.inviteFriends(id, emailId).then(data => data)
}

/**
 * Join package
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function joinPackage(id, projectId, packageId) {

    return service.joinPackage(id, projectId, packageId).then(data => data)
}

/**
 * Get all project joining request received
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllProjectRequestReceived(id, queryParams) {

    return service.getAllProjectRequestReceived(id, queryParams).then(data => data)
}

/**
 * Get package details
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function getPackageDetails(id, projectId, packageId) {

    return service.getPackageDetails(id, projectId, packageId).then(data => data)
}

/**
 * Get minimum and maximum project cost range for exploring projects
 * @param {String} id mongo id of user
 */
function getExploreBudgetRange(id) {

    return service.getExploreBudgetRange(id).then(data => data)
}

/**
 * Get minimum and maximum project cost range for user initiated/collaborated projects
 * @param {String} id mongo id of user
 */
function getMyProjectsBudgetRange(id) {

    return service.getMyProjectsBudgetRange(id).then(data => data)
}

/**
 * Get my project list
 * @param {String} id mongo id of user
 */
function getMyProjectList(id) {

    return service.getMyProjectList(id).then(data => data)
}

/**
 * Get all requests received for packages under project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
function getAllPackageRequestReceived(id, projectId, queryParams) {

    return service.getAllPackageRequestReceived(id, projectId, queryParams).then(data => data)
}

/**
 * Get user requests received
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {Object} queryParams pagination parameters
 */
function getUserRequestReceived(id, projectId, packageId, queryParams) {

    return service.getUserRequestReceived(id, projectId, packageId, queryParams).then(data => data)
}

/**
 * Get all requests sent to join a project
 * @param {String} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllProjectRequestSent(id, queryParams) {

    return service.getAllProjectRequestSent(id, queryParams).then(data => data)
}

/**
 * Get all requests sent for project
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} queryParams pagination parameters
 */
function getAllPackageRequestSent(id, projectId, queryParams) {

    return service.getAllPackageRequestSent(id, projectId, queryParams).then(data => data)
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

    return service.updateJoinRequest(id, projectId, packageId, userId, verificationStatus).then(data => data)
}

/**
 * Create support ticket
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {Object} details support ticket details to be added
 */
function createSupportTicket(id, projectId, details) {

    return service.createSupportTicket(id, projectId, details).then(data => data)
}

/**
 * get all support ticket details
 * @param {Object} id mongo id of user
 * @param {Object} queryParams pagination parameters
 */
function getAllSupportTicket(id, queryParams) {

    return service.getAllSupportTicket(id, queryParams).then(data => data)
}

/**
 * comment ticket
 * @param {String} id mongo id of user
 * @param {String} ticketId mongo id of ticket
 */
function addComment(id, ticketId, details) {

    return service.addComment(id, ticketId, details).then(data => data)
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
 * contactUs
 * @param {Object} details contact us details 

 */
function contactUs(details) {

    return service.contactUs(details).then(data => data)
}

/**
 * Start work
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function startWork(id, projectId, packageId) {

    return service.startWork(id, projectId, packageId).then(data => data)
}

/**
 * Submit work
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 * @param {String} workId mongo id of work progress
 */
function submitWork(id, projectId, packageId, workId) {

    return service.submitWork(id, projectId, packageId, workId).then(data => data)
}

/**
 * Get work progress status of all collaborators
 * @param {String} id mongo id of user/initiator
 * @param {String} projectId mongo id of project 
 * @param {String} packageId mongo id of package
 * @param {Object} queryParams pagination parameters
 */
function getWorkProgressList(id, projectId, packageId, queryParams) {

    return service.getWorkProgressList(id, projectId, packageId, queryParams).then(data => data)
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

    return service.updateSubmissionStatus(id, projectId, packageId, workId, status).then(data => data)
}

/**
 * Finish package work
 * @param {String} id mongo id of initiator
 * @param {String} projectId mongo id of project 
 * @param {String} packageId mongo id of package 
 */
function finishPackage(id, projectId, packageId) {

    return service.finishPackage(id, projectId, packageId).then(data => data)
}

/**
 * Finish project
 * @param {String} id mongo id of initiator
 * @param {String} projectId mongo id of project 
 */
function finishProject(id, projectId) {

    return service.finishProject(id, projectId).then(data => data)
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

/**
 * Get chat list
 * @param {String} id mongo id of user
 * @param {Object} queryParams searching, pagination parameters
 */
function getChatList(id, queryParams) {

    return service.getChatList(id, queryParams).then(data => data)
}

// /**
//  * Get chat history
//  * @param {String} id mongo id of user
//  * @param {String} roomId mongo id of chat room
//  */
// function getChatHistory(id, roomId) {

//     return service.getChatHistory(id, roomId).then(data => data)
// }

/**
 * Withdraw package collaborating
 * @param {String} id mongo id of user
 * @param {String} projectId mongo id of project
 * @param {String} packageId mongo id of package
 */
function withdrawPackage(id, projectId, packageId) {

    return service.withdrawPackage(id, projectId, packageId).then(data => data)
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

    removeSkills,

    removePortfolioProject,

    getPortfolioProjectDetails,

    getEmploymentDetails,

    getEducationDetails,

    addSkills,

    getSkills,

    addEmploymentHistory,

    deleteEmploymentHistory,

    addEducation,

    deleteEducation,

    addPortfolio,

    updateEducation,

    updateEmploymentDetails,

    exploreProjects,

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
