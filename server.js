require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const FriendRequest = require("./models/FriendRequest");
const Message = require("./models/Message");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(express.json());


// ===============================
// OTP SYSTEM
// ===============================

function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

const otpStore = new Map();


// ===============================
// SEND OTP
// ===============================

app.post("/api/send-otp", async (req, res) => {
    try {

        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({
                message: "Mobile number is required"
            });
        }

        const otp = generateOTP();

        otpStore.set(mobile, {
            otp: otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        console.log(`OTP for ${mobile}: ${otp}`);

        res.json({
            message: "OTP generated successfully"
        });

    } catch (error) {

        console.log("OTP error:", error);

        res.status(500).json({
            message: "Failed to generate OTP"
        });

    }
});


// ===============================
// VERIFY OTP
// ===============================

app.post("/api/verify-otp", async (req, res) => {
    try {

        const { mobile, otp } = req.body;

        if (!mobile || !otp) {
            return res.status(400).json({
                message: "Mobile number and OTP are required"
            });
        }

        const savedOtp = otpStore.get(mobile);

        if (!savedOtp) {
            return res.status(400).json({
                message: "OTP not found or expired"
            });
        }

        if (Date.now() > savedOtp.expiresAt) {

            otpStore.delete(mobile);

            return res.status(400).json({
                message: "OTP expired"
            });
        }

        if (savedOtp.otp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        // OTP correct hai
        otpStore.set(mobile, {
            verified: true,
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        console.log(`Mobile verified: ${mobile}`);

        res.json({
            message: "OTP verified successfully",
            verified: true
        });

    } catch (error) {

        console.log("OTP verification error:", error);

        res.status(500).json({
            message: "OTP verification failed"
        });

    }
});


// ===============================
// USER REGISTRATION
// ===============================

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            dateOfBirth,
            gender,
            mobile,
            email,
            username,
            password
        } = req.body;


        // Check mobile OTP verification
        const mobileVerification = otpStore.get(mobile);

        if (!mobileVerification || mobileVerification.verified !== true) {

            return res.status(400).json({
                message: "Please verify your mobile number with OTP first."
            });

        }


        // Check existing user
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { mobile: mobile },
                ...(email ? [{ email: email }] : [])
            ]
        });


        if (existingUser) {

            return res.status(400).json({
                message: "Username, mobile or email already registered"
            });

        }


        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create user
        const user = new User({

            name,
            dateOfBirth,
            gender,
            mobile,
            email,
            username,
            password: hashedPassword,

            mobileVerified: true

        });


        await user.save();


        // OTP verification data remove
        otpStore.delete(mobile);


        res.status(201).json({

            message: "Registration successful",

            userId: user._id

        });


    } catch (error) {

        console.log("Registration error:", error);

        res.status(500).json({

            message: "Registration failed"

        });

    }

});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
    try {

        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({
                message: "Username, email/mobile and password are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { username: loginId.toLowerCase() },
                { email: loginId.toLowerCase() },
                { mobile: loginId }
            ]
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username/email/mobile or password"
            });
        }

        if (!user.mobileVerified) {
            return res.status(403).json({
                message: "Please verify your mobile number first"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username/email/mobile or password"
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                mobile: user.mobile,
                email: user.email
            }
        });

    } catch (error) {

        console.log("Login error:", error);

        res.status(500).json({
            message: "Login failed"
        });

    }
});   

// ===============================
// FORGOT USERNAME
// ===============================

app.post("/api/forgot-username", async (req, res) => {

    try {

        const { mobile } = req.body;


        if (!mobile) {

            return res.status(400).json({
                message: "Mobile number is required"
            });

        }


        const user = await User.findOne({
            mobile: mobile
        });


        if (!user) {

            return res.status(404).json({
                message: "No account found with this mobile number"
            });

        }


        res.json({

            username: user.username

        });


    } catch (error) {

        console.log("Forgot username error:", error);

        res.status(500).json({

            message: "Unable to recover username"

        });

    }

});


// ===============================
// FORGOT PASSWORD - SEND OTP
// ===============================

