module.exports = {
    environment: 'staging',
    port: 5001,
    protocol : 'http',
    TAG: "staging",
    mongo: {
        dbName: process.env.dbName,
        dbUrl: process.env.dbUrl,
        options: {
        }
    },
    swagger_port : 80,
    isStag: true,

};
