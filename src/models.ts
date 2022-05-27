import { Schema } from "mongoose";

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
    }]
});

export const ProfileSchema = new Schema({
    type: String, //Parque, Consumos, Deuda, Averías, Problemas económicos, bi
    id: String,
    description: String
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
    tracks: [{
        type: Schema.Types.ObjectId,
        ref: 'Tracks'
    }],
    status: String
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
    status: String
});

export const IncSchema = new Schema({
    id: String,
    description: String,
    profiles_per_client: [{
        type: Schema.Types.ObjectId,
        ref: 'AssignedProfiles'
    }],
    status: String
});