
/**
 * @author Kavya Patel
 */

function responseMapping(code, msg) {
    return {
        responseCode: code,
        responseMessage: msg
    }
}

function responseMappingWithData(code, msg, data) {
    return {
        responseCode: code,
        responseMessage: msg,
        responseData: data
    }
}

function filterAdminResponse(obj) {

    let { _id, fullName, emailId, contactNumber, profilePicture, isLoggedOut, loginActivity, twoFactorAuthentication } = obj
    return { _id, fullName, emailId, contactNumber, profilePicture, isLoggedOut, loginActivity, twoFactorAuthentication }
}

function filterAllowedUserUpdateFields(obj) {

    let { fullName, profilePicture, document, adminVerification } = obj
    return {
        fullName, profilePicture, document, adminVerification
    }
}

function filteredUserFields(obj) {

    let { _id, fullName, emailId, contactNumber, profilePicture, createdAt, isLoggedOut, status, document, adminVerification, loginActivity } = obj
    return { _id, fullName, emailId, contactNumber, profilePicture, createdAt, isLoggedOut, status, document, adminVerification, loginActivity }
}

function filterAllowedTemplateFields(templateDetails) {

    return {
        _id, mailName, mailTitle, mailBody, mailSubject, notificationMessage
    } = templateDetails
}

function filterTemplateUpdateFields(templateDetails) {

    return {
        mailTitle, mailBody, mailSubject, notificationMessage
    } = templateDetails
}

function filteredCmsResponseFields(obj) {

    let { _id, CMSName, CMSPageDetails, status, createdAt } = obj
    return {  _id, status, CMSName, CMSPageDetails,createdAt }
}

module.exports = {

    responseMapping,

    responseMappingWithData,

    filterAdminResponse,

    filterAllowedUserUpdateFields,

    filteredUserFields,

    filterAllowedTemplateFields,

    filterTemplateUpdateFields,

    filteredCmsResponseFields

}