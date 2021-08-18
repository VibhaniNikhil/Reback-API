'use strict';

//========================== Load Modules Start ===========================

var promise = require('bluebird');
var bcrypt = require('bcryptjs');

//========================== Load Modules End =============================

/**
 * returns if email is valid or not
 * @returns {boolean}
 */
function isValidEmail(email) {
    var pattern = /(([a-zA-Z0-9\-?\.?]+)@(([a-zA-Z0-9\-_]+\.)+)([a-z]{2,3}))+$/;
    return new RegExp(pattern).test(email);
}


async function convertPass(password) {
    let pass = await bcrypt.hash(password, 10)
    // req.body.password = pass;
    return pass
}

function verifyPassword(user, isExist) {
    return bcrypt.compare(user.password, isExist.password);
}

module.exports = {

    verifyPassword,

    isValidEmail,

    convertPass,

}
