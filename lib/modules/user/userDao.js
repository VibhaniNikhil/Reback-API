/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const mongoose = require('mongoose')
let BaseDao = require('../../dao/BaseDao')
const constants = require('../../constants')
const User = require('../../generic/models/userModel')
const usrDao = new BaseDao(User)
const Admin = require('../../generic/models/adminModel')
const adminDao = new BaseDao(Admin)
const Template = require('../../generic/models/templateModel')
const templateDao = new BaseDao(Template)
const Ticket = require('../../generic/models/supportTicketModel')
const ticketDao = new BaseDao(Ticket)
const ThirdPartyService = require('../../generic/models/thirdPartyServiceModel')
const thirdPartyDao = new BaseDao(ThirdPartyService)
const CMS = require('../../generic/models/cmsModel')
const cmsDao = new BaseDao(CMS)
const Master = require('../../generic/models/masterModel')
const masterDao = new BaseDao(Master)
const Project = require('../../generic/models/projectModel')
const projectDao = new BaseDao(Project)
const Notification = require('../../generic/models/notificationModel')
const notificationDao = new BaseDao(Notification)
const Chat = require('../../generic/models/chatModel')
const chatDao = new BaseDao(Chat)

/*#################################            Load modules end            ########################################### */

/**
 * Get user details
 * @param {Object} query query to find user details
 */
function getUserDetails(query) {

    return usrDao.findOne(query)
}

/**
 * Create user
 * @param {Object} obj user details to be registered
 */
function createUser(obj) {

    let userObj = new User(obj)
    return usrDao.save(userObj)
}

/**
 * Get template details
 * @param {Object} query query elements to find template
 */
function getTemplateDetails(query) {

    return templateDao.findOne(query)
}

/**
 * Update user profile
 * @param {Object} query mongo query to find user to update
 * @param {Object} updateDetails details to be updated
 */
function updateProfile(query, updateDetails) {

    let update = {}
    update['$set'] = updateDetails

    let options = {
        new: true
    }
    return usrDao.findOneAndUpdate(query, update, options)
}

/**
 * Get admin details
 */
function getAdminDetails() {

    return adminDao.findOne()
}

/**
 * Get all system activities
 * @param {Object} query mongo query to find user record
 * @param {Number} skip activity records to be skipped
 * @param {Number} limit no. of activity records to be fetchd
 */
function getAllActivities(query, skip, limit) {

    return usrDao.find(query, { 'loginActivity': { $slice: [parseInt(skip), parseInt(limit)] } })
}

/**
 * Update multiple fields in profile
 * @param {Object} query mongo query to get user
 * @param {Object} updateObj fields to be updated
 */
function updateProfileMultipleFields(query, updateObj) {

    let update = {}
    update['$set'] = updateObj
    let options = {
        new: true,
        multi: true
    }
    return usrDao.findOneAndUpdate(query, update, options)
}

/**
 * Get third party service details
 * @param {Object} query mongo query to find third party service details
 */
function getServiceDetails(query) {

    return thirdPartyDao.findOne(query)
}

/**
 * Get CMS page details
 * @param {Object} query query to fing CMS page
 */
function getCMSDetails(query) {

    return cmsDao.findOne(query)
}

/**
 * Get master details
 * @param {Object} query query to find master details by type
 */
function getMasterDetails(query) {

    return masterDao.findOne(query)
}

/**
 * Create project
 * @param {Object} projectDetails project details to be added
 */
function createProject(projectDetails) {

    let projectObj = new Project(projectDetails)
    return projectDao.save(projectObj)
}

/**
 * Get count of projects
 * @param {Object} query query to get counts
 */
function getProjectCounts(query) {

    return projectDao.count(query)
}

/**
 * Get all projects
 * @param {Array} aggregateQuery aggregation query fields
 */
function getAllProjects(aggregateQuery) {

    return projectDao.aggregate(aggregateQuery)
}

/**
 * Get project details
 * @param {Object} query mongo query to fetch project record
 */
function getProjectDetails(query) {

    return projectDao.findOne(query)
}

/**
 * Update project
 * @param {Object} query mongo query to fetch project record
 * @param {Object} updateObj details to be updated
 */
