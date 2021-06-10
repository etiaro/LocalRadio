import { Router } from 'express';
import { notification } from '../player/notification';
import { checkLogged } from './login';

export default () => {
  const api = Router();

  // /api/notification
  api.post('/', checkLogged, (req, res) => {
    notification.addListener(res, req.body.id, req.userInfo.isAdmin);
  });

  return api;
};
