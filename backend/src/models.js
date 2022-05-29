"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncSchema = exports.AssignedProfileSchema = exports.ClientSchema = exports.ProfileSchema = exports.TrackSchema = exports.MessageSchema = void 0;
const mongoose_1 = require("mongoose");
exports.MessageSchema = new mongoose_1.Schema({
    writer: String,
    message: String
});
exports.TrackSchema = new mongoose_1.Schema({
    profile: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Profiles'
    },
    messages: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Messages'
        }],
    status: String
});
exports.ProfileSchema = new mongoose_1.Schema({
    type: String,
    id: String,
    description: String,
    status: String
});
exports.ClientSchema = new mongoose_1.Schema({
    dni: String,
    telco: {
        party_id: String,
        identities: {
            ppal_phone: String,
            mobile_phones: [String],
            iptv: String,
            aditional_identities: [String]
        }
    },
    tracks: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Tracks'
        }],
    status: String
});
exports.AssignedProfileSchema = new mongoose_1.Schema({
    profiles: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Profiles'
        }],
    clients: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Clients'
        }],
    personalization: [String],
    project: String,
    status: String,
    comments: [{
            writer: String,
            comment: String
        }]
});
exports.IncSchema = new mongoose_1.Schema({
    id: String,
    description: String,
    assigned_profiles: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'AssignedProfiles'
        }],
    status: String
});
