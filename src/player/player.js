import YTmp3 from "youtube-mp3-downloader";
import {database} from "../database/database";
import youtubeInfo from "youtube-info";
import p from 'play-sound';
import fs from 'fs';


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
    playSong(fileName){
        this.stopPlaying();
        audio = this.p.play('./Music/'+fileName, function(err){
            if (err) throw err;
        });
    },
    playShuffle(){
        this.stopPlaying();
        database.getRandomSong((song)=>{
            console.log("playing "+song.name);
            this.audio = this.p.play('./Music/'+song.file, function(err){
                if (err) throw err;
            });
            this.shuffleTimeout = setTimeout(()=>{
                player.playShuffle();
            }, song.length*1000);
        });
    },
    stopPlaying(){
        if(this.audio)
            this.audio.kill();
        if(this.shuffleTimeout){
            clearTimeout(this.shuffleTimeout);
            this.shuffleTimeout = null;
        }
    },
    downloadSong(ytid, callback){
        database.getSong(ytid, (res)=>{
            if(res){
                console.log("Video already downloaded to "+res.file);
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
            });
            YD.on("progress", function(progress) {
                console.log(JSON.stringify(progress));
            });
            YD.on("finished", function(err, data) {
                youtubeInfo(ytid, (err, i)=>{
                    if(err){
                        console.log(err);
                        if(callback) callback();
                        return;
                    }
                    console.log("Finished downloading "+i.title+" to "+song.file);
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
    }
});