import mysql from 'mysql';
import moment from 'moment';
import { ENETRESET } from 'constants';
import { player } from '../player/player';

const db = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod';},_type: 'NoClassSingleton', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default db;  //singleton stuff, don't care about it

function formatDate(date) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
}


export const database = Object.assign({}, {
    singletonMethod() {
      return 'singletonMethod';
    },
    _type: 'DatabaseController',
    get type() {
      return this._type;
    },
    set type(value) {
      this._type = value;
    },

    con: null,
    init(cfg){
        this.con = mysql.createConnection(cfg);
        this.con.connect((err) => {
            if (err){ 
              console.log("Error while database connecting:",err);
              setTimeout(()=>database.init(cfg), 2000);
            }else{
              console.log("connected to database"); 
              database.validateAndFix(cfg);
            }
        });
        this.con.on('error', function(err) {
            console.log('db error', err);
            if(err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === "ECONNRESET") { 
              setTimeout(()=>database.init(cfg), 2000);
            } else { 
              throw err;
            }
        });
    },
    async validateAndFix(cfg){
      console.log("Database validation...");
      await this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'users' LIMIT 1;",
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            if(result.length == 0){
              console.log("Users table not found, creating...");
              this.con.query("CREATE TABLE `"+cfg.database+"`.`users` ( `id` VARCHAR(30) NOT NULL , `name` VARCHAR(30) NOT NULL , `mail` VARCHAR(60) NOT NULL , `picture` VARCHAR(150) NOT NULL , `isAdmin` BOOLEAN NOT NULL  DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;",
              (err, result, fields)=>{
                if(err) console.log(err)
                else  console.log('Created table users');
              });
            }
          }
      });
      await this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'songs' LIMIT 1;",
      (err, result, fields) => {
        if(err) console.log(err);
        else{
          if(result.length == 0){
            console.log("Songs table not found, creating...");
            this.con.query("CREATE TABLE `"+cfg.database+"`.`songs` ( `ytid` VARCHAR(30) NOT NULL , `name` VARCHAR(150) NOT NULL , `length` VARCHAR(10) NOT NULL , `author` VARCHAR(30) NOT NULL , `file` VARCHAR(30) NOT NULL , PRIMARY KEY (`ytid`)) ENGINE = InnoDB;",
            (err, result, fields)=>{
              if(err) console.log(err)
              else  console.log('Created table songs');
            });
          }
        } 
      });
      await this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'timeSchedule' LIMIT 1;",
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            if(result.length == 0){
              console.log("TimeSchedule table not found, creating..."); 
              this.con.query("CREATE TABLE `"+cfg.database+"`.`timeSchedule` ( `id` INT NOT NULL AUTO_INCREMENT , `data` TEXT NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`)) ENGINE = InnoDB;",
              (err, result, fields)=>{
                if(err) console.log(err)
                else  console.log('Created table timeSchedule');
              });
            }
          } 
      });
      await this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'playlist' LIMIT 1;",
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            if(result.length == 0){
              console.log("Playlist table not found, creating..."); 
              this.con.query("CREATE TABLE `"+cfg.database+"`.`playlist` ( `id` INT NOT NULL AUTO_INCREMENT , `ytid` VARCHAR(30) NOT NULL , `date` TIMESTAMP NOT NULL , `was` BOOLEAN NOT NULL DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;",
              (err, result, fields)=>{
                if(err) console.log(err)
                else  console.log('Created table playlist'); 
              });
            }
          } 
      });
      this.fixPlaylistToFitSchedule();
      console.log("Database validation done");
    },
    getUser(userId, cb){
      this.con.query("SELECT * FROM `users` WHERE id='"+userId+"'",
      (err, result, fields) => {
        if(err) console.log(err);
        else{
          cb(result[0]);
        }
      });
    },
    updateUser(userData, cb){
      this.con.query("INSERT INTO `users`(`id`, `name`, `mail`, `picture`) VALUES "+ 
            "('"+userData.id+"','"+userData.name+"','"+userData.email+"','"+userData.picture.data.url+"') ON DUPLICATE KEY UPDATE "+
            "name='"+userData.name+"', mail='"+userData.email+"', picture='"+userData.picture.data.url+"'",
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            if(cb) cb(result);
          }
        });
    },
    getSong(songId, cb){
      this.con.query("SELECT * FROM `songs` WHERE ytid='"+songId+"'",
      (err, result, fields) => {
        if(err) console.log(err);
        else{
          cb(result[0]);
        }
      });
    },
    getRandomSong(cb){
      this.con.query("SELECT  * FROM songs ORDER BY RAND() LIMIT 1;",
      (err, result, fields) => {
        if(err) console.log(err);
        else{
          cb(result[0]);
        }
      });
    },
    updateSong(songData, cb){
      this.con.query("INSERT INTO `songs`(`ytid`, `name`, `length`, `author`, `file`) VALUES "+ 
            "('"+songData.ytid+"','"+songData.name+"','"+songData.length+"','"+songData.author+"','"+songData.file+"')",
      (err, result, fields) => {
        if(err) console.log(err);
        else{
          if(cb) cb(result);
        }
      });
    },
    findSong(songData, cb){
      var query = "SELECT * FROM `songs` ";
      var query2 = "SELECT COUNT(*) FROM `songs` ";
      if(songData){
        if(songData.ytid){
          query+="WHERE `ytid`='"+songData.ytid+"' ";
          query2+="WHERE `ytid`='"+songData.ytid+"' ";
        }
        if(songData.name){
          query+= "WHERE `name` LIKE '%"+songData.name+"%' OR `author` LIKE '%"+songData.name+"%' ";
          query2+= "WHERE `name` LIKE '%"+songData.name+"%' OR `author` LIKE '%"+songData.name+"%' ";
        }
        query+="ORDER BY `name` ";
        if(songData.site)
          query+= "LIMIT "+30*songData.site;
        else
          query+= "LIMIT 30 ";
      }else{
        query += " ORDER BY `name` LIMIT 30";
      }
      
      this.con.query(query+";"+query2+";",
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            cb(result[0], result[1][0]["COUNT(*)"]);
          }
      });
    },
    getAllPlaylistData(date, cb){
      //TODO fix timezones
      var query = "SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1;"+
      "SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid WHERE ";
      
      if(date){
        if(date instanceof Number) date = new Date(date * 1000);
        if(typeof(date) === "string") date = new Date(date);
        date.setHours(0,0,0,0);
        var dateTo = new Date(date);
        dateTo.setHours(23,59,59,999);
        console.log(date, dateTo);
        date = Math.floor(date.getTime()/1000);
        dateTo = Math.floor(dateTo.getTime()/1000);
        query += "playlist.date>FROM_UNIXTIME("+date+") AND playlist.date<FROM_UNIXTIME("+dateTo+")";
      }else{
        date = new Date();
        date.setHours(0,0,0,0);
        date = Math.floor(date.getTime()/1000);
        query += "playlist.date>DATE(FROM_UNIXTIME("+date+"))";
      }

      query+= " ORDER by playlist.date ASC;";
      this.con.query( query,
        (err, result, fields) => {
          if(err) 
            console.log(err);
          else{
            if(result[0].length > 0)
            result[0] = JSON.parse(result[0][0].data)
            if(cb) cb(result);
          }
      });
    },
    getPlaylistData(cb){
      var time = new Date(Date.now() - 30000);
      time = Math.floor(time.getTime()/1000);
      this.con.query(" UPDATE `playlist` SET `was`=1 WHERE `date`<FROM_UNIXTIME("+time+"); SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid AND playlist.was=0 ORDER BY `date` ASC;",
        (err, result, fields) => {
          if(err) 
            console.log(err);
          else{
            if(cb) cb(result[1]);
          }
      });
    },

    modifyPlaylist(entry, cb){
      if(typeof(entry.date) === "string")
        entry.date = new Date(entry.date);
      if(entry.date instanceof Date)
        entry.date = entry.date.getTime();
      entry.date = Math.floor(entry.date/1000);
      if(entry.id){
        if(entry.delete){
          var query = "DELETE FROM playlist";
          query+= " WHERE id="+entry.id;
          this.con.query(query,
          (err, result, fields) => {
            if(err) console.log(err);
            else{
              if(cb) cb(result);
            }
          });
        }else{
          var query = "UPDATE playlist SET";
          query += !!entry.ytid ? " ytid="+entry.ytid : "";
          query += !!entry.date ? " date="+entry.date : "";
          query += !!entry.was ? " was="+entry.was : "";
          query+= " WHERE id="+entry.id;
          this.con.query(query,
          (err, result, fields) => {
            if(err) console.log(err);
            else{
              if(cb) cb(result);
            }
          });
        }
      }else
        this.con.query("INSERT INTO `playlist`(`ytid`, date) VALUES ('"+entry.ytid+"', FROM_UNIXTIME("+entry.date+"))",
          (err, result, fields) => {
            if(err) console.log(err);
            else{
              if(cb) cb(result);
            }
          });
      this.fixPlaylistToFitSchedule();
      //date FROM_UNIXTIME('Date.toMiliseconds or smthg')
      //modify or update entry
    },
    setAmplifierTimeSchedule(schedule, cb){ //TODO use somewhere! 
      if(typeof schedule === "string")
        schedule = JSON.parse(schedule);
      if(!schedule.day)
        schedule.day = [false, false, false, false, false, false, false];
      if(!schedule.enabledTimes)
        schedule.enabledTimes = [];
      schedule = JSON.stringify(schedule);
      
      this.con.query("INSERT INTO `timeSchedule`(`data`) VALUES ('"+schedule+"')",
        (err, result, fields) => {
          if(err) 
            console.log(err);
          else
            if(cb) cb(result);
      });
      this.fixPlaylistToFitSchedule();
      //adds a record
    },
    getAmplifierTimeSchedule(cb){ 
      this.con.query("SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1",
        (err, result, fields) => {
          if(err) 
            console.log(err);
          else
            if(cb) 
              if(result[0]) cb(JSON.parse(result[0].data));
              else cb(null);
      });
    },
    fixPlaylistToFitSchedule(){
      //TODO REWORK THIS SHIT!
      this.getAllPlaylistData(new Date(), (playlistD)=>{
        var songs = playlistD[1];
        var schedule = playlistD[0].day[new Date().getDay()] ? playlistD[0].enabledTimes : [];
        if(songs.length == 0) return;
        var beginning = new Date(songs[0].date*1000);
        var songInd = 0;
        var actSchInd = 0;
        while(songInd < songs.length){
          songs[songInd].length = parseInt(songs[songInd].length)
          beginning = new Date(Math.max(new Date(songs[songInd].date*1000), beginning));
          while(actSchInd < schedule.length && (schedule[actSchInd].end.hour < beginning.getHours() || 
                (schedule[actSchInd].end.hour == beginning.getHours() && schedule[actSchInd].end.minutes <= beginning.getMinutes()))){
                  actSchInd++;
          }
          if(actSchInd == schedule.length){ 
            var timestamp = Math.floor(beginning.getTime()/1000);
            this.con.query("DELETE FROM playlist WHERE DATE(date)=DATE(FROM_UNIXTIME("+timestamp+")) AND date>=FROM_UNIXTIME("+timestamp+");",
            (err, result, fields) => {
              if(err) console.log(err);
            });
            return; 
          }// TODO remove all next songs
          var tmpDate = new Date(beginning.getFullYear(),beginning.getMonth(), beginning.getDate(), schedule[actSchInd].begin.hour, schedule[actSchInd].begin.minutes)
          beginning = new Date(Math.max(tmpDate, beginning));
          var timestamp = Math.floor(beginning.getTime()/1000);
          beginning = new Date((timestamp+songs[songInd].length)*1000);
          if(timestamp > songs[songInd].date) {
            this.con.query("UPDATE playlist SET date=FROM_UNIXTIME("+timestamp+") WHERE id="+songs[songInd].id+";",
              (err, result, fields) => {
                if(err) console.log(err);
              });
          }
          songInd++;
        }
        player.sendPlaylistData();
      });
    },
    getSettings(){

    },
    setSettings(){

    }
});