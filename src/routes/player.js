import { Router } from 'express';
import {database} from '../database/database';
import {player} from '../player/player';
import {checkPerm} from './login';
import getYouTubeID from 'get-youtube-id';
import ytList from "youtube-playlist";

export default () => {
    const api = Router();

    // /api/player
    api.post('/list', checkPerm, (req, res, next) => {
        player.findSong(req.body.songData, (result)=>{
            res.status(200).send({msg: "query accepted", result: result});
        });
    });
    api.post('/play', checkPerm, (req, res, next) => { 
        if(req.body.shuffle){
            player.playShuffle();
            return res.status(200).send({msg: "query accepted"});
        }
        if(req.body.fileName){
            player.playSong(req.body.fileName);
            return res.status(200).send({msg: "query accepted"});
        }
        return res.status(500).send({msg: "Query denied. Give filename!"});
    });
    api.post('/stop', checkPerm, (req, res, next) => { 
        player.stopPlaying();
        return res.status(200).send({msg: "query accepted"});
    });
    api.post('/download', checkPerm, (req, res, next) => {
        if(req.body.url){
            if(req.body.url.includes("playlist")){
                res.status(200).send({msg: "query accepted"});
                ytList(req.body.url, 'id').then(result => {
                    var playlist = result.data.playlist;
                    player.downloadSongs(playlist);
                  });
                return;
            }else
                req.body.ytid = getYouTubeID(req.body.url);
        }
        if(req.body.ytid){
            player.downloadSong(req.body.ytid);
            return res.status(200).send({msg: "query accepted"});
        }
        return res.status(500).send({msg: "Query denied. Give ytid!"});
    });
    
    return api;
}