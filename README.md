# reBaked

ReBaked ( Rest APIs )

## Prerequisites:

- Nodejs (Version v14.5.0)
- Npm (Version 6.14.5)
- MongoDB (Version v4.0.22)

## Steps to run the project:

- Make sure nodejs, mongoDB is install and is accessable through console.
- You can test npm by typing `npm -v` to check the npm version.
- To check node has been installed, type following command: `node -v`.
- Versions for npm and node needs to be as perdefined otherwise functionality issues depending upon third party can arise.
- Install all dependencies, Run "npm install". This will install all the packages to run the project.
- If you are running for development mode: Run command `npm run start` or `npm run dev`
- For production mode , run following command: `npm run prod`


# Folder structure:
    - config 
        - environments specific information
        - database connection
    -dao
        - queries for database
    - models:
        - database structure models
    - middleware
        - common handlers (like mail sending, sms sending)
    - modules:
        - role specific contents (Like - admin, user)
    - redis
        - caching server integration
    - routes:
        - Route handling for incoming requests to the server


