import { Router } from 'express';
import getYouTubeID from 'get-youtube-id';
import { scrapePlaylist } from 'youtube-playlist-scraper';
import { database } from '../database/database';
import { player } from '../player/player';
import { checkLogged, checkAdmin } from './login';
import { amplifier } from '../player/amplifier';
import cfg from '../config/general';

export default () => {
  const api = Router();

  // /api/player
  api.post('/list', checkLogged, (req, res) => {
    database.findSong(req.body.songData).then((r) => {
      res.status(200).send({ msg: 'query accepted', result: r.result, totalNum: r.totalNum });
    });
  });
  api.post('/history', checkLogged, (req, res) => {
    database.getHistory(req.body.date, req.body.site).then((r) => {
      res.status(200).send({ msg: 'query accepted', result: r.result, totalNum: r.totalNum });
    });
  });
  api.post('/suggest', checkLogged, (req, res) => {
    if (req.body.data && req.body.data.id && !req.userInfo.isAdmin) {
      res.status(500).send({ msg: 'you need to be an admin' });
    } else {
      req.body.data.userId = req.userInfo.id;
      database.updateSuggestion(req.body.data).then((response) => {
        if (response.err) res.status(500).send({ msg: 'wrong query', err: response.err });
        else res.status(200).send({ msg: 'query accepted', result: response.result });
      });
    }
  });
  api.post('/suggestions', checkLogged, (req, res) => {
    database.getSuggestions(req.body.data).then((r) => {
      res.status(200).send({ msg: 'query accepted', result: r.result, totalNum: r.totalNum });
    });
  });
  api.post('/getplaylist', checkLogged, (req, res) => {
    database.getAllPlaylistData(req.body.date).then((data) => {
      res.status(200).send({ amplifier: data[0], playlist: data[1] });
    });
  });
  api.post('/playlist', checkLogged, (req, res) => {
    if (req.body.entry && (req.body.entry.id || req.body.entry.ytid)) {
      if (req.body.entry.id) {
        checkAdmin(req, res, () => {
          player.changePlaylist(req.body.entry, req.userInfo.isAdmin);
          res.status(200).send({ msg: 'query accepted' });
        });
      } else if (!req.userInfo.isAdmin && new Date(req.body.entry.date) < new Date()) {
        res.status(200).send({ msg: 'query denied', err: 'Nie możesz dodać piosenki w przeszłości' });
      } else if (!req.userInfo.isAdmin && new Date(req.body.entry.date) - new Date() > (cfg.daysInFuture * 1000 * 60 * 60 * 24)) res.status(200).send({ msg: 'query denied', err: 'Nie możesz edytować playlisty dalej niż 5 dni od teraz' });
      else {
        player.changePlaylist(req.body.entry, req.userInfo.isAdmin).then((done) => {
          if (done === 1) res.status(200).send({ msg: 'query accepted' });
          else if (done === 2) res.status(200).send({ msg: 'query denied', err: 'W tym czasie jest już jakaś piosenka' });
          else if (done === 0) res.status(200).send({ msg: 'query denied', err: 'Osiągnięto już limit dzienny/tygodniowy dla tego utworu' });
        });
      }
    } else res.status(500).send({ msg: 'no entry entered' });
  });
  api.post('/schedule', checkAdmin, (req, res) => {
    if (req.body.schedule) {
      player.changeSchedule(req.body.schedule);
      return res.status(200).send({ msg: 'query accepted' });
    } return res.status(500).send({ msg: 'no schedule entered' });
  });
  api.post('/amplifier', checkAdmin, (req, res) => {
    if (req.body.mode) {
      amplifier.setMode(req.body.mode);
      return res.status(200).send({ msg: 'query accepted' });
    } return res.status(500).send({ msg: 'no schedule entered' });
  });
  api.post('/play', checkAdmin, (req, res) => {
    if (req.body.shufflePlay) {
      player.playShuffle();
      return res.status(200).send({ msg: 'query accepted' });
    }
    if (req.body.shuffleSwitch) {
      player.switchShuffle();
      return res.status(200).send({ msg: 'query accepted' });
    }
    if (req.body.fileName) {
      player.playSong(req.body.fileName, req.body.songName, req.body.length, req.body.ytid);
      return res.status(200).send({ msg: 'query accepted' });
    }
    return res.status(500).send({ msg: 'Query denied. Give filename!' });
  });
  api.post('/stop', checkAdmin, (req, res) => {
    player.stopPlaying();
    return res.status(200).send({ msg: 'query accepted' });
  });
  api.post('/delete', checkAdmin, (req, res) => {
    if (!req.body.ytid) return res.status(500).send({ msg: 'Query denied. Give ytid!' });
    player.deleteSong(req.body.ytid);
    return res.status(200).send({ msg: 'query accepted' });
  });
  api.post('/download', checkAdmin, (req, res) => {
    if (req.body.url) {
      if (req.body.url.includes('playlist')) {
        const id = req.body.url.match(/[&?]list=([^&]+)/i);
        if (id.length < 2) return res.status(500).send({ msg: "Query denied. Can't find playlist id!" });
        res.status(200).send({ msg: 'query accepted' });
        return scrapePlaylist(id[1]).then((data) => {
          const { playlist } = data;
          player.downloadSongs(playlist.map((s) => s.id));
        });
      }
      req.body.ytid = getYouTubeID(req.body.url);
    }
    if (req.body.ytid) {
      player.downloadSong(req.body.ytid);
      return res.status(200).send({ msg: 'query accepted' });
    }
    return res.status(500).send({ msg: 'Query denied. Give ytid!' });
  });

  api.post('/data/', checkLogged, (req, res) => res.status(200).send(player.getInfo()));
  api.post('/volume', checkAdmin, (req, res) => {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'volume')) {
      amplifier.setVolume(req.body.volume);
      return res.status(200).send({ msg: 'query accepted' });
    }
    return res.status(500).send({ msg: 'Query denied. Give volume!' });
  });
  return api;
};
