module.exports = {
    environment: 'production',
    port: 5001,
    protocol : 'http',
    TAG: "production",
    mongo: {
        dbName: process.env.dbName,
        dbUrl: process.env.dbUrl,
        options: {
        }
    },
    isProd: true,

  
};
