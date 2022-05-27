"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const getConn_1 = __importDefault(require("./getConn"));
const getModel_1 = __importDefault(require("./getModel"));
const models_1 = require("./models");
const router = (0, express_1.Router)();
const conn = (0, getConn_1.default)('test-clients');
const PROFILE_MODEL = (0, getModel_1.default)('Profiles', models_1.ProfileSchema, conn);
const INC_MODEL = (0, getModel_1.default)('Incidencias', models_1.IncSchema, conn);
const ASSIGNED_PROFILE_MODEL = (0, getModel_1.default)('AssignedProfiles', models_1.AssignedProfileSchema, conn);
const CLIENT_MODEL = (0, getModel_1.default)('Clients', models_1.ClientSchema, conn);
const MESSAGE_MODEL = (0, getModel_1.default)('Messages', models_1.MessageSchema, conn);
const TRACK_MODEL = (0, getModel_1.default)('Tracks', models_1.TrackSchema, conn);
/*PERFILES*/
//Create profile -> OK
router.post('/profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, id, description } = req.body;
    const profile = new PROFILE_MODEL({ type, id, description });
    yield profile.save();
    res.send(204);
}));
//Get profiles -> OK
router.get('/profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PROFILE_MODEL.find()
        .then((profiles) => res.status(200).send(profiles))
        .catch((e) => res.status(500).send('Server error, please retry'));
}));
//Edit profile
router.put('/profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Delete profile
router.delete('/profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
/*INCIDENCIAS*/
//Create INC -> OK
router.post('/incs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, description, profiles } = req.body;
    const inc = new INC_MODEL({ id, description, profiles: [] });
    yield inc.save()
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
    res.send(204);
}));
//Get INCs -> OK
router.get('/incs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        path: 'profiles_per_client',
        populate: [
            { path: 'profiles' },
            { path: 'clients' }
        ]
    };
    yield INC_MODEL.find({}).populate(query)
        .then((incs) => res.status(200).send(incs))
        .catch((e) => res.status(500).send('Server error, please retry'));
}));
//Edit INC
router.put('/incs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Delete INC
router.delete('/incs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
/*ASSIGNED PROFILES*/
//Create assigned profile -> OK
router.post('/incs/:inc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { inc } = req.params;
    const { profiles, personalization } = req.body;
    const profile_ids = [];
    for (let i = 0; i < profiles.length; i++) {
        const [profile_id] = yield PROFILE_MODEL.find({ id: profiles[i] }, '_id');
        if (profile_id === undefined) {
            res.status(400).send(`Profile ${profiles[i]} doesn´t exist`);
            return;
        }
        else {
            profile_ids.push(profile_id._id.toString());
        }
    }
    let profiles_obecjtids = profile_ids.map(s => new mongoose_1.default.Types.ObjectId(s));
    const assigned_profile = new ASSIGNED_PROFILE_MODEL({ profiles: profiles_obecjtids, personalization });
    yield assigned_profile.save();
    yield INC_MODEL.updateOne({ id: inc }, {
        $push: {
            profiles_per_client: assigned_profile._id
        }
    });
    res.status(204);
}));
//Get assigned profiles -> OK
router.get('/incs/:inc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { inc } = req.params;
    const query = {
        path: 'profiles_per_client',
        populate: { path: 'profiles' }
    };
    yield INC_MODEL.find({ id: inc }, 'profiles_per_client').populate(query)
        .then((profiles_per_client) => res.status(200).send(profiles_per_client))
        .catch((e) => res.status(500).send('Server error, please retry'));
}));
//Edit assigned profile
//Delete assigned profile
/*CLIENTES*/
//Get all clients -> OK
router.get('/test-clients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield CLIENT_MODEL.find({}).populate('tracks')
        .then((clients) => res.status(200).send(clients))
        .catch((e) => res.status(500).send('Server error, please retry'));
}));
//Get client by DNI -> OK
router.get('/test-clients/:dni', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dni } = req.params;
    const query = {
        path: 'tracks',
        populate: 'profile'
    };
    yield CLIENT_MODEL.findOne({ dni }).populate(query)
        .then((d) => res.status(200).send(d))
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
}));
//Create client -> OK
router.post('/incs/:inc/:profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { inc, profile } = req.params; //Profile es _id de assigned_profile
    const { dni, telco } = req.body;
    const client = new CLIENT_MODEL({ dni, telco });
    yield client.save();
    yield ASSIGNED_PROFILE_MODEL.updateOne({ _id: profile }, {
        $push: {
            clients: client._id.toString()
        }
    })
        .then((d) => console.log(d))
        .catch((e) => console.log(e));
    res.send(204);
}));
//Edit client
router.put('/test-clients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Delete client
router.delete('/test-clients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
/*TRACKS*/
//Create track -> OK
router.post('/test-clients/:clientid/:profileid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientid, profileid } = req.params;
    const [profile] = yield PROFILE_MODEL.find({ id: profileid })
        .catch((e) => console.log(e));
    const track = new TRACK_MODEL({ profile });
    yield track.save();
    yield CLIENT_MODEL.updateOne({ dni: clientid }, {
        $push: { tracks: track._id.toString() }
    })
        .catch((e) => console.log(e));
}));
//Get all tracks -> OK
router.get('/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield TRACK_MODEL.find().populate('messages')
        .then((d) => res.send(d))
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
}));
//Edit track
router.put('/test-clients/:clientid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Delete track
router.delete('/test-clients/:clientid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
/*MENSAJES*/
//Create msg
router.post('/test-clients/:clientid/:trackid/msgs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientid, trackid } = req.params;
    const { writer, message } = req.body;
    const msg = new MESSAGE_MODEL({ writer, message });
    //await msg.save();
    const query = {
        path: 'tracks',
        populate: 'profile'
    };
    const client = yield CLIENT_MODEL.findOne({ dni: clientid }).populate(query)
        .catch((e) => console.log(e));
    for (let i = 0; i < client.tracks.length; i++) {
        if (client.tracks[i].profile.id === trackid) {
            console.log(client.tracks[i]);
            /*
            console.log(client.tracks[i].profile._id);
            await TRACK_MODEL.updateOne(
                { _id: client.tracks[i].profile._id },
                {
                    $push: { messages: msg._id.toString() }
                }
            )
            .then(() => res.send(204))
            .catch((e: any) => {
                console.log(e);
                res.status(500).send('Server error please retry');
            })
            */
        }
    }
}));
//Get all msg
router.get('/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield MESSAGE_MODEL.find()
        .then((d) => res.status(200).send(d))
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
}));
//Get msg
router.get('/test-clients/:clientid/:trackid/msgs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Edit msg
router.get('/test-clients/:clientid/:trackid/msgs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
//Delete msg
router.delete('/test-clients/:clientid/:trackid/msgs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
}));
exports.default = router;
