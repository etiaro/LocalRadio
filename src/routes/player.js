import { Router } from 'express';
import { database } from '../database/database';
import { player } from '../player/player';
import { checkLogged, checkAdmin } from './login';
import getYouTubeID from 'get-youtube-id';
import { scrapePlaylist } from "youtube-playlist-scraper";
import { amplifier } from '../player/amplifier';
import cfg from '../config/general'

export default () => {
    const api = Router();

    // /api/player
    api.post('/list', checkLogged, (req, res, next) => {
        database.findSong(req.body.songData).then((r) => {
            res.status(200).send({ msg: "query accepted", result: r.result, totalNum: r.totalNum });
        });
    });
    api.post('/history', checkLogged, (req, res, next) => {
        database.getHistory(req.body.date, req.body.site).then((r) => {
            res.status(200).send({ msg: "query accepted", result: r.result, totalNum: r.totalNum });
        });
    });
    api.post('/suggest', checkLogged, (req, res, next) => {
        if (req.body.data && req.body.data.id && !req.userInfo.isAdmin)
            return res.status(403).send({ msg: "you need to be an admin", err: response.err });

        req.body.data.userId = req.userInfo.id;
        database.updateSuggestion(req.body.data).then((response) => {
            if (response.err)
                res.status(400).send({ msg: "wrong query", err: response.err });
            else
                res.status(200).send({ msg: "query accepted", result: response.result });
        });
    });
    api.post('/suggestions', checkLogged, (req, res, next) => {
        database.getSuggestions(req.body.data).then((r) => {
            res.status(200).send({ msg: "query accepted", result: r.result, totalNum: r.totalNum });
        });
    });
    api.post('/getplaylist', checkLogged, (req, res, next) => {
        database.getAllPlaylistData(req.body.date).then((data) => {
            return res.status(200).send({ amplifier: data[0], playlist: data[1] });
        });
    });
    api.post('/playlist', checkLogged, (req, res, next) => {
        if (req.body.entry && (req.body.entry.id || req.body.entry.ytid)) {
            if (!!req.body.entry.id)
                checkAdmin(req, res, () => {
                    player.changePlaylist(req.body.entry, req.userInfo.isAdmin)
                    return res.status(200).send({ msg: "query accepted" });
                });
            else {
                if (!req.userInfo.isAdmin && new Date(req.body.entry.date) < new Date()) {
                    return res.status(200).send({ msg: "query denied", err: "Nie możesz dodać piosenki w przeszłości" });
                } else if (!req.userInfo.isAdmin && new Date(req.body.entry.date) - new Date() > (cfg.daysInFuture * 1000 * 60 * 60 * 24))
                    return res.status(200).send({ msg: "query denied", err: "Nie możesz edytować playlisty dalej niż 5 dni od teraz" });
                else {
                    player.changePlaylist(req.body.entry, req.userInfo.isAdmin).then(done => {
                        if (done == 1)
                            return res.status(200).send({ msg: "query accepted" });
                        else if (done == 2)
                            return res.status(200).send({ msg: "query denied", err: "W tym czasie jest już jakaś piosenka" });
                        else if (done == 0)
                            return res.status(200).send({ msg: "query denied", err: "Osiągnięto już limit dzienny/tygodniowy dla tego utworu" });
                    })
                }
            }
        } else
            return res.status(400).send({ msg: "no entry entered" })
    });
    api.post('/schedule', checkAdmin, (req, res, next) => {
        if (req.body.schedule) {
            player.changeSchedule(req.body.schedule)
            return res.status(200).send({ msg: "query accepted" });
        } else
            return res.status(400).send({ msg: "no schedule entered" })
    });
    api.post('/amplifier', checkAdmin, (req, res, next) => {
        if (req.body.mode) {
            amplifier.setMode(req.body.mode);
            return res.status(200).send({ msg: "query accepted" });
        } else
            return res.status(400).send({ msg: "no schedule entered" })
    })
    api.post('/play', checkAdmin, (req, res, next) => {
        if (req.body.shufflePlay) {
            player.playShuffle();
            return res.status(200).send({ msg: "query accepted" });
        }
        if (req.body.shuffleSwitch) {
            player.switchShuffle();
            return res.status(200).send({ msg: "query accepted" });
        }
        if (req.body.ytid) {
            player.playSong(req.body.songName, req.body.length, req.body.ytid);
            return res.status(200).send({ msg: "query accepted" });
        }
        return res.status(400).send({ msg: "Query denied. Give filename!" });
    });
    api.post('/stop', checkAdmin, (req, res, next) => {
        player.stopPlaying();
        return res.status(200).send({ msg: "query accepted" });
    });
    api.post('/delete', checkAdmin, (req, res) => {
        if (!req.body.ytid)
            return res.status(400).send({ msg: "Query denied. Give ytid!" });
        player.deleteSong(req.body.ytid);
        return res.status(200).send({ msg: "query accepted" });
    })
    api.post('/download', checkAdmin, (req, res, next) => {
        if (req.body.url) {
            if (req.body.url.includes("playlist")) {
                let id = req.body.url.match(/[&?]list=([^&]+)/i);
                if (id.length < 2)
                    return res.status(404).send({ msg: "Query denied. Can't find playlist id!" });
                res.status(200).send({ msg: "query accepted" });
                scrapePlaylist(id[1]).then(data => {
                    var playlist = data.playlist;
                    player.downloadSongs(playlist.map(s => s.id));
                });
                return;
            } else {
                req.body.ytid = getYouTubeID(req.body.url);
            }
        }
        if (req.body.ytid) {
            player.downloadSong(req.body.ytid);
            return res.status(200).send({ msg: "query accepted" });
        }
        return res.status(400).send({ msg: "Query denied. Give ytid!" });
    });

    api.post('/data/', checkLogged, (req, res, next) => {
        return res.status(200).send(player.getInfo());
    })
    api.post('/volume', checkAdmin, (req, res, next) => {
        if (req.body && req.body.hasOwnProperty('volume')) {
            amplifier.setVolume(req.body.volume)
            return res.status(200).send({ msg: "query accepted" });
        } else
            return res.status(500).send({ msg: "Query denied. Give volume!" });
    })
    return api;
}