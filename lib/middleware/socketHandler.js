/**
 * @author Mukesh Ratnu
 */
/*#################################            Load modules start            ########################################### */

const ObjectId = require('mongoose').Types.ObjectId
const userDao = require('../modules/user/userDao')
const constants = require('../constants')
const mailHandler = require('./email')

/*#################################            Load modules end            ########################################### */

// Connect Socket Server
function connect(server) {
    const Server = require("socket.io")

    io = Server(server);

    io.sockets.on('connection', (socket) => {
        console.log("Socket Connected", socket.id)
        // socket = soc
        socket.on('setSocketId', (userData) => {

            console.log("Socket connected user data => ", userData)
            let query = {
                _id: userData.id
            }
            let updateObj = {
                socketId: userData.socketId
            }
            userDao.updateProfile(query, updateObj)
        })

        socket.on('sendMessage', (data) => {

            var msg = data.message.trim()
            var messages = []
            let query = {
                $and: [{
                    $or: [
                        { participateId1: data.sender },
                        { participateId2: data.sender }
                    ]
                }, {
                    $or: [
                        { participateId1: data.receiver },
                        { participateId2: data.receiver }
                    ]
                }]
            }
            userDao.getChatRoomDetails(query).then((roomDetails) => {
                let roomId = ""

                let receiver = data.receiver
                let sender = data.sender
                if (roomDetails) {
                    roomId = roomDetails._id
                    let roomQuery = {
                        _id: roomDetails._id
                    }
                    messages = roomDetails.data
                    if (data.category == constants.MESSAGE_TYPES.TEXT) {

                        messages.push({
                            message: msg,
                            sender: data.sender,
                            receiver: data.receiver,
                            time: new Date().getTime(),
                            category: data.category
                        })
                    } else {
                        messages.push({
                            message: msg,
                            sender: data.sender,
                            receiver: data.receiver,
                            time: new Date().getTime(),
                            category: data.category,
                            // thumbnail: data.thumbnail,
                            fileType: data.fileType,
                            size: data.size
                        })
                    }
                    let update = {
                        data: messages,
                        lastMessageTime: new Date().getTime()
                    }
                    userDao.chatUpdate(roomQuery, update).then(async (result) => {

                        let senderQuery = {
                            _id: sender
                        }
                        let receiverQuery = {
                            _id: receiver
                        }
                        let senderDetails = await userDao.getUserDetails(senderQuery)
                        let receiverDetails = await userDao.getUserDetails(receiverQuery)
                        if (senderDetails) {

                            let notificationQuery = {

                                mailName: constants.EMAIL_TEMPLATES.NOTIFY_NEW_MESSAGE,
                                status: constants.STATUS.ACTIVE
                            }
                            let notificationTemplateDetails = await userDao.getTemplateDetails(notificationQuery)
                            let notificationMessage = notificationTemplateDetails.notificationMessage

                            let obj = {
                                fullName: senderDetails.fullName,
                            }
                            notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                            if (notificationTemplateDetails) {

                                let notificationObject = {
                                    message: notificationMessage,
                                    isRead: false,
                                    receiverId: receiver,
                                    createdAt: new Date().getTime(),
                                    status: constants.STATUS.ACTIVE,
                                    categoryType: constants.NOTIFICATION_CATEGORIES.CHAT,
                                    refId: roomDetails._id
                                }
                                await userDao.createNotification(notificationObject)
                                emitUserNotification(receiverDetails.socketId)
                            }
                        }

                        let chatRoomQuery = {

                            _id: ObjectId(roomId)
                        }

                        let chatQuery = [{

                            $match: chatRoomQuery
                        },
                        {
                            $lookup: {
                                from: constants.DB_MODEL_REF.USERS,
                                localField: "participateId1",
                                foreignField: '_id',
                                as: 'participant1Details'
                            }
                        }, {
                            $unwind: "$participant1Details"
                        }, {
                            $lookup: {
                                from: constants.DB_MODEL_REF.USERS,
                                localField: "participateId2",
                                foreignField: '_id',
                                as: 'participant2Details'
                            }
                        }, {
                            $unwind: "$participant2Details"
                        },
                        {
                            $project: {
                                "participant1Details._id": "$participant1Details._id",
                                "participant1Details.socketId": "$participant1Details.socketId",
                                "participant1Details.profilePicture": "$participant1Details.profilePicture",
                                "participant1Details.fullName": "$participant1Details.fullName",
                                "participant1Details.isLoggedOut": "$participant1Details.isLoggedOut",
                                "participant2Details._id": "$participant2Details._id",
                                "participant2Details.socketId": "$participant2Details.socketId",
                                "participant2Details.profilePicture": "$participant2Details.profilePicture",
                                "participant2Details.fullName": "$participant2Details.fullName",
                                "participant2Details.isLoggedOut": "$participant2Details.isLoggedOut",
                                "data": "$data",
                                "media": {
                                    $filter: {
                                        input: '$data',
                                        as: 'msgs',
                                        cond: { $eq: ['$$msgs.category', 'FILE'] }
                                    }
                                },
                            }
                        }]
                        userDao.getChats(chatQuery).then((messages) => {

                            console.log("CHECK ROOM RESPONSEE 1:-------", { messages })

                            io.to(receiverDetails.socketId).emit('getAllMessages', messages[0])
                            io.to(senderDetails.socketId).emit('getAllMessages', messages[0])
                        }).catch((err) => {

                            console.log({ err })
                        })
                    }).catch((err) => {

                        console.log({ err })
                    })

                } else {

                    if (data.category == constants.MESSAGE_TYPES.TEXT) {

                        messages.push({
                            message: msg,
                            sender: data.sender,
                            receiver: data.receiver,
                            time: new Date().getTime(),
                            category: data.category
                        })
                    } else {
                        messages.push({
                            message: msg,
                            sender: data.sender,
                            receiver: data.receiver,
                            time: new Date().getTime(),
                            category: data.category,
                            // thumbnail: data.thumbnail,
                            fileType: data.fileType,
                            size: data.size
                        })
                    }
                    let saveData = {
                        participateId1: data.sender,
                        participateId2: data.receiver,
                        data: messages,
                        lastMessageTime: new Date().getTime()
                    }
                    userDao.createRoom(saveData).then(async (roomCreated) => {

                        if (roomCreated) {
                            roomId = roomCreated._id

                            let senderQuery = {
                                _id: sender
                            }
                            let receiverQuery = {
                                _id: receiver
                            }
                            let senderDetails = await userDao.getUserDetails(senderQuery)
                            let receiverDetails = await userDao.getUserDetails(receiverQuery)
                            if (senderDetails) {

                                let notificationQuery = {

                                    mailName: constants.EMAIL_TEMPLATES.NOTIFY_NEW_MESSAGE,
                                    status: constants.STATUS.ACTIVE
                                }
                                let notificationTemplateDetails = await userDao.getTemplateDetails(notificationQuery)
                                let notificationMessage = notificationTemplateDetails.notificationMessage

                                let obj = {
                                    fullName: senderDetails.fullName,
                                }
                                notificationMessage = mailHandler.convertNotificationMessage(obj, notificationMessage)

                                if (notificationTemplateDetails) {

                                    let notificationObject = {
                                        message: notificationMessage,
                                        isRead: false,
                                        receiverId: receiver,
                                        createdAt: new Date().getTime(),
                                        status: constants.STATUS.ACTIVE,
                                        categoryType: constants.NOTIFICATION_CATEGORIES.CHAT,
                                        refId: roomCreated._id
                                    }
                                    await userDao.createNotification(notificationObject)
                                    emitUserNotification(receiverDetails.socketId)
                                }

                            }

                            let chatRoomQuery = {

                                _id: ObjectId(roomId)
                            }

                            let chatQuery = [{

                                $match: chatRoomQuery
                            },
                            {
                                $lookup: {
                                    from: constants.DB_MODEL_REF.USERS,
                                    localField: "participateId1",
                                    foreignField: '_id',
                                    as: 'participant1Details'
                                }
                            }, {
                                $unwind: "$participant1Details"
                            }, {
                                $lookup: {
                                    from: constants.DB_MODEL_REF.USERS,
                                    localField: "participateId2",
                                    foreignField: '_id',
                                    as: 'participant2Details'
                                }
                            }, {
                                $unwind: "$participant2Details"
                            },
                            {
                                $project: {
                                    "participant1Details._id": "$participant1Details._id",
                                    "participant1Details.socketId": "$participant1Details.socketId",
                                    "participant1Details.profilePicture": "$participant1Details.profilePicture",
                                    "participant1Details.fullName": "$participant1Details.fullName",
                                    "participant1Details.isLoggedOut": "$participant1Details.isLoggedOut",
                                    "participant2Details._id": "$participant2Details._id",
                                    "participant2Details.socketId": "$participant2Details.socketId",
                                    "participant2Details.profilePicture": "$participant2Details.profilePicture",
                                    "participant2Details.fullName": "$participant2Details.fullName",
                                    "participant2Details.isLoggedOut": "$participant2Details.isLoggedOut",
                                    "data": "$data",
                                    "media": {
                                        $filter: {
                                            input: '$data',
                                            as: 'msgs',
                                            cond: { $eq: ['$$msgs.category', 'FILE'] }
                                        }
                                    },
                                }
                            }]
                            userDao.getChats(chatQuery).then((messages) => {

                                console.log("CHECK ROOM RESPONSEE 2:-------", { messages })

                                io.to(receiverDetails.socketId).emit('getAllMessages', messages[0])
                                io.to(senderDetails.socketId).emit('getAllMessages', messages[0])
                            }).catch((err) => {

                                console.log({ err })
                            })
                        }
                    }).catch((err) => {

                        console.log({ err })
                    })
                }

            })

        })

        socket.on('checkRoom', (data) => {

            console.log("CHECK ROOM:-------", { data })
            let query = {
                $and: [{
                    $or: [
                        { participateId1: ObjectId(data.sender) },
                        { participateId2: ObjectId(data.sender) }
                    ]
                }, {
                    $or: [
                        { participateId1: ObjectId(data.receiver) },
                        { participateId2: ObjectId(data.receiver) }
                    ]
                }]
            }

            let chatQuery = [{

                $match: query
            },
            {
                $lookup: {
                    from: constants.DB_MODEL_REF.USERS,
                    localField: "participateId1",
                    foreignField: '_id',
                    as: 'participant1Details'
                }
            }, {
                $unwind: "$participant1Details"
            },
            {
                $lookup: {
                    from: constants.DB_MODEL_REF.USERS,
                    localField: "participateId2",
                    foreignField: '_id',
                    as: 'participant2Details'
                }
            }, {
                $unwind: "$participant2Details"
            },
            {
                $project: {
                    "participant1Details._id": "$participant1Details._id",
                    "participant1Details.socketId": "$participant1Details.socketId",
                    "participant1Details.profilePicture": "$participant1Details.profilePicture",
                    "participant1Details.fullName": "$participant1Details.fullName",
                    "participant1Details.isLoggedOut": "$participant1Details.isLoggedOut",
                    "participant2Details._id": "$participant2Details._id",
                    "participant2Details.socketId": "$participant2Details.socketId",
                    "participant2Details.profilePicture": "$participant2Details.profilePicture",
                    "participant2Details.fullName": "$participant2Details.fullName",
                    "participant2Details.isLoggedOut": "$participant2Details.isLoggedOut",
                    "data": "$data",
                    "media": {
                        $filter: {
                            input: '$data',
                            as: 'msgs',
                            cond: { $eq: ['$$msgs.category', 'FILE'] }
                        }
                    },
                }
            }]
            userDao.getChats(chatQuery).then(async (messages) => {

                console.log("CHECK ROOM RESPONSEE 3:-------", { messages })
                if (messages.length > 0) {

                    if (messages[0].participant1Details._id.toString() == data.sender.toString()) {

                        console.log("SENDER")

                        io.to(messages[0].participant1Details.socketId).emit('getAllMessages', messages[0])
                    } else {

                        console.log("RECEIVER")

                        io.to(messages[0].participant2Details.socketId).emit('getAllMessages', messages[0])
                    }
                } else {

                    let senderQuery = {
                        _id: data.sender
                    }
                    let senderDetails = await userDao.getUserDetails(senderQuery)
                    if (senderDetails && senderDetails.socketId) {

                        console.log("LAST")
                        io.to(senderDetails.socketId).emit('getAllMessages', {})
                    }
                }
            })
        })
    })
}

/**
 *  Socket method for new user notification
 * @param {String} socketId socket id of user to send notification 
 */
function emitUserNotification(socketId) {

    io.to(socketId).emit('newUserNotification')

    console.log("User Notification method emitted")
}

/**
 *  Socket method for new admin notification
 * @param {String} socketId socket id of admin to send notification 
 */
function emitAdminNotification() {

    io.emit('newAdminNotification')
    console.log("Admin Notification method emitted")
}

module.exports = {
    connect,

    emitUserNotification,

    emitAdminNotification
}