app.post(
    "/api/forgot-password/send-otp",
    async (req, res) => {

        try {

            const { loginId } = req.body;


            if (!loginId) {

                return res.status(400).json({
                    message:
                        "Username, email or mobile is required"
                });

            }


            const user = await User.findOne({
                $or: [
                    {
                        username:
                            loginId.toLowerCase()
                    },
                    {
                        email:
                            loginId.toLowerCase()
                    },
                    {
                        mobile:
                            loginId
                    }
                ]
            });


            if (!user) {

                return res.status(404).json({
                    message:
                        "No account found"
                });

            }


            const otp =
                generateOTP();


            otpStore.set(
                `reset_${user.mobile}`,
                {
                    otp: otp,

                    expiresAt:
                        Date.now() +
                        5 * 60 * 1000
                }
            );


            console.log(
                `Password reset OTP for ${user.mobile}: ${otp}`
            );


            res.json({

                message:
                    "OTP sent successfully"

            });


        } catch (error) {

            console.log(
                "Forgot password OTP error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to send OTP"

            });

        }

    }
);


// ===============================
// FORGOT PASSWORD - VERIFY OTP
// ===============================

app.post(
    "/api/forgot-password/verify-otp",
    async (req, res) => {

        try {

            const {
                loginId,
                otp
            } = req.body;


            if (!loginId || !otp) {

                return res.status(400).json({

                    message:
                        "Login ID and OTP are required"

                });

            }


            const user =
                await User.findOne({
                    $or: [
                        {
                            username:
                                loginId.toLowerCase()
                        },
                        {
                            email:
                                loginId.toLowerCase()
                        },
                        {
                            mobile:
                                loginId
                        }
                    ]
                });


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            const savedOtp =
                otpStore.get(
                    `reset_${user.mobile}`
                );


            if (!savedOtp) {

                return res.status(400).json({

                    message:
                        "OTP not found or expired"

                });

            }


            if (
                Date.now() >
                savedOtp.expiresAt
            ) {

                otpStore.delete(
                    `reset_${user.mobile}`
                );


                return res.status(400).json({

                    message:
                        "OTP expired"

                });

            }


           if (savedOtp.otp !== String(otp).trim()) {

                return res.status(400).json({

                    message:
                        "Invalid OTP"

                });

            }


            otpStore.set(
                `reset_${user.mobile}`,
                {

                    verified: true,

                    expiresAt:
                        Date.now() +
                        10 * 60 * 1000

                }
            );


            res.json({

                message:
                    "OTP verified successfully"

            });


        } catch (error) {

            console.log(
                "Forgot password verify error:",
                error
            );


            res.status(500).json({

                message:
                    "OTP verification failed"

            });

        }

    }
);


// ===============================
// RESET PASSWORD
// ===============================

app.post(
    "/api/forgot-password/reset",
    async (req, res) => {

        try {

            const {
                loginId,
                password
            } = req.body;


            if (!loginId || !password) {

                return res.status(400).json({

                    message:
                        "Login ID and password are required"

                });

            }


            if (password.length < 6) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters"

                });

            }


            const user =
                await User.findOne({
                    $or: [
                        {
                            username:
                                loginId.toLowerCase()
                        },
                        {
                            email:
                                loginId.toLowerCase()
                        },
                        {
                            mobile:
                                loginId
                        }
                    ]
                });


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            const resetData =
                otpStore.get(
                    `reset_${user.mobile}`
                );


            if (
                !resetData ||
                resetData.verified !== true
            ) {

                return res.status(403).json({

                    message:
                        "Please verify OTP first"

                });

            }


            if (
                Date.now() >
                resetData.expiresAt
            ) {

                otpStore.delete(
                    `reset_${user.mobile}`
                );


                return res.status(400).json({

                    message:
                        "Password reset session expired"

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            user.password =
                hashedPassword;


            await user.save();


            otpStore.delete(
                `reset_${user.mobile}`
            );


            res.json({

                message:
                    "Password reset successful"

            });


        } catch (error) {

            console.log(
                "Password reset error:",
                error
            );


            res.status(500).json({

                message:
                    "Password reset failed"

            });

        }

    }
);


// ===============================
// FRIEND REQUEST SYSTEM
// ===============================


// =====================================
// SEND FRIEND REQUEST
// =====================================

app.post("/api/friends/request", async (req, res) => {

    try {

        const { senderId, receiverId } = req.body;


        if (!senderId || !receiverId) {

            return res.status(400).json({
                message: "Sender and receiver are required"
            });

        }


        // Self request check

        if (senderId === receiverId) {

            return res.status(400).json({
                message: "You cannot send request to yourself"
            });

        }


        // Check users

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);


        if (!sender || !receiver) {

            return res.status(404).json({
                message: "User not found"
            });

        }


        // Check existing request

        const existingRequest =
            await FriendRequest.findOne({
                $or: [
                    {
                        sender: senderId,
                        receiver: receiverId
                    },
                    {
                        sender: receiverId,
                        receiver: senderId
                    }
                ]
            });


        if (existingRequest) {

            return res.status(400).json({
                message:
                    "Friend request already exists"
            });

        }


        // Create request

        const friendRequest =
            new FriendRequest({

                sender: senderId,
                receiver: receiverId

            });


        await friendRequest.save();


        res.status(201).json({

            message:
                "Friend request sent successfully",

            requestId:
                friendRequest._id

        });


    } catch (error) {

        console.log(
            "Friend request error:",
            error
        );


        res.status(500).json({

            message:
                "Unable to send friend request"

        });

    }

});


