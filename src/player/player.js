import YTmp3 from "youtube-mp3-downloader";
import {database} from "../database/database";
import ytdl from "ytdl-core";
import p from 'play-sound';
import fs from 'fs';
import {notification} from './notification';
import {amplifier} from './amplifier';
import cfg from '../config/general';
import normalize from 'ffmpeg-normalize';


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
    
    
    YD: new YTmp3({
        "ffmpegPath": cfg.ffmpegPath,        // Where is the FFmpeg binary located?
        "outputPath": "./Music",    // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest",       // What video quality should be used?
        "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000                 // How long should be the interval of the progress reports
    }),
    p: p({}),
    audio: null,
    shuffleTimeout: null,
    isPlaying: false,
    isShuffle: false,
    songInfo: {},
    startTime: new Date(),
    init(){
        player.YD.on("error", function(error, data) {
            console.log(error, data);
            notification.notify({msg: 'Wystąpił problem podczas pobierania'}, true);
        });
        player.YD.on("progress", function(progress) {
            console.log(JSON.stringify(progress));
            //notification.notify({msg: 'Downloading '+ytid+', '+Math.round(progress.progress.percentage)+'%'}, true);
        });
        player.YD.on("finished", function(err, data) {
            var song = {ytid: data.videoId,
                    file: data.file.split('/')[2]};
                //NORMALIZATION
            fs.rename(data.file, data.file+".TEMP", ()=>{
                normalize({
                    input: data.file+".TEMP",
                    output: data.file,
                    loudness: {
                        normalization: 'rms',
                        target:
                        {
                            input_i: -10    //TARGET NORMALISED VOLUME
                        }
                    },
                    verbose: false
                }).then(normalized  => {
                    console.log("Normalized "+normalized.info.output.split("/")[2]+"!")
                    fs.unlinkSync(data.file+".TEMP");
                }).catch(err =>{
                    console.error(err)
                });
            })
                    
            ytdl.getBasicInfo(data.videoId).then((data)=>{
                console.log("Finished downloading "+data.videoDetails.title+" to "+song.file);
                notification.notify({msg: 'Pomyślnie pobrano '+data.videoDetails.title}, true);
                song.name = data.videoDetails.title.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                song.author = data.videoDetails.author.name.replace(/[^\w\s]/gi, '').replace(/'/g, '');
                song.length = data.videoDetails.lengthSeconds;
                database.updateSong(song);
            }).catch((err)=>{
                console.log(err);
            });
        });
        player.startPlaylistWatchman();
    },
    playSong(fileName, name, length, ytid){
        this.clearLastPlay();
        console.log("playing "+name +" from "+ fileName+" "+length+"seconds");
        if(!cfg.demo){
            //p.play(FILE, { mplayer: [ '-ss', ( Track.obj.begin + Math.floor( ( Now - Schedule.obj.schedule[Current].begin ) / 1000 ) ), 
            //'−volume', 
            //Track.obj.volume, '-really-quiet' ] }, (er)=>{}
            if(fs.existsSync('./Music/'+fileName))
                this.audio = this.p.play('./Music/'+fileName, function(err){
                    if (err && !err.killed && err !== 1) throw err;
                });
            else if(fs.existsSync('../Music/'+fileName))
                this.audio = this.p.play('../Music/'+fileName, function(err){
                    if (err && !err.killed && err !== 1) throw err;
                });
            else
                throw "playing failed. File not found!";
        }
        player.startTime = new Date();
        player.songInfo.name = name;
        player.songInfo.length = length;
        player.isPlaying = true;
        player.sendPlayerData();
        database.addHistory({date: new Date(), ytid: ytid});
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
            database.getRandomSong().then((song)=>{
                if(song)
                    player.playSong(song.file, song.name, song.length, song.ytid);
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
            if(!this.isPlaying)
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
    stopPlaying(leaveSuffle){
        this.clearLastPlay();
        var tmp = this.isPlaying;
        this.isPlaying = false;
        if(!leaveSuffle)
            this.isShuffle = false;
        if(tmp)
            console.log("stopped playing")
            this.sendPlayerData();
    },
    downloadSong(ytid){
        if(cfg.demo){
            notification.notify({msg: 'Pobieranie jest wyłączone w trybie demostracyjnym'}, true);
            return;
        }
        
        database.getSong(ytid).then((res)=>{
            if(res){
                console.log("Video already downloaded to "+res.file);
                notification.notify({msg: 'Pomijam '+ ytid + ' - jest już pobrane'}, true);
                return;
            }

            var song = {
                ytid: ytid,
                file: makeid(10)+".mp3",
            }

            while (fs.existsSync("./Music/"+song.file))
                song.file = makeid(10)+".mp3";

            player.YD.download(ytid, song.file);
        });
    },
    downloadSongs(ytids){
        if(cfg.demo){
            notification.notify({msg: 'Pobieranie jest wyłączone w trybie demostracyjnym'}, true);
            return;
        }
        for(let i = 0; i < ytids.length; i++){
            this.downloadSong(ytids[i]);
        }
    },
    sendPlayerData(){
        notification.notify({player: this.getInfo()});
    },
    sendPlaylistData(){
        database.getAllPlaylistData(null).then((data)=>{
            notification.notify({amplifier: data[0], playlist: data[1]});
        });
    },
    getInfo(){
        var time = Math.floor(((new Date()).getTime() - this.startTime.getTime())/1000);
        return {isPlaying: this.isPlaying, time:time, isShuffle: this.isShuffle, song: this.songInfo, amplifierMode: amplifier.mode, volume: amplifier.volume};
    },
    changePlaylist(data){
        database.modifyPlaylist(data);
        this.sendPlaylistData();
    },
    changeSchedule(data){
        database.setAmplifierTimeSchedule(data);
        this.sendPlaylistData();
    },
    startPlaylistWatchman(){
        amplifier.startWatchman();
        setInterval(()=>{
            database.getPlaylistData().then((res)=>{
                if(res.length == 0)
                    return;
                if(res[0].date*1000 < new Date().getTime()){
                    this.playSong(res[0].file, res[0].name, res[0].length, res[0].ytid);
                    database.modifyPlaylist({id: res[0].id, was: 1});
                }
            });
        }, 1000);
    }
});