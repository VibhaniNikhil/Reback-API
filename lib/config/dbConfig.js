'use strict';

//=================================== Load Modules start ===================================

//=================================== Load external modules=================================
const mongoose = require('mongoose');
// plugin bluebird promise in mongoose
mongoose.Promise = require('bluebird');

//=================================== Load Modules end =====================================


// Connect to Db
function connectDb(env, callback) {
    let dbName = env.mongo.dbName;
    let dbUrl = env.mongo.dbUrl;
    let dbOptions = env.mongo.options;
    if (env.isProd) {
        console.info("configuring db in " + env.TAG + " mode");
        dbUrl = dbUrl + dbName;
//	  dbUrl = dbUrl;
    } else { 
        console.info("configuring db in " + env.TAG + " mode");
        dbUrl = dbUrl + dbName;
//	  dbUrl = dbUrl;
        mongoose.set('debug', true);
    }
 
    console.info("connecting to -> " + dbUrl);
    mongoose.connect(dbUrl,dbOptions);

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
        console.info('connected to DB', dbName);
        callback();
    });

    // If the connection throws an error
    mongoose.connection.on('error', function (err) {
        console.info('DB connection error: ' + err);
        callback(err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.info('DB connection disconnected');
        callback("DB connection disconnected");
    });
}

module.exports = connectDb;
