import { Router } from 'express';
import request from 'request';
import jwt from 'jsonwebtoken';
import {database} from '../database/database';

function validate(req, res, next){
    jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), function(err, decoded) {
        if (err) {
            return res.status(500).send({message: err.message, data:null});
        }else{
            database.getUser(decoded.userInfo.id,(result)=>{
                req.userInfo = decoded.userInfo;
                req.userInfo.isAdmin = result.isAdmin;
                next();
            });
        }
      });
}



export const checkPerm = (req, res, next)=>{
    jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), function(err, decoded) {
        if (err) {
            return res.status(500).send({message: err.message, data:null});
        }else{
            database.getUser(decoded.userInfo.id,(result)=>{
                req.userInfo = decoded.userInfo;
                req.userInfo.isAdmin = result.isAdmin;
                if(!req.userInfo.isAdmin)                   //HERE IS THE DIFFERENCE TO VALIDATE!
                    return res.status(500).send({message: err.message, data:null});
                next();
            });
        }
      });
};

export default () => {
  const api = Router();

  // /api/login
  api.post('/', (req, res, next) => {
    if(req.body.accessToken){
        request('https://graph.facebook.com/me?fields=id,name,email,picture&access_token='+req.body.accessToken, { json: true }, (err, res2, body) => {
            if (err || !body.id) { 
                console.log(err); 
                return res.status(500).send({err:'bad token '+ err});
            }
            database.updateUser(body);
            body.loggedIn = true;
            database.getUser(body.id,(result)=>{
                if(result.isAdmin)
                    body.isAdmin = true;
                const token = jwt.sign({id: body.id, 'userInfo': body}, req.app.get('secretKey'), { expiresIn: '15m' });
                return res.status(200).send({token:token});
            });

           
        });
    }else{
        return res.status(500).send(req.body);
    }
  });

  api.post('/data/', validate, (req, res, next)=>{
    return res.status(200).send(req.userInfo);
  })
  
  return api;
}