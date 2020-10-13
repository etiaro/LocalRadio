import "regenerator-runtime/runtime.js";
import express from 'express';
import bodyParser from 'body-parser';
import { notFound, catchErrors } from './middlewares/errors';
import login from "./routes/login";
import player from "./routes/player";
import notification from './routes/notification';
import cfg from './config/database';
import gCfg from './config/general';
import {database} from './database/database';
import {player as playerController} from './player/player';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

database.init(cfg.db,()=>{
    playerController.init();
});

const app = express();


app.set('secretKey', gCfg.secret);
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes config
app.use('/api/login', login());
app.use('/api/player', player());
app.use('/api/notification', notification());

//hosting built react app(front end)
app.use(express.static(path.join(__dirname, '../public/build/')));
app.use('/playlist', express.static(path.join(__dirname, '../public/build/')));
app.use('/library', express.static(path.join(__dirname, '../public/build/')));
app.use('/history', express.static(path.join(__dirname, '../public/build/')));
app.use('/suggestions', express.static(path.join(__dirname, '../public/build/')));
app.use('/password', express.static(path.join(__dirname, '../public/build/')));

// errors handling
app.use(notFound);
app.use(catchErrors);

// Start
var httpServ = http.createServer(app);
httpServ.listen(80);

var privateKey  = fs.readFileSync(path.join(__dirname, '/alice.key'), 'utf8');
var certificate  = fs.readFileSync(path.join(__dirname, '/alice.crt'), 'utf8');
var httpsServ = https.createServer({key: privateKey, cert: certificate}, app);
httpsServ.listen(443);