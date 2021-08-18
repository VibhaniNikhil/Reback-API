/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const router = require("express").Router();
const fileUtil = require('../../middleware/multer')
let cloudinary = require('cloudinary');
const admConst = require('../admin/adminConstants')
const mapper = require('../admin/adminMapper')

// cloudinary configurations
cloudinary.config({
    cloud_name: process.env.cloudinary_name,
    api_key: process.env.cloudinary_key,
    api_secret: process.env.cloudinary_secret
});
/*#################################            Load modules end            ########################################### */


router.route('/uploadImage').post((req, res) => {

    return new Promise((resol, reje) => {

        fileUtil.upload(req, res, async (err) => {

            if (err) {

                console.log({ err });
                res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))

            } else {

                let multipleUpload = new Promise(async (resolve, reject) => {

                    let upload_len = req.newFile_name
                    let filePath = upload_len

                    await cloudinary.v2.uploader.upload(`${process.cwd()}/img/${filePath}`, async (error, result) => {

                        if (result) {

                            await require('fs').unlink(`${process.cwd()}/img/${filePath}`, (err, resp) => { })

                            resolve(result.secure_url);
                        } else {

                            reject(null)
                        }
                    })
                }).then((result) => result).catch((error) => error)

                let upload = await multipleUpload;

                if (upload) {

                    res.send(mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, upload))

                } else {
                    res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
                }
            }
        })
    }).catch((err) => {

        console.log({ err })
        res.send(mapper.responseMapping(admConst.CODE.INTRNLSRVR, admConst.MESSAGE.internalServerError))
    })
})

router.route('/getEnvironments').get((req, res) => {

    let obj = {
        userBaseURL: process.env.userBaseURL,
        adminBaseURL: process.env.adminBaseURL,
        commonBaseURL: process.env.commonBaseURL
    }

    res.send(mapper.responseMappingWithData(admConst.CODE.Success, admConst.MESSAGE.Success, obj))

})

module.exports = router