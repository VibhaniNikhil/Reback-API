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

function filteredUserResponseFields(obj) {

    let { _id, fullName, emailId, contactNumber, profilePicture, createdAt, isLoggedOut, loginActivity, isOTPVerified, resume, isPasswordReset, document, basicInfo, skills, resumePicture, jobPreferences, education, portfolio, employmentHistory, twitterURL, linkedIn, githubURL, adminVerification, socketId } = obj
    return { _id, fullName, emailId, contactNumber, profilePicture, createdAt, isLoggedOut, loginActivity, isOTPVerified, resume, isPasswordReset, document, basicInfo, skills, resumePicture, jobPreferences, education, portfolio, employmentHistory, twitterURL, linkedIn, githubURL, adminVerification, socketId }
}

function filteredCmsResponseFields(obj) {

    let { _id, CMSName, CMSPageDetails } = obj
    return { _id, CMSName, CMSPageDetails }
}

module.exports = {

    responseMapping,

    responseMappingWithData,

    filteredUserResponseFields,

    filteredCmsResponseFields
}