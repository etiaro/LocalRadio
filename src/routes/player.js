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
        player.findSong(req.body.songData, (result, totalNum)=>{
            res.status(200).send({msg: "query accepted", result: result, totalNum: totalNum});
        });
    });
    api.post('/getplaylist', checkPerm, (req, res, next)=> {
        player.getPlaylist(req.body.date, (data)=>{
            return res.status(200).send({amplifier: data[0], playlist: data[1]});
        });
    });
    api.post('/playlist', checkPerm, (req, res, next)=> {
        if(req.body.entry){
            player.changePlaylist(req.body.entry)
            return res.status(200).send({msg: "query accepted"});
        }else
            return res.status(500).send({msg:"no entry entered"})
    });
    api.post('/schedule', checkPerm, (req, res, next)=> {
        if(req.body.schedule){
            player.changeSchedule(req.body.schedule)
            return res.status(200).send({msg: "query accepted"});
        }else
            return res.status(500).send({msg:"no schedule entered"})
    });
    api.post('/play', checkPerm, (req, res, next) => { 
        if(req.body.shufflePlay){
            player.playShuffle();
            return res.status(200).send({msg: "query accepted"});
        }
        if(req.body.shuffleSwitch){
            player.switchShuffle();
            return res.status(200).send({msg: "query accepted"});
        }
        if(req.body.fileName){
            player.playSong(req.body.fileName, req.body.songName, req.body.length);
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

    api.post('/data/', checkPerm, (req, res, next)=>{
      return res.status(200).send(player.getInfo());
    })
    return api;
}