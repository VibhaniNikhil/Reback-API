'use strict';

console.log("");
console.log("//************************* ReBaked **************************//");
console.log("");

var res = require('dotenv').config();

//Import Config
const config = require('./lib/config');

config.dbConfig(config.cfg, (err) => {
    if (err) {
        // logger.error(err, 'exiting the app.');

        console.log({ err })
        return;
    }

    // load external modules
    const express = require("express");

    // init express app
    const app = express();

    // config express
    config.expressConfig(app);
    if (err) return res.json(err)

    // attach the routes to the app
    require("./lib/routes")(app);

    // start server
    const server = app.listen(process.env.PORT, () => {
        console.log(`Express server listening on ${process.env.PORT}`)
    });

    // const io = socket(server);
    require('./lib/middleware/socketHandler').connect(server)

});