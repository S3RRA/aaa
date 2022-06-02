import { Schema, SchemaTypes } from "mongoose";

export const MessageSchema = new Schema({
    writer: String,
    message: String
});

export const TrackSchema = new Schema({
    profile: {
        type: Schema.Types.ObjectId,
        ref: 'Profiles'
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Messages'
    }],
    title: String,
    description: String,
    status: String //Not started,In progress,Bug,Finished
});

export const ProfileSchema = new Schema({
    type: String, //Parque, Consumos, Deuda, Averías, Problemas económicos, bi
    id: String,
    description: String,
    status: String
});

export const ClientSchema = new Schema({
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
    profiles:[{
        profile: {
            type: Schema.Types.ObjectId,
            ref: 'Profiles'
        },
        status: String //No viable, Not started, Track opened, Completed
    }],
    tracks: [{
        type: Schema.Types.ObjectId,
        ref: 'Tracks'
    }],
});

export const AssignedProfileSchema = new Schema({
    profiles: [{
        type: Schema.Types.ObjectId,
        ref: 'Profiles'
    }],
    clients: [{
        type: Schema.Types.ObjectId,
        ref: 'Clients'
    }],
    personalization: [String],
    project: String,
    status: String,
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Messages'
    }]
});

export const IncSchema = new Schema({
    id: String,
    description: String,
    assigned_profiles: [{
        type: Schema.Types.ObjectId,
        ref: 'AssignedProfiles'
    }],
    status: String
});