function updateProject(query, updateObj) {

    let update = {}
    update['$set'] = updateObj
    let options = {
        new: true
    }
    return projectDao.findOneAndUpdate(query, update, options)
}

/**
 * Get list of active users 
 * @param {Object} query mongo query to find users
 */
function getAllUsers(query, projectionQuery) {

    return usrDao.find(query, projectionQuery)
}

/**
 * Add package
 * @param {Object} projectQuery mongo query to find project
 * @param {Object} details package details to be added
 */
function addPackage(projectQuery, details) {

    let update = {}
    update['$addToSet'] = { packages: details }
    let options = {
        new: true
    }
    return projectDao.findOneAndUpdate(projectQuery, update, options)

}

function findSkillsDetails(query) {

    return usrDao.findOne(query)
}

/**
 * Delete skills
 * @param {Object} query mongo query to find user to update
 * @param {Object} updateDetails details to be updated
 */
function deleteSkills(query, skillId) {

    let update = {}
    update['$pull'] = { "skills": skillId }

    let options = {
        new: true
    }

    return usrDao.findOneAndUpdate(query, update, options)
}

function findPortfolioProjectDetails(query) {

    return usrDao.findOne(query)
}

/**
 * Update user profile
 * @param {Object} query mongo query to find user to update
 * @param {Object} updateDetails details to be updated
 */
function deleteProject(query, updateDetails) {

    let update = {}
    update['$pull'] = updateDetails

    let options = {
        new: true
    }

    return usrDao.findOneAndUpdate(query, update, options)
}

function getPortfolioProjectDetails(query) {


    return usrDao.findOne(query, "portfolio")
}

/**
 * Update user profile
 * @param {Object} query mongo query to find user to update
 * @param {Object} updateDetails details to be updated
 */
function updateProfile(query, updateDetails) {

    let update = {}
    update['$set'] = updateDetails

    let options = {
        new: true
    }

    return usrDao.findOneAndUpdate(query, update, options)
}


function getSkills(query) {

    return usrDao.aggregate(query)

}

/**
 * Get employment history details
 * @param {Object} query mongo query to fetch employment history record
 */
function getEmploymentHistoryDetails(query) {

    return usrDao.findOne(query)
}

/**
 * Adding package joining request
 * @param {Object} details package joining request details
 */
function addRequest(details) {

    let reqObj = new PackageRequest(details)
    return packageReqDao.save(reqObj)
}

/**
 * Get all package requests received
 * @param {Object} query query to get all pending equests
 */
function getAllPackageRequests(query) {

    return packageReqDao.aggregate(query)
}

/**
 * Get project joining request
 * @param {Object} query query to find project joining request
 */
function getProjectJoinDetails(query) {

    return packageReqDao.findOne(query)
}

/**
 * Update project request
 * @param {Object} query query to find project request
 * @param {Object} updateObj details to be updated
 */
function updateRequest(query, updateObj) {

    let update = {}
    update['$set'] = updateObj

    let options = {
        new: true
    }
    return packageReqDao.findOneAndUpdate(query, update, options)
}

/**
 * Add package request
 * @param {Object} query query to find project request
 * @param {Object} updateObj package request to be added
 */
function addPackagRequest(query, updateObj) {

    let update = {}
    update['$push'] = { requests: updateObj }

    let options = {
        new: true
    }
    return packageReqDao.findOneAndUpdate(query, update, options)
}

function getAllProjectList(query, projectFields) {

    return projectDao.findOne(query, projectFields)
}

function getAllMasters(query) {

    return masterDao.find(query)
}

/**
 * Create support ticket
 * @param {Object} ticketDetails support ticket details to be added
 */
function createSupportTicket(ticketDetails) {

    let ticketObj = new Ticket(ticketDetails)
    return ticketDao.save(ticketObj)
}

/**
 * Get ticket details
 * @param {Object} query query to find support ticket details
 */
function getTicketDetails(query) {

    return ticketDao.findOne(query)

}

/**
 *Remove or disable ticket 
 * @param {Object} query mongo query to find user
 * @param {Object} updateObj details of user to be updated
 */