// =====================================
// GET PENDING FRIEND REQUESTS
// =====================================

app.get(
    "/api/friends/requests/:userId",
    async (req, res) => {

        try {

            const { userId } =
                req.params;


            const requests =
                await FriendRequest.find({

                    receiver: userId,

                    status: "pending"

                })
                .populate(
                    "sender",
                    "name username mobile email"
                )
                .sort({
                    createdAt: -1
                });


            res.json(requests);


        } catch (error) {

            console.log(
                "Get friend requests error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to get friend requests"

            });

        }

    }
);


// =====================================
// ACCEPT FRIEND REQUEST
// =====================================

app.post(
    "/api/friends/accept/:requestId",
    async (req, res) => {

        try {

            const { requestId } =
                req.params;


            const request =
                await FriendRequest.findById(
                    requestId
                );


            if (!request) {

                return res.status(404).json({

                    message:
                        "Friend request not found"

                });

            }


            if (
                request.status !==
                "pending"
            ) {

                return res.status(400).json({

                    message:
                        "Friend request is no longer pending"

                });

            }


            request.status =
                "accepted";


            await request.save();


            res.json({

                message:
                    "Friend request accepted"

            });


        } catch (error) {

            console.log(
                "Accept friend request error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to accept friend request"

            });

        }

    }
);


// =====================================
// REJECT FRIEND REQUEST
// =====================================

app.post(
    "/api/friends/reject/:requestId",
    async (req, res) => {

        try {

            const { requestId } =
                req.params;


            const request =
                await FriendRequest.findById(
                    requestId
                );


            if (!request) {

                return res.status(404).json({

                    message:
                        "Friend request not found"

                });

            }


            if (
                request.status !==
                "pending"
            ) {

                return res.status(400).json({

                    message:
                        "Friend request is no longer pending"

                });

            }


            request.status =
                "rejected";


            await request.save();


            res.json({

                message:
                    "Friend request rejected"

            });


        } catch (error) {

            console.log(
                "Reject friend request error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to reject friend request"

            });

        }

    }
);


// =====================================
// UPDATE PROFILE
// =====================================

