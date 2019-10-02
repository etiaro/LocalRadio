import { Router } from 'express';
import { notification } from '../player/notification';
import {checkPerm} from './login';

export default () => {
    const api = Router();

    // /api/notification
    api.post('/', checkPerm, (req, res, next) => {
        notification.addListener(res, req.body.id);
    });
    
    return api;
}