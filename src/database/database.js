import mysql from 'mysql';
import moment from 'moment';
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
    queryPromise(query, doUntilReady){
      var p = new Promise(function(resolve, reject) {
        database.con.query(query, function (err, rows, fields) {
            if (err) {
                if(doUntilReady)
                  return queryPromise(query, doUntilReady).then(r=>{
                    resolve(r)
                  })
                else
                  return reject(err);
            }
            resolve({rows: rows, fields: fields});
        });
      });
      p.catch((e)=> console.error(e))
      return p;
    },
    async init(cfg,cb){
        this.con = mysql.createConnection(cfg);
        this.con.connect((err) => {
            if (err){ 
              console.log("Error while database connecting:",err);
              setTimeout(()=>database.init(cfg, cb), 2000);
            }else{
              console.log("connected to database"); 
              database.validateAndFix(cfg).then(()=>cb()).catch(e=>{
                console.log("Error while valitating database:",e);
                this.con.end();
                this.init(cfg, cb)
              });
            }
        });
        this.con.on('error', function(err) {
            console.log('db error', err);
            if(err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === "ECONNRESET") { 
              setTimeout(()=>database.init(cfg, cb), 2000);
            } else { 
              throw err;
            }
        });
    },
    async validateAndFix(cfg){
      console.log("Database validation...");
      var r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'users' LIMIT 1;", true)
      
      if(r.rows.length == 0){
        console.log("Users table not found, creating...");
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`users` ( `id` VARCHAR(30) NOT NULL , `name` VARCHAR(30) NOT NULL , `mail` VARCHAR(60) NOT NULL , `picture` VARCHAR(150) NOT NULL , `isAdmin` BOOLEAN NOT NULL  DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;", true)
        console.log('Created table users');
      }
      r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'songs' LIMIT 1;", true)
      if(r.rows.length == 0){
        console.log("Songs table not found, creating...");
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`songs` ( `ytid` VARCHAR(30) NOT NULL , `name` VARCHAR(150) NOT NULL , `length` VARCHAR(10) NOT NULL , `author` VARCHAR(30) NOT NULL , `file` VARCHAR(30) NOT NULL , PRIMARY KEY (`ytid`)) ENGINE = InnoDB;", true)
        console.log('Created table songs');
      }
      r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'timeSchedule' LIMIT 1;", true)
      if(r.rows.length == 0){
        console.log("TimeSchedule table not found, creating..."); 
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`timeSchedule` ( `id` INT NOT NULL AUTO_INCREMENT , `data` TEXT NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `amplifierMode` INT NOT NULL, PRIMARY KEY (`id`)) ENGINE = InnoDB;",true)
        console.log('Created table timeSchedule');
        await this.queryPromise("INSERT INTO `timeSchedule` (`data`, `date`, `amplifierMode`) VALUES ('{\"enabledTimes\":[],\"day\":[false,false,false,false,false,false,false]}', '2020-01-01 01:00:00', 0);",true)
        console.log('Inserted default time schedule');
      }
      r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'playlist' LIMIT 1;",true)
      if(r.rows.length == 0){
        console.log("Playlist table not found, creating..."); 
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`playlist` ( `id` INT NOT NULL AUTO_INCREMENT , `ytid` VARCHAR(30) NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `was` BOOLEAN NOT NULL DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;",true)
        console.log('Created table playlist'); 
      }
      r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'history' LIMIT 1;",true)
      if(r.rows.length == 0){
        console.log("History table not found, creating..."); 
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`history` ( `id` INT NOT NULL AUTO_INCREMENT , `ytid` VARCHAR(30) NOT NULL , `date` TIMESTAMP NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;",true)
        console.log('Created table history'); 
      }
      r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = '"+cfg.database+"' AND table_name = 'suggestions' LIMIT 1;",true)
      if(r.rows.length == 0){
        console.log("Suggestions table not found, creating..."); 
        await this.queryPromise("CREATE TABLE `"+cfg.database+"`.`suggestions` ( `id` INT NOT NULL AUTO_INCREMENT , `url` TEXT NOT NULL , `userId` VARCHAR(30) NOT NULL , `status` TINYINT NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;",true)
        console.log('Created table suggestions'); 
      }
      await this.fixPlaylistToFitSchedule();
    },
    async getUser(userId){
      return (await this.queryPromise("SELECT * FROM `users` WHERE id='"+userId+"'")).rows[0];
    },
    async getIPUser(ip){
      return (await this.queryPromise("INSERT IGNORE INTO `users` SET id='"+ip+"', name='Anon', mail='none', picture='https://getdrawings.com/free-icon-bw/facebook-avatar-icon-3.png', isAdmin=FALSE"+
        ";SELECT * FROM `users` WHERE id='"+ip+"'")).rows[1][0];
    },
    async updateUser(userData){
      return (await this.queryPromise("INSERT INTO `users`(`id`, `name`, `mail`, `picture`) VALUES "+ 
            "('"+userData.id+"','"+userData.name+"','"+userData.email+"','"+userData.picture.data.url+"') ON DUPLICATE KEY UPDATE "+
            "name='"+userData.name+"', mail='"+userData.email+"', picture='"+userData.picture.data.url+"'")).rows;
    },
    async getSong(songId){
      return (await this.queryPromise("SELECT * FROM `songs` WHERE ytid='"+songId+"'")).rows[0];
    },
    async getRandomSong(){
      return (await this.queryPromise("SELECT  * FROM songs ORDER BY RAND() LIMIT 1;")).rows[0];
    },
    async updateSong(songData){ //TODO UPDATE/REMOVE
      return (await this.queryPromise("INSERT INTO `songs`(`ytid`, `name`, `length`, `author`, `file`) VALUES "+ 
            "('"+songData.ytid+"','"+songData.name+"','"+songData.length+"','"+songData.author+"','"+songData.file+"') ON DUPLICATE KEY UPDATE "+
            "ytid='"+songData.ytid+"', name='"+songData.name+"', length='"+songData.length+"', author='"+songData.author+"', file='"+songData.file+"'")).rows;
    },
    async findSong(songData){ //TODO better searching!
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
      var r = await this.queryPromise(query+";"+query2+";")
      return {result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"]};
    },
    async addHistory(data){
      if(data.date instanceof Number) data.date = new Date(data.date * 1000);
      if(typeof(data.date) === "string") data.date = new Date(data.date);
      data.date = Math.floor(data.date.getTime()/1000);
      return (await this.queryPromise("INSERT INTO `history`(`ytid`, `date`) VALUES "+ 
                "('"+data.ytid+"',FROM_UNIXTIME("+data.date+"));")).rows;
    },
    async getHistory(date, site){
      var query = "SELECT * FROM history INNER JOIN songs ON songs.ytid = history.ytid WHERE ";
      var query2 = "SELECT COUNT(*) FROM history WHERE ";
    
      if(date){
        if(date instanceof Number) date = new Date(date * 1000);
        if(typeof(date) === "string") date = new Date(date);
        date = Math.floor(date.getTime()/1000);
        query += "DATE(history.date) <= DATE(FROM_UNIXTIME("+date+"))";
        query2 += "DATE(history.date) <= DATE(FROM_UNIXTIME("+date+"))";
      }else{
        query += "1";
        query2 += "1";
      }

      if(!site) site = 1;
      query += " ORDER by history.date DESC ";
      query += "LIMIT "+30*site;
      var r = await this.queryPromise(query+";"+query2+";")
      return {result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"]};
    },
    async updateSuggestion(sData){ 
      var query = "";
      if(sData && sData.id && sData.status){
        query = "UPDATE suggestions SET status="+sData.status+" WHERE id="+sData.id+";";
      }else if(sData.url && sData.userId){
        query = "INSERT INTO suggestions (url, userId, status) VALUES('"+sData.url+"', '"+sData.userId+"', 0);"
      }
      if(!sData || query===""){
        return {err:"Wrong suggestion data"};
      }else
        return {res: (await this.queryPromise(query)).rows}
    },
    async getSuggestions(sData){
      if(!sData || !(sData.waiting || sData.accepted || sData.denied)){
        return {result: [], totalNum: 0};
      }
      var query = "SELECT *, suggestions.id as id FROM suggestions INNER JOIN users ON users.id=suggestions.userId WHERE ";
      var query2 = "SELECT COUNT(*) FROM suggestions INNER JOIN users ON users.id=suggestions.userId WHERE ";
      if(sData && sData.userId){
          query += "suggestions.userId="+sData.userId+" AND ";
          query2 += "suggestions.userId="+sData.userId+" AND ";
      }
      query += "status IN (";
      query2 += "status IN (";
      if(sData){
        var statuses = [];
        if(sData.waiting) statuses.push(0);
        if(sData.accepted) statuses.push(1);
        if(sData.denied) statuses.push(-1);
        var tmp ="";
        for(var i = 0; i < statuses.length; i++)
          tmp+=statuses[i]+",";
        if(statuses.length > 0)
          tmp = tmp.slice(0, -1);
        query += tmp+")";
        query2 += tmp+")";
      }

      query+= " ORDER BY suggestions.id DESC";
      var site = sData.site || 1;
      query += " LIMIT "+site*30;
      var r = await this.queryPromise(query+";"+query2);
      return {result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"]};
    },
    async getAllPlaylistData(date){
      var query = "SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1;"+
      "SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid WHERE ";
      
      if(date){
        if(date instanceof Number) date = new Date(date * 1000);
        if(typeof(date) === "string") date = new Date(date);
        date.setHours(0,0,0,0);
        var dateTo = new Date(date);
        dateTo.setHours(23,59,59,999);
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

      var r = await this.queryPromise(query);
      if(r.rows[0].length > 0)
      r.rows[0] = JSON.parse(r.rows[0][0].data)
      return r.rows;
    },
    async getPlaylistData(){
      var time = new Date(Date.now() - 30000);
      time = Math.floor(time.getTime()/1000);
      return (await this.queryPromise(" UPDATE `playlist` SET `was`=1 WHERE `date`<FROM_UNIXTIME("+time+"); SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid AND playlist.was=0 ORDER BY `date` ASC;")
              ).rows[1];
    },

    async modifyPlaylist(entry){
      if(typeof(entry.date) === "string")
        entry.date = new Date(entry.date);
      if(entry.date instanceof Date)
        entry.date = entry.date.getTime();
      entry.date = Math.floor(entry.date/1000);
      if(entry.id){
        if(entry.delete){
          var query = "DELETE FROM playlist";
          query+= " WHERE id="+entry.id;
          return new Promise(resolve =>{
            this.queryPromise(query).then((r)=>{
              database.fixPlaylistToFitSchedule()
              resolve(r.rows)
            })
          })
        }else{
          var query = "UPDATE playlist SET";
          query += !!entry.ytid ? " ytid="+entry.ytid : "";
          query += !!entry.date ? " date="+entry.date : "";
          query += !!entry.was ? " was="+entry.was : "";
          query+= " WHERE id="+entry.id;
          return new Promise(resolve =>{
            this.queryPromise(query).then((r)=>{
              database.fixPlaylistToFitSchedule()
              resolve(r.rows)
            })
          })
        }
      }else
        return new Promise(resolve =>{
          this.queryPromise("INSERT INTO `playlist`(`ytid`, date) VALUES ('"+entry.ytid+"', FROM_UNIXTIME("+entry.date+"))")
          .then((r)=>{
            database.fixPlaylistToFitSchedule()
            resolve(r.rows)
          })
        })
      //date FROM_UNIXTIME('Date.toMiliseconds or smthg')
      //modify or update entry
    },
    async setAmplifierTimeSchedule(schedule){
      if(typeof schedule === "string")
        schedule = JSON.parse(schedule);
      if(!schedule.day)
        schedule.day = [false, false, false, false, false, false, false];
      if(!schedule.enabledTimes)
        schedule.enabledTimes = [];
      schedule = JSON.stringify(schedule);
      
      return new Promise(resolve =>{
        this.queryPromise("UPDATE `timeSchedule` SET `data`='"+schedule+"';").then(r=>{
          this.fixPlaylistToFitSchedule();
          resolve(r.rows)
        })
      })
    },
    async getScheduleAndAmplifierMode(){ 
      var r = await this.queryPromise("SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1")
      r.rows[0].data = JSON.parse(r.rows[0].data)
      return r.rows[0]
    },
    async setAmplifierMode(mode){
      mode = parseInt(mode);
      
      return new Promise(resolve =>{
        this.queryPromise("UPDATE `timeSchedule` SET `amplifierMode`='"+mode+"';")
        .then(r=>{
          this.fixPlaylistToFitSchedule();
          resolve(r.rows)
        })
      })
    },
    fixPlaylistToFitSchedule(){
      return new Promise((resolve, reject) =>{
        this.getAllPlaylistData(new Date()).then((playlistD)=>{
          var songs = playlistD[1];
          var schedule = playlistD[0].day[new Date().getDay()] ? playlistD[0].enabledTimes : [];
          if(songs.length == 0) return resolve();
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
              return this.queryPromise("DELETE FROM playlist WHERE DATE(date)=DATE(FROM_UNIXTIME("+timestamp+")) AND date>=FROM_UNIXTIME("+timestamp+");")
                      .catch((e)=>reject(e)).then(()=>{
                        player.sendPlaylistData();
                        resolve()
                      })
            }
            var tmpDate = new Date(beginning.getFullYear(),beginning.getMonth(), beginning.getDate(), schedule[actSchInd].begin.hour, schedule[actSchInd].begin.minutes)
            beginning = new Date(Math.max(tmpDate, beginning));
            var timestamp = Math.floor(beginning.getTime()/1000);
            beginning = new Date((timestamp+songs[songInd].length)*1000);
            if(timestamp > songs[songInd].date) {
              this.queryPromise("UPDATE playlist SET was=0, date=FROM_UNIXTIME("+timestamp+") WHERE id="+songs[songInd].id+";")
                      .catch((e)=>reject(e))
            }
            songInd++;
          }
          player.sendPlaylistData();
          resolve()
        });
      })
    },
});