app.put(
    "/api/profile/update",
    async (req, res) => {

        try {

            const {
                userId,
                name,
                username,
                dateOfBirth,
                gender,
                email,
                profilePicture
            } = req.body;


            // =====================================
            // USER ID
            // =====================================

            if (!userId) {

                return res.status(400).json({

                    message:
                        "User ID is required."

                });

            }


            // =====================================
            // FIND USER
            // =====================================

            const user =
                await User.findById(
                    userId
                );


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found."

                });

            }


            // =====================================
            // NAME
            // =====================================

            if (
                typeof name === "string"
            ) {

                const cleanName =
                    name.trim();


                if (!cleanName) {

                    return res.status(400).json({

                        message:
                            "Name cannot be empty."

                    });

                }


                user.name =
                    cleanName;

            }


            // =====================================
            // USERNAME
            // =====================================

            if (
                typeof username === "string"
            ) {

                const cleanUsername =
                    username
                        .trim()
                        .toLowerCase();


                if (!cleanUsername) {

                    return res.status(400).json({

                        message:
                            "Username cannot be empty."

                    });

                }


                const existingUsername =
                    await User.findOne({

                        username:
                            cleanUsername,

                        _id: {
                            $ne:
                                userId
                        }

                    });


                if (existingUsername) {

                    return res.status(400).json({

                        message:
                            "Username is already taken."

                    });

                }


                user.username =
                    cleanUsername;

            }


            // =====================================
            // DATE OF BIRTH
            // =====================================

            if (
                typeof dateOfBirth === "string"
            ) {

                const cleanDOB =
                    dateOfBirth.trim();


                if (!cleanDOB) {

                    return res.status(400).json({

                        message:
                            "Date of birth cannot be empty."

                    });

                }


                user.dateOfBirth =
                    cleanDOB;

            }


            // =====================================
            // GENDER
            // =====================================

            if (
                typeof gender === "string"
            ) {

                const cleanGender =
                    gender.trim();


                if (!cleanGender) {

                    return res.status(400).json({

                        message:
                            "Gender cannot be empty."

                    });

                }


                if (
                    ![
                        "Male",
                        "Female",
                        "Other"
                    ].includes(
                        cleanGender
                    )
                ) {

                    return res.status(400).json({

                        message:
                            "Invalid gender."

                    });

                }


                user.gender =
                    cleanGender;

            }


            // =====================================
            // EMAIL
            // =====================================

            if (
                typeof email === "string"
            ) {

                const cleanEmail =
                    email
                        .trim()
                        .toLowerCase();


                if (cleanEmail) {

                    const existingEmail =
                        await User.findOne({

                            email:
                                cleanEmail,

                            _id: {
                                $ne:
                                    userId
                            }

                        });


                    if (existingEmail) {

                        return res.status(400).json({

                            message:
                                "Email is already registered."

                        });

                    }

                }


                user.email =
                    cleanEmail;

            }


            // =====================================
            // PROFILE PICTURE
            // =====================================

            if (
                typeof profilePicture === "string"
            ) {

                if (
                    !profilePicture.startsWith(
                        "data:image/"
                    )
                ) {

                    return res.status(400).json({

                        message:
                            "Invalid profile picture."

                    });

                }


                // Maximum approximately 2 MB
                // after compression

                if (
                    profilePicture.length >
                    2 * 1024 * 1024
                ) {

                    return res.status(400).json({

                        message:
                            "Profile picture is too large."

                    });

                }


                user.profilePicture =
                    profilePicture;

            }


            // =====================================
            // SAVE USER
            // =====================================

            await user.save();


            // =====================================
            // RESPONSE
            // =====================================

            res.json({

                message:
                    "Profile updated successfully.",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    username:
                        user.username,

                    dateOfBirth:
                        user.dateOfBirth,

                    gender:
                        user.gender,

                    mobile:
                        user.mobile,

                    email:
                        user.email,

                    profilePicture:
                        user.profilePicture || ""

                }

            });

        } catch (error) {

            console.log(
                "Profile update error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to update profile."

            });

        }

    }
);
// ===============================
// GET ALL USERS
// ===============================

app.get("/api/users", async (req, res) => {

    try {

                const users = await User.find(
            {},
            "name username profilePicture  isOnline lastSeen"
        );

        res.json(users);

    } catch (error) {

        console.log(
            "Get users error:",
            error
        );

        res.status(500).json({

            message:
                "Unable to load users"

        });

    }

});

// =====================================
// GET FRIENDS
// =====================================

app.get(
    "/api/friends/:userId",
    async (req, res) => {

        try {

            const { userId } =
                req.params;


            const connections =
                await FriendRequest.find({

                    status: "accepted",

                    $or: [
                        {
                            sender: userId
                        },
                        {
                            receiver: userId
                        }
                    ]

                })
                .populate(
                    "sender",
                    "name username mobile email"
                )
                .populate(
                    "receiver",
                    "name username mobile email"
                );


            const friends =
                connections.map(
                    (connection) => {

                        if (
                            connection.sender._id.toString() ===
                            userId
                        ) {

                            return connection.receiver;

                        }

                        return connection.sender;

                    }
                );


            res.json(friends);


        } catch (error) {

            console.log(
                "Get friends error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to get friends"

            });

        }

    }
);

// ===============================
// CHECK FRIEND CONNECTION
// ===============================

async function areFriends(userId1, userId2) {

    const connection =
        await FriendRequest.findOne({

            status: "accepted",

            $or: [
                {
                    sender: userId1,
                    receiver: userId2
                },
                {
                    sender: userId2,
                    receiver: userId1
                }
            ]

        });

    return !!connection;
}

// =====================================
// GET CHAT HISTORY
// =====================================

app.get(
    "/api/messages/:userId/:otherUserId",
    async (req, res) => {

        try {

            const {
                userId,
                otherUserId
            } = req.params;


            // Check friendship

            const connected =
                await areFriends(
                    userId,
                    otherUserId
                );


            if (!connected) {

                return res.status(403).json({
                    message:
                        "You can view chat only with accepted friends."
                });

            }


            // Get messages between both users

            const messages =
                await Message.find({

                    $or: [

                        {
                            sender:
                                userId,

                            receiver:
                                otherUserId
                        },

                        {
                            sender:
                                otherUserId,

                            receiver:
                                userId
                        }

                    ]

                })
                .sort({
                    createdAt: 1
                });


            res.json(
                messages
            );


        } catch (error) {

            console.log(
                "Chat history error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to load chat history."

            });

        }

    }
);

