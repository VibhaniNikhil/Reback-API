const STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE"
}

const SUPPORT_TICKET_STATUS = {
    OPEN: "OPEN",
    COMPLETED: "COMPLETED",
    INPROGRESS: "INPROGRESS"
}

const DB_MODEL_REF = {
    USERS: 'users',
    ADMINS: 'admins',
    EMAILTEMPLATES: 'emailtemplates',
    CMS_PAGES: 'cmspages',
    CONTACTUS: 'contactUs',
    NOTIFICATIONS: 'notifications',
    SUPPORT_TICKETS: 'supporttickets',
    THIRD_PARTY_SERVICE: 'thirdpartyservices',
    PROJECTS: 'projects',
    MASTERS: 'masters',
    JOIN_REQUESTS: 'joinrequests',
    FREQUENTLY_ASK_QUESTION: 'frequentlyAskQuestions',
    CHATS: 'chats'

}

const CMS = {
    ABOUTUS: 'ABOUTUS',
    FEATURES: 'FEATURES',
    CONTACTUS: 'CONTACTUS',
    TEAM: 'TEAM',
    TERMSANDCONDITIONS: 'TERMSANDCONDITIONS',
    PRIVACYPOLICY: 'PRIVACYPOLICY',
    FAQ: 'FAQ',
    FOOTERLINKS: 'FOOTERLINKS'
}

const CODE = {
    Success: 200,
    FRBDN: 403,
    INTRNLSRVR: 500,
    DataNotFound: 404,
    BadRequest: 400,
}

const EMAIL_TEMPLATES = {

    'USER_NEW_REGISTER_WELCOME': 'Welcome mail',
    'NEW_VERIFICATION_CODE': 'Security verification mail',
    'LOGIN': 'Login',
    'USER_FORGOT_PASSWORD': 'User: Forgot password',
    'ADMIN_FORGOT_PASSWORD': 'Admin: Forgot password',
    'USER_RESET_PASSWORD': 'User: Reset password',
    'ADMIN_RESET_PASSWORD': 'Admin: Reset password',
    'CHANGE_EMAIL_ADDRESS': 'Email change request',
    'NEW_SUPPORT_TICKET': 'New support ticket',
    'CONTACT_US_QUERY': 'New contact-us query',
    'SUPPORT_TICKET_STATUS_CHANGE': 'Status change of support ticket',
    'NOTIFY_CONTACT_NUMBER_CHANGE_REQUEST': 'SMS body for contact number change request',
    'NOTIFY_SMS_VERIFICATION_CODE': 'SMS body for security verification',
    'NOTIFY_FOR_NEW_USER_CREATED': 'Notify admin for new user registration',
    'TWO_FACTOR_AUTHENTICATION_ENABLED': '2FA enabled',
    'TWO_FACTOR_AUTHENTICATION_DISABLED': '2FA diasbled',
    'PROJECT_APPROVED_BY_ADMIN': 'Project approved',
    'PROJECT_REJECTED_BY_ADMIN': 'Project rejected',
    'INVITE_FRIENDS': 'Invite friends',
    'NEW_USER_CREATED_BY_ADMIN': 'Welcome new user created by admin',
    'NEW_PROJECT_CREATED': 'New project created by initiator',
    'NEW_JOIN_REQUEST': 'New package joining request from collaborator',
    'JOIN_REQUEST_APPROVED': 'Package joining request approved',
    'JOIN_REQUEST_REJECTED': 'Package joining request rejected',
    'NOTIFY_PROJECT_APPROVED_BY_ADMIN': 'Notify user for project approval',
    'NOTIFY_PROJECT_REJECTED_BY_ADMIN': 'Notify user for project rejected',
    'NOTIFY_BONUS_RECEIVED': 'Notify user for bonus credited',
    'NOTIFY_PAYMENT_RECEIVED': 'Notify user for payment recieved',
    'NOTIFY_NEW_DISPUTE': 'Notify admin for new dispute raised',
    'NOTIFY_UPDATE_PROJECT': 'Notify all collaborators when any updates are made in project',
    'NOTIFY_NEW_MESSAGE': 'Notify user for new message'
}

