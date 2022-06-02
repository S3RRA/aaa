import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import getConn from "./getConn";
import getModel from "./getModel";
import { AssignedProfileSchema, ClientSchema, IncSchema, MessageSchema, ProfileSchema, TrackSchema } from "./models";

const router = Router();

const conn = getConn('test-clients');

const PROFILE_MODEL = getModel('Profiles', ProfileSchema, conn);
const INC_MODEL = getModel('Incidencias', IncSchema, conn);
const ASSIGNED_PROFILE_MODEL = getModel('AssignedProfiles', AssignedProfileSchema, conn);
const CLIENT_MODEL = getModel('Clients', ClientSchema, conn);
const MESSAGE_MODEL = getModel('Messages', MessageSchema, conn);
const TRACK_MODEL = getModel('Tracks', TrackSchema, conn);

/*PERFILES*/

//Create profile -> OK
router.post('/profiles', async (req: any, res: any) => {
    const { type, id , description } = req.body;

    const profile = new PROFILE_MODEL({type, id, description, status: ''});

    await profile.save();

    res.send(204);
});
//Get profiles -> OK
router.get('/profiles', async (req: Request, res: Response) => {
    await PROFILE_MODEL.find()
        .then( (profiles: any) => res.status(200).send(profiles))
        .catch( (e: any) => res.status(500).send('Server error, please retry'));
});
//Edit profile -> OK
router.put('/profiles/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await PROFILE_MODEL.findOneAndUpdate({ id }, req.body, { new: true })
        .then((d: any) => {
            console.log(d);
            res.sendStatus(204);
        })
        .catch(()=>res.sendStatus(500).send('Server error please retry.'));
});
//Delete profile -> OK
router.delete('/profiles/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await PROFILE_MODEL.deleteOne({id})
        .then(()=>res.sendStatus(205))
        .catch((e:any)=>{
            console.log(e);
            res.sendStatus(500).send('Server error please retry.');
        });
});

/*INCIDENCIAS*/

//Create INC -> OK
router.post('/incs', async (req: Request, res: Response) => {
    const { id, description, profiles } = req.body;

    const inc = new INC_MODEL({ id, description, profiles: [] });

    await inc.save()
        .catch( (e: any) => {
            console.log(e);
            res.status(500).send('Server error please retry')
        })

    res.send(204)

});
//Get INCs -> OK
router.get('/incs', async (req: Request, res: Response) => {
    const query = {
        path: 'assigned_profiles',
        populate: [
            { path: 'profiles'},
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
    await INC_MODEL.find({}).populate(query)
        .then((incs: any) => res.status(200).send(incs))
        .catch((e: any) => res.status(500).send(e + 'Server error, please retry.'));

});
//Edit INC -> OK
router.put('/incs/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await INC_MODEL.findOneAndUpdate({ id }, req.body)
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});
//Delete INC -> OK
router.delete('/incs/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    await INC_MODEL.deleteOne({id})
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});

/*ASSIGNED PROFILES*/

//Create assigned profile -> OK
router.post('/incs/:inc', async (req: Request, res: Response) => {
    const { inc } = req.params;
    const { profiles, personalization } = req.body;

    const profile_ids = [];
    for(let i=0; i<profiles.length; i++){
        const [profile_id] = await PROFILE_MODEL.find({id: profiles[i]}, '_id');
        if(profile_id === undefined){
            res.status(400).send(`Profile ${ profiles[i] } doesn´t exist`);
            return;
        } else {
            profile_ids.push(profile_id._id.toString());
        }
    }

    let profiles_obecjtids = profile_ids.map(s => new mongoose.Types.ObjectId(s));   

    const assigned_profile: any = new ASSIGNED_PROFILE_MODEL({ profiles: profiles_obecjtids, personalization, status: 'Not started' });
    await assigned_profile.save();

    await INC_MODEL.updateOne(
        { id: inc },
        {
            $push: {
                assigned_profiles: assigned_profile._id 
            }
        }
    )

    res.status(204);
});
//Get assigned profiles -> OK
router.get('/incs/:inc', async (req: Request, res: Response) => {
    const { inc } = req.params;
    const query = {
        path: 'assigned_profiles',
        populate: { path: 'profiles' }
    };
    await INC_MODEL.find({id: inc}, 'assigned_profiles').populate(query)
        .then((profiles_per_client: any) => res.status(200).send(profiles_per_client))
        .catch((e: any) =>{ console.log(e);res.status(500).send('Server error, please retry');});
});    
//Edit assigned profile -> OK
router.put('/incs/:incid/:assigned_profileid', async (req: Request, res: Response) => {
    const { incid, assigned_profileid } = req.params; //assigned_profileid es el mongo _id
    await ASSIGNED_PROFILE_MODEL.findOneAndUpdate({_id: assigned_profileid}, req.body)
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});
//Delete assigned profile -> OK
router.delete('/incs/:incid/:assigned_profileid', async (req: Request, res: Response) => {
    const { assigned_profileid } = req.params;
    await ASSIGNED_PROFILE_MODEL.deleteOne({_id: assigned_profileid})
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});

/*CLIENTES*/