// =====================================
// GET UNREAD COUNT BY SENDER
// =====================================

app.get(
    "/api/unread-messages/by-sender/:userId",
    async (req, res) => {

        try {

            const userId =
                req.params.userId;

            const unreadMessages =
                await Message.aggregate([
                    {
                        $match: {
                            receiver:
                                new mongoose.Types.ObjectId(userId),

                            read: false
                        }
                    },

                    {
                        $group: {
                            _id: "$sender",

                            unreadCount: {
                                $sum: 1
                            }
                        }
                    }
                ]);

            res.json(
                unreadMessages
            );

        } catch (error) {

            console.log(
                "Unread count by sender error:",
                error
            );

            res.status(500).json({
                message:
                    "Unable to get unread counts."
            });

        }

    }
);

// =====================================
// MARK MESSAGES AS READ
// =====================================

app.post(
    "/api/messages/read",
    async (req, res) => {

        try {

            const {
                userId,
                senderId
            } = req.body;


            if (!userId || !senderId) {

                return res.status(400).json({
                    message:
                        "User ID and sender ID are required."
                });

            }


            const result =
                await Message.updateMany(

                    {
                        receiver:
                            userId,

                        sender:
                            senderId,

                        read:
                            false
                    },

                    {
                        $set: {
                            read:
                                true
                        }
                    }

                );


            res.json({

                message:
                    "Messages marked as read.",

                modifiedCount:
                    result.modifiedCount

            });


        } catch (error) {

            console.log(
                "Mark messages as read error:",
                error
            );


            res.status(500).json({

                message:
                    "Unable to mark messages as read."

            });

        }

    }
);

// ===============================
// SERVER + SOCKET.IO
// ===============================

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;


// ===============================
// MONGODB CONNECTION
// ===============================

mongoose.connect(process.env.MONGODB_URI)

    .then(() => {

        console.log("MongoDB connected successfully");

    })

    .catch((error) => {

        console.log("MongoDB connection error:", error);

    });


// ===============================
// SERVE CLIENT
// ===============================

app.use(express.static(path.join(__dirname, "client")));


// =====================================
// PRIVATE CHAT - SOCKET.IO
// =====================================

