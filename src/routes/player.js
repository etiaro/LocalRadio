import { Router } from 'express';
import {database} from '../database/database';
import {notification} from "../player/notification";
import {player} from '../player/player';
import {checkLogged, checkAdmin} from './login';
import getYouTubeID from 'get-youtube-id';
import ytList from "youtube-playlist";

export default () => {
    const api = Router();

    // /api/player
    api.post('/list', checkLogged, (req, res, next) => {
        player.findSong(req.body.songData, (result, totalNum)=>{
            res.status(200).send({msg: "query accepted", result: result, totalNum: totalNum});
        });
    });
    api.post('/history', checkLogged, (req, res, next) => {
        player.getHistory(req.body.date, req.body.site, (result, totalNum)=>{
            res.status(200).send({msg: "query accepted", result: result, totalNum: totalNum});
        });
    });
    api.post('/suggest', checkLogged, (req, res, next) => {
        if(req.body.data && req.body.data.id && !req.userInfo.isAdmin) res.status(500).send({msg:"you need to be an admin", err:response.err});
        
        req.body.data.userId = req.userInfo.id;
        database.updateSuggestion(req.body.data, (response)=>{
            if(response.err)
                res.status(500).send({msg:"wrong query", err:response.err});
            else
                res.status(200).send({msg: "query accepted", result: response.result});
        });
    });
    api.post('/suggestions', checkLogged, (req, res, next) => {
        database.getSuggestions(req.body.data, (result, totalNum)=>{
            res.status(200).send({msg: "query accepted", result: result, totalNum: totalNum});
        });
    });
    api.post('/getplaylist', checkLogged, (req, res, next)=> {
        player.getPlaylist(req.body.date, (data)=>{
            return res.status(200).send({amplifier: data[0], playlist: data[1]});
        });
    });
    api.post('/playlist', checkLogged, (req, res, next)=> {
        if(req.body.entry && (req.body.entry.id || req.body.entry.ytid)){
            if(!!req.body.entry.id)
                checkAdmin(req,res,()=>{
                    player.changePlaylist(req.body.entry)
                    return res.status(200).send({msg: "query accepted"});
                });
            else{
                player.changePlaylist(req.body.entry)
                return res.status(200).send({msg: "query accepted"});
            }
        }else
            return res.status(500).send({msg:"no entry entered"})
    });
    api.post('/schedule', checkAdmin, (req, res, next)=> {
        if(req.body.schedule){
            player.changeSchedule(req.body.schedule)
            return res.status(200).send({msg: "query accepted"});
        }else
            return res.status(500).send({msg:"no schedule entered"})
    });
    api.post('/play', checkAdmin, (req, res, next) => { 
        if(req.body.shufflePlay){
            player.playShuffle();
            return res.status(200).send({msg: "query accepted"});
        }
        if(req.body.shuffleSwitch){
            player.switchShuffle();
            return res.status(200).send({msg: "query accepted"});
        }
        if(req.body.fileName){
            player.playSong(req.body.fileName, req.body.songName, req.body.length, req.body.ytid);
            return res.status(200).send({msg: "query accepted"});
        }
        return res.status(500).send({msg: "Query denied. Give filename!"});
    });
    api.post('/stop', checkAdmin, (req, res, next) => { 
        player.stopPlaying();
        return res.status(200).send({msg: "query accepted"});
    });
    api.post('/download', checkAdmin, (req, res, next) => {
        if(req.body.url){
            if(req.body.url.includes("playlist")){
                res.status(200).send({msg: "query accepted"});
                ytList(req.body.url, 'id').then(result => {
                    var playlist = result.data.playlist;
                    player.downloadSongs(playlist);
                  });
                return;
            }else{
                req.body.ytid = getYouTubeID(req.body.url);
            }
        }
        if(req.body.ytid){
            player.downloadSong(req.body.ytid);
            return res.status(200).send({msg: "query accepted"});
        }
        return res.status(500).send({msg: "Query denied. Give ytid!"});
    });

    api.post('/data/', checkLogged, (req, res, next)=>{
      return res.status(200).send(player.getInfo());
    })
    return api;
}