import { Router } from 'express';
import { notification } from '../player/notification';
import {checkPerm} from './login';

export default () => {
    const api = Router();

    // /api/notification
    api.get('/', checkPerm, (req, res, next) => {
        notification.addListener(res);
    });
    
    return api;
}