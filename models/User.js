const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        gender: {
            type: String,
            required: true,
            enum: [
                "Male",
                "Female",
                "Other"
            ]
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        },

        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        mobileVerified: {
            type: Boolean,
            default: false
        },

        // =====================================
        // ONLINE / OFFLINE STATUS
        // =====================================

        isOnline: {
            type: Boolean,
            default: false
        },

        lastSeen: {
            type: Date,
            default: null
        },

        // =====================================
        // PROFILE PICTURE
        // =====================================

        profilePicture: {
            type: String,
            default: ""
        }
    },

    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "User",
        userSchema
    );