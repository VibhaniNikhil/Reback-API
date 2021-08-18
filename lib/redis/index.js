
/**
 * @author Kavya Patel
 */

/*#################################            Load modules start            ########################################### */

const redis = require("redis");
const client = redis.createClient(process.env.redisPort, process.env.redisHost, { password: process.env.redisPass });
const { v4: uuidv4 } = require('uuid');

/*#################################            Load modules end            ########################################### */


function setRedisDetails(userDetails) {
    let uuid = uuidv4();
    client.set(uuid, JSON.stringify(userDetails));

    return uuid
}

function getRedisDetails(uuid) {

    return new Promise((resolve, reject) => {

        client.get(uuid, (err, res) => {

            if (err) {

                reject(null)

            } else if (res) {

                let userDetails = JSON.parse(res);
                let expTime = userDetails.expiryTime;
                let currTime = new Date().getTime()

                if (currTime < expTime) {

                    client.del(uuid, (err, reply) => {
                        resolve(userDetails)
                    })
                } else {

                    resolve(null)
                }
            } else {
                resolve(null)
            }
        });
    })
}
module.exports = {
    setRedisDetails,

    getRedisDetails
}