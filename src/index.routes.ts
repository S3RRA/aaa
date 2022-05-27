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

    const profile = new PROFILE_MODEL({type, id, description});

    await profile.save();

    res.send(204);
});
//Get profiles -> OK
router.get('/profiles', async (req: Request, res: Response) => {
    await PROFILE_MODEL.find()
        .then( (profiles: any) => res.status(200).send(profiles))
        .catch( (e: any) => res.status(500).send('Server error, please retry'));
});
//Edit profile
router.put('/profiles', async (req: Request, res: Response) => {

});
//Delete profile
router.delete('/profiles', async (req: Request, res: Response) => {

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
        path: 'profiles_per_client',
        populate: [
            { path: 'profiles'},
            { path: 'clients' }
        ]
    };
    await INC_MODEL.find({}).populate(query)
        .then((incs: any) => res.status(200).send(incs))
        .catch((e: any) => res.status(500).send('Server error, please retry'));

});
//Edit INC
router.put('/incs', async (req: Request, res: Response) => {
    
});
//Delete INC
router.delete('/incs', async (req: Request, res: Response) => {

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

    const assigned_profile: any = new ASSIGNED_PROFILE_MODEL({ profiles: profiles_obecjtids, personalization });
    await assigned_profile.save();

    await INC_MODEL.updateOne(
        { id: inc },
        {
            $push: {
                profiles_per_client: assigned_profile._id 
            }
        }
    )

    res.status(204);
});
//Get assigned profiles -> OK
router.get('/incs/:inc', async (req: Request, res: Response) => {
    const { inc } = req.params;
    const query = {
        path: 'profiles_per_client',
        populate: { path: 'profiles' }
    };
    await INC_MODEL.find({id: inc}, 'profiles_per_client').populate(query)
        .then((profiles_per_client: any) => res.status(200).send(profiles_per_client))
        .catch((e: any) => res.status(500).send('Server error, please retry'));
});
//Edit assigned profile

//Delete assigned profile


/*CLIENTES*/

//Get all clients -> OK
router.get('/test-clients', async (req: Request, res: Response) => {
    await CLIENT_MODEL.find({}).populate('tracks')
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
    const client = new CLIENT_MODEL({ dni, telco });

    await client.save();

    await ASSIGNED_PROFILE_MODEL.updateOne(
        { _id: profile },
        {
            $push: {
                clients: client._id.toString()
            }
        }
    )
    .then((d: any) => console.log(d))
    .catch((e: any) => console.log(e));

    res.send(204);

});
//Edit client
router.put('/test-clients', async (req: Request, res: Response) => {

});
//Delete client
router.delete('/test-clients', async (req: Request, res: Response) => {

});

/*TRACKS*/

//Create track -> OK
router.post('/test-clients/:clientid/:profileid', async (req: Request, res: Response) => {
    const { clientid, profileid } = req.params;

    const [profile] = await PROFILE_MODEL.find({id: profileid})
        .catch((e: any) => console.log(e));

    const track = new TRACK_MODEL({profile});
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
    await TRACK_MODEL.find().populate('messages')
        .then((d: any) => res.send(d))
        .catch((e: any) => {
            console.log(e);
            res.status(500).send('Server error please retry')
        });
});
//Edit track
router.put('/test-clients/:clientid', async (req: Request, res: Response) => {

});
//Delete track
router.delete('/test-clients/:clientid', async (req: Request, res: Response) => {

});


/*MENSAJES*/

//Create msg
router.post('/test-clients/:clientid/:trackid/msgs', async (req: Request, res: Response) => {
    const { clientid, trackid } = req.params;
    const { writer, message } = req.body;

    const msg = new MESSAGE_MODEL({writer, message});

    //await msg.save();

    const query = {
        path: 'tracks',
        populate: 'profile'
    }
    const client = await CLIENT_MODEL.findOne({dni: clientid}).populate(query)
        .catch((e: any) => console.log(e));

    for(let i=0; i<client.tracks.length; i++){
        if(client.tracks[i].profile.id === trackid){
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
});
//Get all msg
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
