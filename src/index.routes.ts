import { Request, Response, Router } from "express";
import getConn from "./getConn";
import getModel from "./getModel";
import { AssignedProfileSchema, ClientSchema, IncSchema, MessageSchema, ProfileSchema, TrackSchema } from "./models";

const router = Router();

const conn = getConn('test-clients');

const PROFILE_MODEL = getModel('Profiles', ProfileSchema, conn);
const INC_MODEL = getModel('Incidencias', IncSchema, conn);
const ASSIGNED_PROFILE_MODEL = getModel('AssignedProfiles', AssignedProfileSchema, conn);
const CLIENT_MODEL = getModel('Clients', ClientSchema, conn);
const TRACKS_MODEL = getModel('Tracks', TrackSchema, conn);
const MESSAGE_MODEL = getModel('Messages', MessageSchema, conn);

/*PERFILES*/

//Create profile
router.post('/profile', async (req: Request, res: Response) => {
    const { type, id , description } = req.body;

    const profile = new PROFILE_MODEL({type, id, description});

    await profile.save();

    res.send(204);
});
//Get profiles
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

//Create INC
router.post('/incs', async (req: Request, res: Response) => {
    const { id, description } = req.body;

    const inc = new INC_MODEL({ id, description, profiles: [] });

    await inc.save();

    res.status(204);

});
//Get INCs
router.get('/incs', async (req: Request, res: Response) => {
    await INC_MODEL.find({})   
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

//Create assigned profile
router.post('/incs/:inc', async (req: Request, res: Response) => {
    const { inc } = req.params;
    const { profiles, personalization } = req.body;

    const profile_ids = [];
    for(let i=0; i<profiles.length; i++){
        const profile_id = await PROFILE_MODEL.find({id: profiles[i]}, '_id');
        profile_ids.push(profile_id);
    }

    const assigned_profile: any = new ASSIGNED_PROFILE_MODEL({ profiles: profile_ids, personalization });
    await assigned_profile.save();

    await INC_MODEL.update(
        { id: inc },
        {
            $push: {
                profiles_per_client: assigned_profile._id 
            }
        }
    )

    res.status(204);
});
//Get assigned profiles
router.get('/incs/:inc', async (req: Request, res: Response) => {
    const { inc } = req.params;
    await INC_MODEL.find({id: inc}, 'profiles_per_client').populate('profiles_per_client')
        .then((profiles_per_client: any) => res.status(200).send(profiles_per_client))
        .catch((e: any) => res.status(500).send('Server error, please retry'));
});
//Edit assigned profile

//Delete assigned profile


/*CLIENTES*/

//Get all clients
router.get('/test-clients', async (req: Request, res: Response) => {
    await CLIENT_MODEL.find({}).populate('tracks')
        .then((clients: any) => res.status(200).send(clients))
        .catch((e: any) => res.status(500).send('Server error, please retry'));
});
//Create client
router.post('/incs/:inc/:profile', async (req: Request, res: Response) => {
    const { inc, profile } = req.params; //Profile es _id de assigned_profile
    const { dni, telco } = req.body;
    const client = new CLIENT_MODEL({ dni, telco });
    await client.save();

    await ASSIGNED_PROFILE_MODEL.update(
        { _id: profile },
        {
            $push: {
                clients: client.id
            }
        }
    )
});
//Get clients
router.get('/test-clients', async (req: Request, res: Response) => {

});
//Edit client
router.put('/test-clients', async (req: Request, res: Response) => {

});
//Delete client
router.delete('/test-clients', async (req: Request, res: Response) => {

});

/*TRACKS*/

//Create track
router.post('/test-clients/:clientid', async (req: Request, res: Response) => {

});
//Get tracks
router.get('/test-clients/:clientid', async (req: Request, res: Response) => {

});
//Edit track
router.put('/test-clients/:clientid', async (req: Request, res: Response) => {

});
//Delete track
router.delete('/test-clients/:clientid', async (req: Request, res: Response) => {

});


/*MENSAJES*/

//Create msg
router.post('/test-clients/:clientid/:trackid', async (req: Request, res: Response) => {

});
//Get msg
router.get('/test-clients/:clientid/:trackid', async (req: Request, res: Response) => {

});
//Edit msg
router.get('/test-clients/:clientid/:trackid', async (req: Request, res: Response) => {

});
//Delete msg
router.delete('/test-clients/:clientid/:trackid', async (req: Request, res: Response) => {

});
export default router;