io.on("connection", (socket) => {

    console.log(
        "Client connected:",
        socket.id
    );


    // =====================================
    // JOIN USER ROOM + ONLINE STATUS
    // =====================================

    socket.on(
        "join private chat",
        async (data) => {

            try {

                const userId =
                    data.userId;

                if (!userId) {

                    console.log(
                        "❌ User ID missing"
                    );

                    return;
                }


                const roomName =
                    `user_${userId}`;


                // User ko room me join karo
                socket.join(roomName);


                // Socket ke saath user ID save karo
                socket.userId =
                    userId;


                // =====================================
                // USER ONLINE
                // =====================================

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline: true,
                        lastSeen: null
                    }
                );


                // =====================================
                // ROOM INFORMATION
                // =====================================

                const room =
                    io.sockets.adapter.rooms.get(
                        roomName
                    );


                console.log(
                    "================================"
                );

                console.log(
                    "USER JOINED ROOM"
                );

                console.log(
                    "Socket ID:",
                    socket.id
                );

                console.log(
                    "User ID:",
                    userId
                );

                console.log(
                    "Room:",
                    roomName
                );

                console.log(
                    "Sockets in this room:",
                    room
                        ? [...room]
                        : []
                );

                console.log(
                    "Number of sockets:",
                    room
                        ? room.size
                        : 0
                );

                console.log(
                    "🟢 User is ONLINE"
                );

                console.log(
                    "================================"
                );


            } catch (error) {

                console.log(
                    "Online status error:",
                    error
                );

            }

        }
    );


    // =====================================
    // PRIVATE MESSAGE
    // =====================================

    socket.on(
        "private message",
        async (data) => {

            try {

                const {
                    senderId,
                    receiverId,
                    message
                } = data;


                // =====================================
                // GET SENDER NAME
                // =====================================

                const senderUser =
                    await User.findById(
                        senderId
                    );


                const senderName =
                    senderUser
                        ? senderUser.name
                        : "User";


                console.log(
                    "Private message request:",
                    {
                        senderId,
                        receiverId,
                        message
                    }
                );


                // =====================================
                // BASIC VALIDATION
                // =====================================

                if (
                    !senderId ||
                    !receiverId ||
                    !message ||
                    !message.trim()
                ) {

                    console.log(
                        "Message rejected: Invalid data"
                    );

                    return;
                }


                // =====================================
                // CHECK FRIENDSHIP
                // =====================================

                const connected =
                    await areFriends(
                        senderId,
                        receiverId
                    );


                if (!connected) {

                    console.log(
                        "Message rejected: Users are not friends"
                    );


                    socket.emit(
                        "chat error",
                        {
                            message:
                                "You can chat only with accepted friends."
                        }
                    );


                    return;
                }


                // =====================================
                // SAVE MESSAGE
                // =====================================

                const newMessage =
                    new Message({

                        sender:
                            senderId,

                        receiver:
                            receiverId,

                        message:
                            message.trim(),

                        read:
                            false

                    });


                await newMessage.save();


                console.log(
                    "Message saved in MongoDB"
                );


                // =====================================
                // MESSAGE DATA
                // =====================================

                const messageData = {

                    senderId:
                        senderId,

                    receiverId:
                        receiverId,

                    message:
                        message.trim()

                };


                // =====================================
                // SEND MESSAGE TO RECEIVER
                // =====================================

                const receiverRoom =
                    `user_${receiverId}`;


                const receiverSockets =
                    io.sockets.adapter.rooms.get(
                        receiverRoom
                    );


                console.log(
                    "Receiver room:",
                    receiverRoom
                );


                console.log(
                    "Receiver sockets:",
                    receiverSockets
                        ? [...receiverSockets]
                        : []
                );


                console.log(
                    "Receiver socket count:",
                    receiverSockets
                        ? receiverSockets.size
                        : 0
                );


                if (
                    receiverSockets &&
                    receiverSockets.size > 0
                ) {

                    for (
                        const socketId of receiverSockets
                    ) {

                        console.log(
                            "Sending directly to socket:",
                            socketId
                        );


                        io.to(socketId).emit(
                            "private message",
                            messageData
                        );

                    }

                } else {

                    console.log(
                        "❌ Receiver is not connected"
                    );

                }


                // =====================================
                // SEND NOTIFICATION
                // =====================================

                io.to(
                    `user_${receiverId}`
                ).emit(
                    "new message notification",
                    {
                        senderId:
                            senderId,

                        receiverId:
                            receiverId,

                        senderName:
                            senderName,

                        message:
                            message.trim()
                    }
                );


                // =====================================
                // SEND MESSAGE BACK TO SENDER
                // =====================================

                socket.emit(
                    "private message",
                    messageData
                );


                console.log(
                    "Private message delivered"
                );


            } catch (error) {

                console.log(
                    "Private message error:",
                    error
                );


                socket.emit(
                    "chat error",
                    {
                        message:
                            "Unable to send message."
                    }
                );

            }

        }
    );


    // =====================================
    // USER DISCONNECT / OFFLINE
    // =====================================

    socket.on(
        "disconnect",
        async () => {

            try {

                console.log(
                    "Client disconnected:",
                    socket.id
                );


                const userId =
                    socket.userId;


                if (!userId) {

                    console.log(
                        "No user ID associated with socket."
                    );

                    return;
                }


                // =====================================
                // CHECK OTHER ACTIVE SOCKETS
                // =====================================

                const userRoom =
                    `user_${userId}`;


                const room =
                    io.sockets.adapter.rooms.get(
                        userRoom
                    );


                // अगर user की दूसरी tab/window
                // अभी भी connected है,
                // तो user को offline मत करो।

                if (
                    room &&
                    room.size > 0
                ) {

                    console.log(
                        "User still has active connection."
                    );

                    console.log(
                        "🟢 User remains ONLINE:",
                        userId
                    );

                    return;
                }


                // =====================================
                // USER OFFLINE
                // =====================================

                await User.findByIdAndUpdate(
                    userId,
                    {
                        isOnline:
                            false,

                        lastSeen:
                            new Date()
                    }
                );


                console.log(
                    "⚫ User is OFFLINE:",
                    userId
                );


                console.log(
                    "Last seen:",
                    new Date()
                );


            } catch (error) {

                console.log(
                    "Offline status error:",
                    error
                );

            }

        }
    );

});


// ===============================
// START SERVER
// ===============================

server.listen(PORT, "0.0.0.0", () => {

    console.log(`Server is running on port ${PORT}`);

});