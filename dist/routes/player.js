'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _database = require('../database/database');

var _player = require('../player/player');

var _login = require('./login');

var _getYoutubeId = require('get-youtube-id');

var _getYoutubeId2 = _interopRequireDefault(_getYoutubeId);

var _youtubePlaylist = require('youtube-playlist');

var _youtubePlaylist2 = _interopRequireDefault(_youtubePlaylist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
    var api = (0, _express.Router)();

    // /api/player
    api.post('/list', _login.checkPerm, function (req, res, next) {
        _player.player.findSong(req.body.songData, function (result) {
            res.status(200).send({ msg: "query accepted", result: result });
        });
    });
    api.post('/play', _login.checkPerm, function (req, res, next) {
        console.log(req.body);
        if (req.body.shufflePlay) {
            _player.player.playShuffle();
            return res.status(200).send({ msg: "query accepted" });
        }
        if (req.body.shuffleSwitch) {
            _player.player.switchShuffle();
            return res.status(200).send({ msg: "query accepted" });
        }
        if (req.body.fileName) {
            _player.player.playSong(req.body.fileName, req.body.songName, req.body.length);
            return res.status(200).send({ msg: "query accepted" });
        }
        return res.status(500).send({ msg: "Query denied. Give filename!" });
    });
    api.post('/stop', _login.checkPerm, function (req, res, next) {
        _player.player.stopPlaying();
        return res.status(200).send({ msg: "query accepted" });
    });
    api.post('/download', _login.checkPerm, function (req, res, next) {
        if (req.body.url) {
            if (req.body.url.includes("playlist")) {
                res.status(200).send({ msg: "query accepted" });
                (0, _youtubePlaylist2.default)(req.body.url, 'id').then(function (result) {
                    var playlist = result.data.playlist;
                    _player.player.downloadSongs(playlist);
                });
                return;
            } else req.body.ytid = (0, _getYoutubeId2.default)(req.body.url);
        }
        if (req.body.ytid) {
            _player.player.downloadSong(req.body.ytid);
            return res.status(200).send({ msg: "query accepted" });
        }
        return res.status(500).send({ msg: "Query denied. Give ytid!" });
    });

    api.post('/data/', _login.checkPerm, function (req, res, next) {
        return res.status(200).send(_player.player.getInfo());
    });
    return api;
};