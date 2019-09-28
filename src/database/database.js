import mysql from 'mysql';

const db = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod';},_type: 'NoClassSingleton', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default db;  //singleton stuff, don't care about it

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
              this.con.query("CREATE TABLE `vFAJuE5WlU`.`users` ( `id` VARCHAR(30) NOT NULL , `name` VARCHAR(30) NOT NULL , `mail` VARCHAR(60) NOT NULL , `picture` VARCHAR(150) NOT NULL , `isAdmin` BOOLEAN NOT NULL  DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;",
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
            this.con.query("CREATE TABLE `vFAJuE5WlU`.`songs` ( `ytid` VARCHAR(30) NOT NULL , `name` VARCHAR(150) NOT NULL , `length` VARCHAR(10) NOT NULL , `author` VARCHAR(30) NOT NULL , `file` VARCHAR(30) NOT NULL , PRIMARY KEY (`ytid`)) ENGINE = InnoDB;",
            (err, result, fields)=>{
              if(err) console.log(err)
              else  console.log('Created table songs');
            });
          }
        } 
    });

      
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
      if(songData){
        if(songData.ytid)
          query+="WHERE `ytid`='"+songData.ytid+"' ";
        if(songData.name)
          query+= "WHERE `name` LIKE '%"+songData.name+"%' OR `author` LIKE '%"+songData.name+"%' ";
        query+="ORDER BY `name` ";
        if(songData.site)
          query+= "LIMIT "+30*songData.site+" ";
        else
          query+= "LIMIT 30 ";

      }else
        query += " ORDER BY `name` LIMIT 30;";
      
      this.con.query(query,
        (err, result, fields) => {
          if(err) console.log(err);
          else{
            cb(result);
          }
      });
    }
});