function updateTicket(query, updateObj) {

    let update = {}
    update['$set'] = updateObj

    let options = {
        new: true
    }
    return ticketDao.findOneAndUpdate(query, update, options)
}

/**
 * Get all tickets details
 */
function getAllTicketDetails(query) {

    return ticketDao.aggregate(query)

}

/**
 * Delete employment history
 * @param {Object} query mongo query to get user details
 * @param {Object} employId mongo query to remove employment details
 */
function deleteEmploymentHistory(query, employId) {

    let update = {}
    update['$pull'] = { "employmentHistory": { _id: employId } }

    let options = {
        new: true
    }

    return usrDao.findOneAndUpdate(query, update, options)
}

/**
 * Delete education
 * @param {Object} query mongo query to get user details
 * @param {Object} employId mongo query to remove education details
 */
function deleteEducation(query, educationId) {

    let update = {}
    update['$pull'] = { "education": { _id: educationId } }

    let options = {
        new: true
    }

    return usrDao.findOneAndUpdate(query, update, options)
}

/**
 * Create new notification
 * @param {Object} obj notification object to be created
 */
function createNotification(obj) {

    return notificationDao.save(obj)
}

/**
 * Get admin notifications
 * @param {Object} query query to fetch notifications received
 */
function getAllNotifications(query, skip, limit) {

    return notificationDao.findWithPagination(query, parseInt(skip), parseInt(limit))
}

/**
 * Update notification
 * @param {Object} query query to fetch notifications
 * @param {Object} updateObj update notifications details
 */
function updateNotifications(query, updateObj) {

    let update = {}
    update['$set'] = updateObj
    let options = {
        new: true,
        multi: true
    }
    return notificationDao.update(query, update, options)
}

/**
 * Get unread notification counts
 * @param {Object} query query to find unread notification counts
 */
function getNotificationCount(query) {

    return notificationDao.count(query)
}

/**
 * Get chat room details
 * @param {Object} query mongo query to find chat room
 */
function getChatRoomDetails(query) {

    return chatDao.findOne(query)
}

/**
 * Update chat details
 * @param {Object} query query to find room
 * @param {Object} updateDetails details to be updated
 */
function chatUpdate(query, updateDetails) {

    let update = {}
    update['$set'] = updateDetails

    let options = { new: true }

    return chatDao.findOneAndUpdate(query, update, options);
}

/**
 * Get chat list
 * @param {Array} query aggregate query to find user list with whom the logged user has chatted
 */
function getChatList(query) {

    return chatDao.aggregate(query)
}

/**
 * Get chat history
 * @param {Array} query aggregate query to get all chat messages
 */
function getChats(query) {

    return chatDao.aggregate(query)
}

/**
 * Create new chat room
 * @param {Object} data chat to be created
 */
function createRoom(data) {

    let chatObj = new Chat(data)
    return chatDao.save(chatObj)
}

/**
 * Get notification details
 * @param {Object} query query to check if user has any unread notification
 */
function getNotificationDetails(query){

    return notificationDao.findOne(query)
}
module.exports = {

    getUserDetails,

    createUser,

    getTemplateDetails,

    updateProfile,

    getAdminDetails,

    getAllActivities,

    updateProfileMultipleFields,

    getServiceDetails,

    getCMSDetails,

    getMasterDetails,

    createProject,

    getProjectCounts,

    getAllProjects,

    getProjectDetails,

    updateProject,

    getAllUsers,

    addPackage,

    findSkillsDetails,

    deleteSkills,

    findPortfolioProjectDetails,

    deleteProject,

    getPortfolioProjectDetails,

    getSkills,

    getEmploymentHistoryDetails,

    addRequest,

    getAllPackageRequests,

    getProjectJoinDetails,

    updateRequest,

    addPackagRequest,

    getAllProjectList,

    getAllMasters,

    createSupportTicket,

    getTicketDetails,

    updateTicket,

    getAllTicketDetails,

    deleteEmploymentHistory,

    deleteEducation,

    createNotification,

    getNotificationCount,

    updateNotifications,

    getAllNotifications,

    getChatRoomDetails,

    chatUpdate,

    getChatList,

    getChats,

    createRoom,

    getNotificationDetails
}
