import { Router } from 'express';
import {checkPerm} from './login';
import {database} from '../database/database';

export default () => {
    const api = Router();

    // /api/settings
    api.get('/schedule', checkPerm, (req, res, next) => {
        database.getAmplifierTimeSchedule((res)=>{
            res.status(200).send(res);
        });
    });
    api.post('/schedule', checkPerm, (req, res, next) => {
        database.setAmplifierTimeSchedule(req.body.schedule, ()=>{
            res.status(200).send({msg: "query accepted"});
        })
    });

    return api;
}