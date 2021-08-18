module.exports = {
    environment: 'development',
    port: process.env.PORT,
    protocol : 'http',
    TAG: "development",
    mongo: {
        dbName: process.env.dbName,
        dbUrl: process.env.dbUrl,
        options: {
        }
    },
    user_secret:process.env.user_secret,
    admin_secret:process.env.admin_secret,
    // cloudinary_key:process.env.cloudinary_key,
    // cloudinary_secret:process.env.cloudinary_secret,
    // cloudinary_name:process.env.cloudinary_name,
    // cloudinary_env_variable:process.env.cloudinary_env_variable,
    // cloudinary_upload_url:process.env.cloudinary_upload_url,
    isDev:true
};