const TEMPLATE_ENTITIES = [
    {
        'templateName': 'Welcome mail',
        'templateEntities': ['fullName']
    }, {
        'templateName': 'Security verification mail',
        'templateEntities': ['fullName', 'verificationCode']
    }, {
        'templateName': 'Login',
        'templateEntities': ['fullName', 'date', 'device', 'browser', 'ipaddress', 'country', 'state']
    }, {
        'templateName': 'User: Forgot password',
        'templateEntities': ['fullName', 'redisId']
    }, {
        'templateName': 'Admin: Forgot password',
        'templateEntities': ['fullName', 'redisId']
    }, {
        'templateName': 'User: Reset password',
        'templateEntities': ['fullName', 'date', 'device', 'browser', 'ipaddress', 'country', 'state']
    }, {
        'templateName': 'Admin: Reset password',
        'templateEntities': ['fullName', 'date', 'device', 'browser', 'ipaddress', 'country', 'state']
    }, {
        'templateName': 'Email change request',
        'templateEntities': ['fullName', 'verificationCode']
    }, {
        'templateName': 'New support ticket',
        'templateEntities': ['fullName', 'subject']
    }, {
        'templateName': 'New contact-us query',
        'templateEntities': ['name', 'userEmailId', 'contactNumber', 'message']
    }, {
        'templateName': 'Status change of support ticket',
        'templateEntities': ['fullName', 'emailId', 'contactNumber', 'message']
    }, {
        'templateName': 'SMS body for contact number change request',
        'templateEntities': ['verificationCode']
    }, {
        'templateName': 'SMS body for security verification',
        'templateEntities': ['verificationCode']
    }, {
        'templateName': 'Notify admin for new user registration',
        'templateEntities': ['fullName']
    }, {
        'templateName': '2FA enabled',
        'templateEntities': ['fullName']
    }, {
        'templateName': '2FA diasbled',
        'templateEntities': ['fullName']
    }, {
        'templateName': 'Project approved',
        'templateEntities': ['fullName', 'title']
    }, {
        'templateName': 'Project rejected',
        'templateEntities': ['fullName', 'title']
    }, {
        'templateName': 'Invite friends',
        'templateEntities': ['senderName', 'userId']
    }, {
        'templateName': 'Welcome new user created by admin',
        'templateEntities': ['fullName', 'password']
    }, {
        'templateName': 'New project created by initiator',
        'templateEntities': ['fullName', 'initiatorName', 'title']
    }, {
        'templateName': 'New package joining request from collaborator',
        'templateEntities': ['fullName', 'collaboratorName', 'projectName', 'packageName']
    }, {
        'templateName': 'Package joining request approved',
        'templateEntities': ['fullName', 'projectName', 'packageName']
    }, {
        'templateName': 'Package joining request rejected',
        'templateEntities': ['fullName', 'projectName', 'packageName']
    }, {
        'templateName': 'Notify user for project approval',
        'templateEntities': ['projectName']
    }, {
        'templateName': 'Notify user for project rejected',
        'templateEntities': ['projectName']
    }, {
        'templateName': 'Notify user for bonus credited',
        'templateEntities': ['projectName']
    }, {
        'templateName': 'Notify user for payment recieved',
        'templateEntities': ['projectName']
    }, {
        'templateName': 'Notify admin for new dispute raised',
        'templateEntities': ['fullName']
    }, {
        'templateName': 'Notify all collaborators when any updates are made in project',
        'templateEntities': ['projectName']
    }, {
        'templateName': 'Notify user for new message',
        'templateEntities': ['fullName']
    }]

const TEMPLATE_TYPES = {
    'EMAIL': 'EMAIL',
    'NOTIFICATION': 'NOTIFICATION',
    'BELL_NOTIFICATION': 'BELL_NOTIFICATION'
}

const FOOTERLINKS = {
    'Facebook': 'Facebook',
    'Twitter': 'Twitter',
    'LinkedIn': 'LinkedIn',
    'Instagram': 'Instagram',
    'YouTube': 'YouTube',
    'Telegram': 'Telegram'
}

const THIRD_PARTY_SERVICES = {
    MAIL_GATEWAY: 'MAIL_GATEWAY',
    SMS_GATEWAY: 'SMS_GATEWAY',
    PAYMENT_GATEWAY: 'PAYMENT_GATEWAY'
}

const VERIFICATION_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED'
}

const PACKAGE_WORK_STATUS = {
    OPEN: 'OPEN', // when package is created
    INPROGRESS: 'INPROGRESS', // when any 1st collaborator starts work
    EXPIRED: 'EXPIRED', // when submission is delayed
    COMPLETED: 'COMPLETED', // when all user's submissions are approved
}

const USER_WORK_STATUS = {
    INPROGRESS: 'INPROGRESS', // when any collaborator starts work
    SUBMITTED: 'SUBMITTED', // when collaborator submits his/her work (individually)
    SUBMISSION_APPROVED: 'SUBMISSION_APPROVED', // whole package submission approved
    SUBMISSION_REJECTED: 'SUBMISSION_REJECTED', // whole package submission rejected
}

const PROJECT_STATUS = {
    OPEN: 'OPEN', // when project is created and ongoing
    COMPLETED: 'COMPLETED', // when all packages are submitted and approved
    CLOSE: 'CLOSE', // when project is closed and payment is also done
    INPROGRESS: 'INPROGRESS' // when any package is in progress
}

const MASTER_TYPES = {
    PROJECT_TYPES: 'Project Types',
    ISSUE_TYPES: 'Issue Types',
    COLLABORATOR_LEVEL: 'Collaborator Levels',
    SKILLS: 'Skills'
}

const NOTIFICATION_CATEGORIES = {
    PROJECT: 'PROJECT',
    PAYMENT: 'PAYMENT',
    CHAT: 'CHAT',
    SUPPORT_TICKET: 'SUPPORT_TICKET'
}

const MESSAGE_TYPES = {
    TEXT: 'TEXT',
    FILE: 'FILE'
}
module.exports = Object.freeze({

    TOKEN_EXPIRATION_TIME: 24 * 60, // in mins - 60

    DB_MODEL_REF,

    STATUS,

    SUPPORT_TICKET_STATUS,

    CMS,

    EMAIL_TEMPLATES,

    CODE,

    TEMPLATE_ENTITIES,

    TEMPLATE_TYPES,

    FOOTERLINKS,

    THIRD_PARTY_SERVICES,

    VERIFICATION_STATUS,

    PACKAGE_WORK_STATUS,

    PROJECT_STATUS,

    MASTER_TYPES,

    USER_WORK_STATUS,

    NOTIFICATION_CATEGORIES,

    MESSAGE_TYPES

});