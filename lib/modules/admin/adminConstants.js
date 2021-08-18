/**
 * @author Kavya Patel
 */

let messages = {
    InvalidCredentials: 'An account with the provided details does not exist. Please try again with valid details',
    internalServerError: 'Internal server error. Please try after some time',
    InvalidDetails: 'Please provide valid details',
    InvalidVerificationCode: 'Please provide a valid OTP',
    VerificationSuccess: 'Account verified successfully',
    Success: 'Success',
    TOKEN_NOT_PROVIDED: 'Your login session seems to be expired. Please login again',
    userUpdatedSuccess: "User updated successfully",
    InvalidPassword: 'Please provide valid password',
    LoginSuccess: 'Logged in successfully',
    LogoutSuccess: 'Logged out successfully',
    ProfileUpdated: 'Profile updated successfully',
    ResetPasswordMailSent: 'Please check your registered email for further',
    PasswordUpdateSuccess: "Password updated successfully",
    ResetPasswordLinkExpired: "Your reset password link seems to be expired",
    EmailAlreadyExists: 'Email id already exists',
    EmailResetSuccessful: 'Email address updated successfully',
    ContactNumberAlreadyExists: 'Contact number already exists',
    ContactResetSuccessful: 'Contact number updated successfully',
    CMSPageAlreadyExists: 'CMS page already exists',
    CMSPageCreatedSuccess: 'CMS Page added successfully',
    CMSPageNotFound: "CMS page does not exists",
    CMSPageUpdatedSuccess: 'CMS page updated successfully',
    CMSPageActivated: 'CMS page activated successfully',
    CMSPageDeactivated: 'CMS page deactivated successfully',
    UserCreatedSuccess: 'User added successfully',
    TemplateAlreadyExists: 'Template already exists',
    TemplateCreatedSuccess: 'Template added successfully',
    TemplateNotFound: "Template does not exists",
    TemplateUpdated: 'Template updated successfully',
    TemplateActivated: 'Template activated successfully',
    TemplateDeactivated: 'Template deactivated successfully',
    UserActivated: 'User activated successfully',
    UserDeactivated: 'User deactivated successfully',
    SupportQueryReplySent: 'Reply sent successfully',
    SupportQueryOpened: 'Support query opened successfully',
    SupportQueryClosed: 'Support query closed successfully',
    NotificationStatusUpdated: 'Notifications marked as read',
    InvalidTicketDetails: "Ticket does not exists",
    TicketStatusUpdated: "Status updated successfully",
    ThirdPartyServiceAlreadyExists: 'Service already exists',
    ServiceCreatedSuccess: "Service added successfully",
    InvalidThirdParty: "Service does not exists",
    ThirdPartyServiceUpdated: "Service updated successfully",
    ThirdPartyServiceActivatedSuccess: 'Service activated successfully',
    ThirdPartyServiceDeactivatedSuccess: 'Service deactivated successfully',
    MultipleActivitiesRemoved: 'Activities removed successfully',
    SingleActivityRemoved: 'Activity removed successfully',
    UserEmailNotSet: 'There is no recipient of this mail',
    MailSent: "Mail sent successfully",
    OldPasswordNotMatch: "Please provide valid old password",
    EmailChangeVerificationSent: 'One time password has been sent to your registered email address',
    ContactChangeVerificationSent: 'One time password has been sent to your registered contact number',
    DefaultPasswordReset: 'Default password set successfully',
    SkillAlreadyExists: 'skill already exists. Please try updating it or provide another name',
    SkillCreatedSuccess: 'Skill added successfully',
    SkillNotFound: "Skill does not exist. Please provide valid page details",
    SkillUpdatedSuccess: 'Skill updated successfully',
    SkillActivated: 'Skill activated successfully',
    SkillDeactivated: 'Skill deactivated successfully',
    RolesAdded: 'Roles added successfully',
    ProjectRoleUpdated: "Role updated successfully",
    ProjectRoleActivated: "Role activated successfully",
    ProjectRoleDeactivated: "Role deactivated successfully",
    ActivitiesRemoved: 'Activities removed successfully',
    ActivityRemoved: 'Activity removed successfully',
    MasterDataAdded: 'Details added successfully',
    MasterAlreadyExists: 'Details with the same type already exists',
    MasterNotFound: 'Master record does not exists',
    ValuesAddedSuccess: 'Value added successfully',
    MasterUpdateSuccess: 'Value updated successfully',
    MasterDeletedSuccess: 'Value removed successfully',
    ProjectNotFound: 'Project does not exists',
    ProjectApproved: 'Project approved successfully',
    ProjectRejected: 'Project rejected successfully',
    TicketNotFound: "Support ticket does not exists",
    CommentSuccess: "Your comment has been submitted successfully",
    ChangeStatusSuccess: "Status has been updated successfully",
    TicketUpdatedSuccess: 'Support ticket updated successfully',
    FAQAdded: 'FAQ added successfully',
    FAQNotFound: 'FAQ does not exists',
    UserNotFound: 'User does not exists',
    FAQUpdated: 'FAQ updated successfully',
    FAQDeleted: 'FAQ deleted successfully'
}

// CmsConstentName = {AboutUs , Features, Roadmap}

let codes = {
    FRBDN: 403,
    INTRNLSRVR: 500,
    Success: 200,
    DataNotFound: 404,
    BadRequest: 400,
    ReqTimeOut: 408
}

module.exports = {
    CODE: codes,
    MESSAGE: messages
}