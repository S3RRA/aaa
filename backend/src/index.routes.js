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
    const profile = new PROFILE_MODEL({ type, id, description, status: '' });
    yield profile.save();
    res.send(204);
}));
//Get profiles -> OK
router.get('/profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield PROFILE_MODEL.find()
        .then((profiles) => res.status(200).send(profiles))
        .catch((e) => res.status(500).send('Server error, please retry'));
}));
//Edit profile -> OK
router.put('/profiles/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield PROFILE_MODEL.findOneAndUpdate({ id }, req.body, { new: true })
        .then((d) => {
        console.log(d);
        res.sendStatus(204);
    })
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
//Delete profile -> OK
router.delete('/profiles/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield PROFILE_MODEL.deleteOne({ id })
        .then(() => res.sendStatus(205))
        .catch((e) => {
        console.log(e);
        res.sendStatus(500).send('Server error please retry.');
    });
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
        path: 'assigned_profiles',
        populate: [
            { path: 'profiles' },
            {
                path: 'clients',
                populate: [
                    {
                        path: 'tracks',
                        populate: [
                            { path: 'messages' },
                            { path: 'profile' }
                        ]
                    },
                    {
                        path: 'profiles',
                        select: { id: 1, _id: 0 },
                        populate: {
                            path: 'profile',
                            select: { id: 1, _id: 0 }
                        }
                    }
                ]
            }
        ]
    };
    yield INC_MODEL.find({}).populate(query)
        .then((incs) => res.status(200).send(incs))
        .catch((e) => res.status(500).send(e + 'Server error, please retry.'));
}));
//Edit INC -> OK
router.put('/incs/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield INC_MODEL.findOneAndUpdate({ id }, req.body)
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
//Delete INC -> OK
router.delete('/incs/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield INC_MODEL.deleteOne({ id })
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
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
    const assigned_profile = new ASSIGNED_PROFILE_MODEL({ profiles: profiles_obecjtids, personalization, status: 'Not started' });
    yield assigned_profile.save();
    yield INC_MODEL.updateOne({ id: inc }, {
        $push: {
            assigned_profiles: assigned_profile._id
        }
    });
    res.status(204);
}));
//Get assigned profiles -> OK
router.get('/incs/:inc', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { inc } = req.params;
    const query = {
        path: 'assigned_profiles',
        populate: { path: 'profiles' }
    };
    yield INC_MODEL.find({ id: inc }, 'assigned_profiles').populate(query)
        .then((profiles_per_client) => res.status(200).send(profiles_per_client))
        .catch((e) => { console.log(e); res.status(500).send('Server error, please retry'); });
}));
//Edit assigned profile -> OK
router.put('/incs/:incid/:assigned_profileid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { incid, assigned_profileid } = req.params; //assigned_profileid es el mongo _id
    yield ASSIGNED_PROFILE_MODEL.findOneAndUpdate({ _id: assigned_profileid }, req.body)
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
//Delete assigned profile -> OK
router.delete('/incs/:incid/:assigned_profileid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { assigned_profileid } = req.params;
    yield ASSIGNED_PROFILE_MODEL.deleteOne({ _id: assigned_profileid })
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
/*CLIENTES*/
//Get all clients with assigned_profile
router.get('/test-clients/assigned_profiles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield CLIENT_MODEL.aggregate([
        {
            $lookup: {
                'from': ASSIGNED_PROFILE_MODEL.collection.name,
                'localField': '_id',
                'foreignField': 'clients',
                'as': 'assigned_profiles'
            },
        }
    ])
        .then((clients) => __awaiter(void 0, void 0, void 0, function* () {
        const profiles = yield PROFILE_MODEL.find({}).catch((e) => console.log(e));
        const profile_ids = profiles.map((profile) => profile._id.toString());
        for (let i = 0; i < clients.length; i++) {
            for (let j = 0; j < clients[i].assigned_profiles.length; j++) {
                const assigned_profiles = [];
                for (let k = 0; k < clients[i].assigned_profiles[j].profiles.length; k++) {
                    if (profile_ids.includes(clients[i].assigned_profiles[j].profiles[k].toString())) {
                        const profile_index = profile_ids.indexOf(clients[i].assigned_profiles[j].profiles[k].toString());
                        assigned_profiles.push({ id: profiles[profile_index].id, description: profiles[profile_index].description });
                    }
                }
                clients[i].assigned_profiles[j].profiles = assigned_profiles;
            }
        }
        res.status(200).send(clients);
    }))
        .catch((e) => { console.log(e); res.status(500).send('Server error, please retry'); });
}));
//Get all clients -> OK
router.get('/test-clients', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield CLIENT_MODEL.find({}).populate([
        { path: 'tracks' },
        {
            path: 'profiles',
            select: { id: 1, _id: 0 },
            populate: {
                path: 'profile',
                select: { id: 1, _id: 0 }
            }
        }
    ])
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
    let assigned_profile;
    yield ASSIGNED_PROFILE_MODEL.find({ _id: profile })
        .then((d) => assigned_profile = d[0])
        .catch((e) => console.log(e));
    console.log(assigned_profile);
    const client_profiles = [];
    for (let profile of assigned_profile.profiles) {
        client_profiles.push({
            profile: profile._id.toString(),
            status: 'Not started'
        });
    }
    const client = new CLIENT_MODEL({ dni, telco, status: 'Not started', profiles: client_profiles });
    yield client.save();
    yield ASSIGNED_PROFILE_MODEL.updateOne({ _id: profile }, {
        $push: {
            clients: client._id.toString()
        }
    }, {
        upsert: false
    })
        .then((d) => console.log(d))
        .catch((e) => console.log(e));
    res.send(204);
}));
//Edit client -> OK
router.put('/test-clients/:dni', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dni } = req.params;
    yield CLIENT_MODEL.findOneAndUpdate({ dni }, req.body)
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
//Delete client
router.delete('/test-clients/:  dni', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dni } = req.params;
    yield CLIENT_MODEL.deleteOne({ dni })
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
/*TRACKS*/
//Create track -> OK
router.post('/test-clients/:clientid/:profileid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientid, profileid } = req.params;
    const { title, description } = req.body;
    const [profile] = yield PROFILE_MODEL.find({ id: profileid })
        .catch((e) => console.log(e));
    const track = new TRACK_MODEL({
        title,
        description,
        profile,
        status: 'open'
    });
    yield track.save();
    yield CLIENT_MODEL.updateOne({ dni: clientid }, {
        $push: { tracks: track._id.toString() }
    })
        .catch((e) => console.log(e));
}));
//Get all tracks -> OK
router.get('/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield TRACK_MODEL.find().populate('messages profile')
        .then((d) => res.send(d))
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
}));
//Edit track -> OK
router.put('/test-clients/tracks/:trackid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { trackid } = req.params;
    yield TRACK_MODEL.findOneAndUpdate({ _id: trackid }, req.body)
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
//Delete track -> OK
router.delete('/test-clients/tracks/:trackid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientid, trackid } = req.params;
    yield TRACK_MODEL.deleteOne({ _id: trackid })
        .then(() => res.sendStatus(205))
        .catch(() => res.sendStatus(500).send('Server error please retry.'));
}));
/*MENSAJES*/
//Create msg -> OK
router.post('/test-clients/:clientid/:trackid/msgs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientid, trackid } = req.params;
    const { writer, message } = req.body;
    const msg = new MESSAGE_MODEL({ writer, message });
    yield msg.save();
    yield TRACK_MODEL.updateOne({ _id: trackid }, {
        $push: { messages: msg._id.toString() }
    })
        .then((d) => { console.log(d); res.send(204); })
        .catch((e) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
}));
//Get all msg -> OK
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
