import { Router } from 'express';
import request from 'request';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import { database } from '../database/database';
import cfg from '../config/general';

function validate(req, res, next) {
  if (cfg.demo) {
    req.userInfo = {};
    req.userInfo.isAdmin = true;
    req.userInfo.id = '1';
    req.userInfo.demo = 1;
    next();
    return;
  }
  jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), (err, decoded) => {
    if (err) {
      if (!cfg.useFacebook) {
        database.getIPUser(req.connection.remoteAddress).then((result) => {
          req.userInfo = result;
          req.userInfo = { isAdmin: false, loggedIn: true };
          next();
        });
      } else res.status(500).send({ message: err.message, data: null });
    } else if (!cfg.useFacebook) {
      req.userInfo = decoded.userInfo;
      next();
    } else {
      database.getUser(decoded.userInfo.id).then((result) => {
        req.userInfo = decoded.userInfo;
        req.userInfo.isAdmin = result.isAdmin;
        next();
      });
    }
  });
}

export const checkAdmin = (req, res, next) => {
  if (cfg.demo) {
    req.userInfo = {};
    req.userInfo.isAdmin = true;
    req.userInfo.id = '1';
    req.userInfo.demo = 1;
    next();
    return;
  }
  jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), (err, decoded) => {
    if (err) {
      if (!cfg.useFacebook) {
        res.status(500).send({ message: "You're not logged in!", data: null });
      }
      res.status(500).send({ message: err.message, data: null });
    }
    if (!cfg.useFacebook) {
      req.userInfo = decoded.userInfo;
      if (!req.userInfo.isAdmin) { // HERE IS THE DIFFERENCE TO VALIDATE!
        res.status(500).send({ message: "You're not an admin!", data: null });
      }
      next();
    } else {
      database.getUser(decoded.userInfo.id).then((result) => {
        req.userInfo = decoded.userInfo;
        req.userInfo.isAdmin = result.isAdmin;
        if (!req.userInfo.isAdmin) { // HERE IS THE DIFFERENCE TO VALIDATE!
          res.status(500).send({ message: "You're not an admin!", data: null });
        } else { next(); }
      });
    }
  });
};
export const checkLogged = (req, res, next) => {
  if (cfg.demo) {
    req.userInfo = {};
    req.userInfo.isAdmin = true;
    req.userInfo.id = '1';
    req.userInfo.demo = 1;
    next();
    return;
  }
  jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), (err, decoded) => {
    if (err) {
      if (!cfg.useFacebook) {
        database.getIPUser(req.connection.remoteAddress).then((result) => {
          req.userInfo = result;
          req.userInfo.isAdmin = false;
          req.userInfo.loggedIn = true;
          next();
        });
      } else res.status(500).send({ message: err.message, data: null });
    } else if (!cfg.useFacebook) {
      req.userInfo = decoded.userInfo;
      next();
    } else {
      database.getUser(decoded.userInfo.id).then((result) => {
        req.userInfo = decoded.userInfo;
        req.userInfo.isAdmin = result.isAdmin;
        next();
      });
    }
  });
};

export default () => {
  const api = Router();

  // /api/login
  api.post('/', (req, res) => {
    if (req.body.accessToken) {
      request(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${req.body.accessToken}`, { json: true }, (err, res2, body) => {
        if (err || !body.id) {
          console.log(err);
          res.status(500).send({ err: `bad token ${err}` });
        } else {
          database.updateUser(body);
          body.loggedIn = true;
          database.getUser(body.id).then((result) => {
            if (result.isAdmin) body.isAdmin = true;
            const token = jwt.sign({ id: body.id, userInfo: body }, req.app.get('secretKey'), { expiresIn: '15m' });
            res.status(200).send({ token });
          });
        }
      });
    } else if (req.body.password === `${crypto.MD5(cfg.password)}` && !cfg.useFacebook) {
      database.getIPUser(req.connection.remoteAddress).then((result) => {
        result.loggedIn = true;
        result.isAdmin = true;
        const token = jwt.sign({ id: result.id, userInfo: result }, req.app.get('secretKey'), { expiresIn: '15m' });
        res.status(200).send({ token });
      });
    } else {
      res.status(500).send(req.body);
    }
  });

  api.post('/data/', validate, (req, res) => {
    const data = req.userInfo;
    data.useFacebook = cfg.useFacebook;
    return res.status(200).send(data);
  });

  return api;
};
