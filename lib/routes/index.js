// Load user routes
const usrRouter = require('../modules/user/userRoute')
const admRouter = require('../modules/admin/adminRoute')
const commonRouter = require('../modules/common')

//========================== Load Modules End ==============================================

module.exports = function (app) {
    app.get("/", (req, res) => {
        res.sendStatus(200);
    })
    app.use('/ReBaked/v1/api/user', usrRouter)
    app.use('/ReBaked/v1/api/admin', admRouter)
    app.use('/ReBaked/v1/api', commonRouter)
};
