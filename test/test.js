/**
 * @author Mukesh Ratnu
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////

const expect = require('chai').expect;
const adminService = require('../lib/modules/admin/adminService')
const adminValidators = require('../lib/modules/admin/adminValidators')
const adminFacade = require('../lib/modules/admin/adminFacade')
const constants = require('../lib/constants');

/////////////////////////////////////// createCMS /////////////////////////////////////////////////////////

describe("Testing validation of admin createCMS fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.createCMS();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.createCMS('60ab3c5ee6279448348e5af5');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid admin id ', async () => {

        let result = await adminService.createCMS('', {
            cmsName: "Roadmap",
            cmsPageDetails: "www.test.com"
        });
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send error with invalid details', async () => {

    //     let result = await adminService.createCMS('60ab3c5ee6279448348e5af5', {
    //         "CMSName": "FEATURES",
    //         "CMSPageDetails": "www.test.com"
    //     });
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.createCMS('', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

})

////////////////////////////////////// getCMSDetails //////////////////////////////////////////////////////


describe("Testing validation of admin getCMSDetails fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.getCMSDetails();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null cmsId', async () => {

        let result = await adminService.getCMSDetails('60ab3c5ee6279448348e5af5', '');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null admin id', async () => {

        let result = await adminService.getCMSDetails('', '60b4d733645d016fc2c82ab9');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null parameters ', async () => {

        let result = await adminService.getCMSDetails('', '');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.getCMSDetails('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.getCMSDetails({}, {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})

///////////////////////////////////// updateCMSDetails /////////////////////////////////////////////////////////


describe("Testing of updateCMSDetails fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.updateCMSDetails();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null cmsId and cmsDetails ', async () => {

        let result = await adminService.updateCMSDetails('60ab3c5ee6279448348e5af5', '', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send error with null cmsDetails object', async () => {

    //     let result = await adminService.updateCMSDetails('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9', {});
    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    // it('should send success with all valid details', async () => {

    //     let result = await adminService.updateCMSDetails('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9', {
    //         CMSName: "ABOUTUS",
    //         CMSPageDetails: "www.test.com"
    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    it('should send error with null id and cmsDetails object', async () => {

        let result = await adminService.updateCMSDetails('', '60b4d733645d016fc2c82ab9', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id and cmsId', async () => {

        let result = await adminService.updateCMSDetails('', '', {
            CMSName: "ABOUTUS",
            CMSPageDetails: "www.test.com"
        });

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })



    it('should send error with null parameters ', async () => {

        let result = await adminService.updateCMSDetails('', '', {});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.updateCMSDetails('', '', []);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})


///////////////////////////////////// deleteCMSDetails /////////////////////////////////////////////////////////


describe("Testing validation of admin deleteCMSDetails fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.deleteCMSDetails();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null cms id', async () => {

        let result = await adminService.deleteCMSDetails('60ab3c5ee6279448348e5af5', '');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id', async () => {

        let result = await adminService.deleteCMSDetails('', '60b4d733645d016fc2c82ab9');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null parameters ', async () => {

        let result = await adminService.deleteCMSDetails('', '');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.deleteCMSDetails('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.deleteCMSDetails({}, {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})

////////////////////////////////////// getAllCMS //////////////////////////////////////////////////////////////


describe("Testing validation of admin getAllCMS fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.getAllCMS();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id', async () => {

        let result = await adminService.getAllCMS('');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null object ', async () => {

        let result = await adminService.getAllCMS({});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.getAllCMS('60ab3c5ee6279448348e5af5');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })



})

//////////////////////////////////////// login /////////////////////////////////////////////////////////

describe("Testing validation of admin login fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.login();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.login([]);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.login('');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details', async () => {

    //     let result = await adminService.login({

    //         emailId: "admin@reBaked.com",
    //         password: "rebaked@123",
    //         device: "Windows",
    //         ipaddress: "3.18.139.243",
    //         country: "India",
    //         state: "Gujarat",
    //         browser: "Google Chrome",
    //         date: "1610505158000"
    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    // it('should send error with invalid password', async () => {

    //     let result = await adminService.login({

    //         emailId: "admin@reBaked.com",
    //         password: "12",

    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    // it('should send error with invalid emailId', async () => {

    //     let result = await adminService.login({

    //         emailId: 12,
    //         password: "1rebaked@1232",

    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })


})

//////////////////////////////////////// logout /////////////////////////////////////////////////////////


describe("Testing validation of admin logout fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.logout();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null activityId', async () => {

        let result = await adminService.logout('60ab3c5ee6279448348e5af5', '');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id', async () => {

        let result = await adminService.logout('', '60b4d733645d016fc2c82ab9');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null parameters ', async () => {

        let result = await adminService.logout('', '');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.logout('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.logout({}, {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})

///////////////////////////////////////// getProfile //////////////////////////////////////////////////////////////


describe("Testing validation of admin getProfile fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.getProfile();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id', async () => {

        let result = await adminService.getProfile('');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null object ', async () => {

        let result = await adminService.getProfile({});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.getProfile('60ab3c5ee6279448348e5af5');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })



})

//////////////////////////////////////// updateProfile /////////////////////////////////////////////////////////


describe("Testing of updateProfile fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.updateProfile();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null details object', async () => {

        let result = await adminService.updateProfile('60ab3c5ee6279448348e5af5', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details', async () => {

    //     let result = await adminService.updateProfile('60ab3c5ee6279448348e5af5', {
    //         fullName: "Mukesh Ratnu",
    //         profilePicture: "https://res.cloudinary.com/dizkwji5k/image/upload/v1561362114/nbgeugd7hviq8kgjuacr.jpg"

    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    it('should send error with null id', async () => {

        let result = await adminService.updateProfile('', {

            fullName: "Mukesh Ratnu",
            profilePicture: "https://res.cloudinary.com/dizkwji5k/image/upload/v1561362114/nbgeugd7hviq8kgjuacr.jpg"

        });

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null parameters ', async () => {

        let result = await adminService.updateProfile('', {});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.updateProfile([]);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})

/////////////////////////////////////// forgotPassword /////////////////////////////////////////////////////////

describe("Testing validation of admin forgotPassword fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.forgotPassword();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.forgotPassword([]);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.forgotPassword({});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.forgotPassword('');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.forgotPassword({
    //         emailId: "admin@reBaked.com",
    //     });
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

})

///////////////////////////////////// setNewPassword /////////////////////////////////////////////////////////

describe("Testing of setNewPassword fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.setNewPassword();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send error with null password object', async () => {

    //     let result = await adminService.setNewPassword('60ab3c5ee6279448348e5af5', {});
    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    it('should send error with null id', async () => {

        let result = await adminService.setNewPassword('', {
            password:"123"
        });

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null parameters ', async () => {

        let result = await adminService.setNewPassword('', {});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.setNewPassword('', []);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    //  it('should send success with all valid details ', async () => {

    //     let result = await adminService.setNewPassword('60ab3c5ee6279448348e5af5',{
    //         password:"123"
    //     });
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })


})

////////////////////////////////////// resetPassword //////////////////////////////////////////////////////


describe("Testing validation of admin resetPassword fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.resetPassword();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null old password and new password ', async () => {

        let result = await adminService.resetPassword('60ab3c5ee6279448348e5af5', '', '');

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send error with null admin id', async () => {

    //     let result = await adminService.resetPassword('', '', ' ');

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    it('should send error with null parameters ', async () => {

        let result = await adminService.resetPassword('', '');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.resetPassword('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9');
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.resetPassword({}, {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})

/////////////////////////////////////// changeEmailRequest /////////////////////////////////////////////////////////

describe("Testing validation of admin changeEmailRequest fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.changeEmailRequest();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.changeEmailRequest([]);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.changeEmailRequest({});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.changeEmailRequest('');
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send success with all valid details ', async () => {

    //     let result = await adminService.changeEmailRequest({
    //         emailId: "admin@reBaked.com",
    //     });
    //     expect(result.responseCode).to.equals(constants.CODE.Success)
    // })

    it('should send error with invalid details', async () => {

        let result = await adminService.changeEmailRequest('60ab3c5ee6279448348e5af5', { });
       
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.changeEmailRequest('', { 

            emailId: "admin@codezeros.com"

        });

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

})

///////////////////////////////////// updateEmail /////////////////////////////////////////////////////////


describe("Testing of updateEmail fucntionality", () => {

    it('should send error with null parameters', async () => {

        let result = await adminService.updateEmail();
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null cmsId and cmsDetails ', async () => {

        let result = await adminService.updateEmail('60ab3c5ee6279448348e5af5', '', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    // it('should send error with null cmsDetails object', async () => {

    //     let result = await adminService.updateEmail('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9', {});
    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    // it('should send success with all valid details', async () => {

    //     let result = await adminService.updateEmail('60ab3c5ee6279448348e5af5', '60b4d733645d016fc2c82ab9', {
    //         CMSName: "ABOUTUS",
    //         CMSPageDetails: "www.test.com"
    //     });

    //     expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    // })

    it('should send error with null id and cmsDetails object', async () => {

        let result = await adminService.updateEmail('', '60b4d733645d016fc2c82ab9', {});

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with null id and cmsId', async () => {

        let result = await adminService.updateEmail('', '', {
            CMSName: "ABOUTUS",
            CMSPageDetails: "www.test.com"
        });

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })



    it('should send error with null parameters ', async () => {

        let result = await adminService.updateEmail('', '', {});
        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })

    it('should send error with invalid details', async () => {

        let result = await adminService.updateEmail('', '', []);

        expect(result.responseCode).to.equals(constants.CODE.BadRequest)
    })


})
