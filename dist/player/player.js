"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.player = undefined;

var _youtubeMp3Downloader = require("youtube-mp3-downloader");

var _youtubeMp3Downloader2 = _interopRequireDefault(_youtubeMp3Downloader);

var _database = require("../database/database");

var _youtubeInfo = require("youtube-info");

var _youtubeInfo2 = _interopRequireDefault(_youtubeInfo);

var _playSound = require("play-sound");

var _playSound2 = _interopRequireDefault(_playSound);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pl = { _instance: null, get instance() {
        if (!this._instance) {
            this._instance = {
                singletonMethod: function singletonMethod() {
                    return 'singletonMethod';
                },
                _type: 'NoClassSingleton', get type() {
                    return this._type;
                }, set type(value) {
                    this._type = value;
                } };
        }return this._instance;
    } };
exports.default = pl; //singleton stuff, don't care about it

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

var player = exports.player = Object.assign({}, {
    singletonMethod: function singletonMethod() {
        return 'singletonMethod';
    },

    _type: 'PlayerController',
    get type() {
        return this._type;
    },
    set type(value) {
        this._type = value;
    },

    p: (0, _playSound2.default)({}),
    audio: null,
    shuffleTimeout: null,
    playSong: function playSong(fileName) {
        this.stopPlaying();
        audio = this.p.play('./Music/' + fileName, function (err) {
            if (err) throw err;
        });
    },
    playShuffle: function playShuffle() {
        var _this = this;

        this.stopPlaying();
        _database.database.getRandomSong(function (song) {
            console.log("playing " + song.name);
            _this.audio = _this.p.play('./Music/' + song.file, function (err) {
                if (err) throw err;
            });
            _this.shuffleTimeout = setTimeout(function () {
                player.playShuffle();
            }, song.length * 1000);
        });
    },
    stopPlaying: function stopPlaying() {
        if (this.audio) this.audio.kill();
        if (this.shuffleTimeout) {
            clearTimeout(this.shuffleTimeout);
            this.shuffleTimeout = null;
        }
    },
    downloadSong: function downloadSong(ytid, callback) {
        _database.database.getSong(ytid, function (res) {
            if (res) {
                console.log("Video already downloaded to " + res.file);
                if (callback) callback();
                return;
            }
            var YD = new _youtubeMp3Downloader2.default({
                "ffmpegPath": "ffmpeg.exe", // Where is the FFmpeg binary located?
                "outputPath": "./Music", // Where should the downloaded and encoded files be stored?
                "youtubeVideoQuality": "highest", // What video quality should be used?
                "queueParallelism": 2, // How many parallel downloads/encodes should be started?
                "progressTimeout": 2000 // How long should be the interval of the progress reports
            });

            var song = {
                ytid: ytid,
                file: makeid(10) + ".mp3"
            };

            while (_fs2.default.existsSync("./Music/" + song.file)) {
                song.file = makeid(10) + ".mp3";
            }YD.download(ytid, song.file);
            YD.on("error", function (error) {
                if (callback) callback();
                console.log(error);
            });
            YD.on("progress", function (progress) {
                console.log(JSON.stringify(progress));
            });
            YD.on("finished", function (err, data) {
                (0, _youtubeInfo2.default)(ytid, function (err, i) {
                    if (err) {
                        console.log(err);
                        if (callback) callback();
                        return;
                    }
                    console.log("Finished downloading " + i.title + " to " + song.file);
                    song.name = i.title.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                    song.author = i.owner.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                    song.length = i.duration;
                    _database.database.updateSong(song);
                    if (callback) callback();
                });
            });
        });
    },
    downloadSongs: function downloadSongs(ytids) {
        var i = 0;
        var f = this.downloadSong;
        f(ytids[i], next);
        function next() {
            i++;
            if (i < ytids.length) f(ytids[i], next);
        }
    }
});