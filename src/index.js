import express from 'express';
import bodyParser from 'body-parser';
import { notFound, catchErrors } from './middlewares/errors';
import login, {initPassport} from "./routes/login";
import player from "./routes/player";
import notification from './routes/notification';
import cfg from './config/database';
import {database} from './database/database';
import cors from 'cors';

database.init(cfg.db);

const app = express();

app.set('secretKey', 'K4UgOiCggY');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// routes config
app.use('/api/login', login());
app.use('/api/player', player());
app.use('/api/notification', notification());


// errors handling
app.use(notFound);

// Start
app.listen(80, () => {
    console.log(`Server is up!`);
});