//Get all clients with assigned_profile
router.get('/test-clients/assigned_profiles', async(req: Request, res: Response) => {
    await CLIENT_MODEL.aggregate([
        {
            $lookup: {
                'from': ASSIGNED_PROFILE_MODEL.collection.name,
                'localField': '_id',
                'foreignField': 'clients',
                'as': 'assigned_profiles'
            },
        } 
    ])
    .then(async (clients: any) => {
        const profiles = await PROFILE_MODEL.find({}).catch((e: any)=> console.log(e));
        const profile_ids = profiles.map((profile: any) => profile._id.toString());
        for(let i=0; i<clients.length; i++){
            for(let j=0; j<clients[i].assigned_profiles.length; j++){
                const assigned_profiles = [];
                for(let k=0; k<clients[i].assigned_profiles[j].profiles.length; k++){
                    if(profile_ids.includes(clients[i].assigned_profiles[j].profiles[k].toString())){
                        const profile_index = profile_ids.indexOf(clients[i].assigned_profiles[j].profiles[k].toString());
                        assigned_profiles.push({id: profiles[profile_index].id, description: profiles[profile_index].description});
                    }
                }
                clients[i].assigned_profiles[j].profiles = assigned_profiles;
            }   
        }
        res.status(200).send(clients);
    })
    .catch((e: any) => { console.log(e); res.status(500).send('Server error, please retry') });
});
//Get all clients -> OK
router.get('/test-clients', async (req: Request, res: Response) => {
    await CLIENT_MODEL.find({}).populate([
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
        .then((clients: any) => res.status(200).send(clients))
        .catch((e: any) => res.status(500).send('Server error, please retry'));
});
//Get client by DNI -> OK
router.get('/test-clients/:dni', async (req: Request, res:Response) => {
    const { dni } = req.params;
    const query = {
        path: 'tracks',
        populate: 'profile'
    };
    await CLIENT_MODEL.findOne({dni}).populate(query)
        .then((d: any) => res.status(200).send(d))
        .catch((e: any) => {
            console.log(e);
            res.status(500).send('Server error please retry')
        });
});
//Create client -> OK
router.post('/incs/:inc/:profile', async (req: Request, res: Response) => {
    const { inc, profile } = req.params; //Profile es _id de assigned_profile
    const { dni, telco } = req.body;

    let assigned_profile: any;

    await ASSIGNED_PROFILE_MODEL.find({_id: profile})
        .then((d: any) => assigned_profile = d[0])
        .catch((e: any) => console.log(e));

    const client_profiles = [];
    for(let profile of assigned_profile.profiles){
        client_profiles.push({
            profile: profile._id.toString(),
            status: 'Not started'
        });
    }

    const client = new CLIENT_MODEL({ dni, telco, status: 'Not started', profiles: client_profiles });
    await client.save();

    await ASSIGNED_PROFILE_MODEL.updateOne(
        { _id: profile },
        {
            $push: {
                clients: client._id.toString()
            }
        },
        {
            upsert: false
        }
    )
    .then((d: any) => console.log(d))
    .catch((e: any) => console.log(e));


    res.send(204);

});
//Edit client -> OK --> REPASAR
router.put('/test-clients/:dni', async (req: Request, res: Response) => {
    const { dni } = req.params;
    await CLIENT_MODEL.findOneAndUpdate({dni}, req.body)
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});
//Delete client
router.delete('/test-clients/:  dni', async (req: Request, res: Response) => {
    const { dni } = req.params;
    await CLIENT_MODEL.deleteOne({dni})
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});

/*TRACKS*/

//Create track -> OK
router.post('/test-clients/:clientid/:profileid', async (req: Request, res: Response) => {
    const { clientid, profileid } = req.params;
    const { title, description } = req.body;

    const [profile] = await PROFILE_MODEL.find({id: profileid})
        .catch((e: any) => console.log(e));

    const track = new TRACK_MODEL({
        title,
        description,
        profile,
        status: 'open'
    });
    await track.save();

    await CLIENT_MODEL.updateOne(
            { dni: clientid },
            {
                $push: { tracks: track._id.toString() }
            }
        )
        .catch((e: any) => console.log(e));

});
//Get all tracks -> OK
router.get('/tracks', async (req: Request, res: Response) => {
    await TRACK_MODEL.find().populate('messages profile')
        .then((d: any) => res.send(d))
        .catch((e: any) => {
            console.log(e);
            res.status(500).send('Server error please retry')
        });
});
//Edit track -> OK
router.put('/test-clients/tracks/:trackid', async (req: Request, res: Response) => {
    const { trackid } = req.params;
    await TRACK_MODEL.findOneAndUpdate({_id: trackid}, req.body)
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))

});
//Delete track -> OK
router.delete('/test-clients/tracks/:trackid', async (req: Request, res: Response) => {
    const { clientid, trackid } = req.params;
    await TRACK_MODEL.deleteOne({_id: trackid})
        .then(()=>res.sendStatus(205))
        .catch(()=>res.sendStatus(500).send('Server error please retry.'))
});


/*MENSAJES*/

//Create msg -> OK
router.post('/test-clients/:clientid/:trackid/msgs', async (req: Request, res: Response) => {

    const { clientid, trackid } = req.params;
    const { writer, message } = req.body;

    const msg = new MESSAGE_MODEL({writer, message});

    await msg.save();

    await TRACK_MODEL.updateOne(
        { _id: trackid },
        {
            $push: { messages: msg._id.toString() }
        }
    )
    .then((d: any) => {console.log(d);res.send(204);})
    .catch((e: any) => {
        console.log(e);
        res.status(500).send('Server error please retry');
    });
});
//Get all msg -> OK
router.get('/messages', async (req: Request, res: Response) => {
    await MESSAGE_MODEL.find()
        .then((d: any) => res.status(200).send(d))
        .catch((e: any) => {
            console.log(e);
            res.status(500).send('Server error please retry');
        });
});
//Get msg
router.get('/test-clients/:clientid/:trackid/msgs', async (req: Request, res: Response) => {

});
//Edit msg
router.get('/test-clients/:clientid/:trackid/msgs', async (req: Request, res: Response) => {

});
//Delete msg
router.delete('/test-clients/:clientid/:trackid/msgs', async (req: Request, res: Response) => {

});

export default router;
