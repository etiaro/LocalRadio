import YTmp3 from "youtube-mp3-downloader";
import {database} from "../database/database";
import youtubeInfo from "youtube-info";
import p from 'play-sound';
import fs from 'fs';
import {notification} from './notification';
import {amplifier} from './amplifier';


const pl = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod';},_type: 'NoClassSingleton', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default pl;  //singleton stuff, don't care about it

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

export const player = Object.assign({}, {
    singletonMethod() {
      return 'singletonMethod';
    },
    _type: 'PlayerController',
    get type() {
      return this._type;
    },
    set type(value) {
      this._type = value;
    },
    
    

    p: p({}),
    audio: null,
    shuffleTimeout: null,
    isPlaying: false,
    isShuffle: false,
    songInfo: {},
    playSong(fileName, name, length){
        this.clearLastPlay();
        console.log("playing "+name +" from "+ fileName+" "+length+"seconds");
        this.audio = this.p.play('./Music/'+fileName, function(err){
            if (err) throw err;
        });
        player.songInfo.name = name;
        player.isPlaying = true;
        player.sendPlayerData();
        player.shuffleTimeout = setTimeout(()=>{
            player.isPlaying = false;
            player.songInfo = {};
            player.sendPlayerData();
            player.nextShuffle();
        }, length*1000);
    },
    nextShuffle(){
        if(this.isShuffle){
            this.isShuffle = true;
            database.getRandomSong((song)=>{
                player.playSong(song.file, song.name, song.length);
            });
        }
    },
    switchShuffle(){
        this.isShuffle = !this.isShuffle;
        this.sendPlayerData();
    },
    playShuffle(){
        if(!this.isShuffle){
            this.isShuffle = true;
            this.sendPlayerData();
        }
        if(!this.isPlaying)
            this.nextShuffle();
    },
    clearLastPlay(){
        if(this.audio){
            this.audio.kill();
            this.audio = null;
        }if(this.shuffleTimeout){
            clearTimeout(this.shuffleTimeout);
            this.shuffleTimeout = null;
        }
        this.songInfo = {};
    }, 
    stopPlaying(){
        this.clearLastPlay();
        this.isPlaying = false;
        this.isShuffle = false;
        this.sendPlayerData();
    },
    downloadSong(ytid, callback){
        database.getSong(ytid, (res)=>{
            if(res){
                console.log("Video already downloaded to "+res.file);
                notification.notify({msg: 'Skipping '+ ytid + ' - already downloaded'});
                if(callback) callback();
                return;
            }
            var YD = new YTmp3({
                "ffmpegPath": "ffmpeg.exe",        // Where is the FFmpeg binary located?
                "outputPath": "./Music",    // Where should the downloaded and encoded files be stored?
                "youtubeVideoQuality": "highest",       // What video quality should be used?
                "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
                "progressTimeout": 2000                 // How long should be the interval of the progress reports
            });

            var song = {
                ytid: ytid,
                file: makeid(10)+".mp3",
            }

            while (fs.existsSync("./Music/"+song.file))
                song.file = makeid(10)+".mp3";

            YD.download(ytid, song.file);
            YD.on("error", function(error) {
                if(callback) callback();
                console.log(error);
                notification.notify({msg: 'error while downloading '+ytid});
            });
            YD.on("progress", function(progress) {
                console.log(JSON.stringify(progress));
                //notification.notify({msg: 'Downloading '+ytid+', '+Math.round(progress.progress.percentage)+'%'});
            });
            YD.on("finished", function(err, data) {
                youtubeInfo(ytid, (err, i)=>{
                    if(err){
                        console.log(err);
                        if(callback) callback();
                        return;
                    }
                    console.log("Finished downloading "+i.title+" to "+song.file);
                    notification.notify({msg: 'Successfully downloaded '+i.title});
                    song.name = i.title.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                    song.author = i.owner.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                    song.length = i.duration;
                    database.updateSong(song);
                    if(callback) callback();
                });
            });
        });
    },
    downloadSongs(ytids){
        var i = 0;
        var f = this.downloadSong;
        f(ytids[i], next);
        function next(){
            i++;
            if(i < ytids.length)
                f(ytids[i], next);
        }
    },
    findSong(songData, cb){
        database.findSong(songData, cb);
    },
    sendPlayerData(){
        notification.notify({player: this.getInfo()});
    },
    getInfo(){
        return {isPlaying: this.isPlaying, isShuffle: this.isShuffle, song: this.songInfo, amplifierMode: amplifier.mode};
    },
    getPlaylist(date, cb){
        database.getAllPlaylistData(date, cb);
    },
    changePlaylist(data){
        database.modifyPlaylist(data);
    },
    startPlaylistWatchman(){
        amplifier.startWatchman();
        setInterval(()=>{
            database.getPlaylistData((res)=>{
                if(res.length == 0)
                    return;
                
                if(res[0].date*1000 < new Date().getTime()){
                    this.playSong(res[0].file, res[0].name, res[0].length);
                    database.modifyPlaylist({id: res[0].id, was: 1});
                }
            });
        }, 1000);
    }
});