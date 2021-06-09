import mysql from 'mysql';
import moment from 'moment';
import { player } from '../player/player';
import cfg from '../config/general';
import ytcore from 'ytdl-core';
import getYouTubeID from 'get-youtube-id';

const db = { _instance: null, get instance() { if (!this._instance) { this._instance = { singletonMethod() { return 'singletonMethod'; }, _type: 'NoClassSingleton', get type() { return this._type; }, set type(value) { this._type = value; } }; } return this._instance; } };
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
  queryPromise(query, params, doUntilReady) {
    var p = new Promise(function (resolve, reject) {
      database.con.query(query, params, function (err, rows, fields) {
        if (err) {
          console.log(err)
          if (doUntilReady)
            return database.queryPromise(query, params, doUntilReady).then(r => {
              resolve(r)
            })
          else
            return reject(err);
        }
        resolve({ rows: rows, fields: fields });
      });
    });
    p.catch((e) => console.error(e))
    return p;
  },
  async init(cfg, cb) {
    this.con = mysql.createConnection(cfg);
    this.con.connect((err) => {
      if (err) {
        console.log("Error while database connecting:", err);
        setTimeout(() => database.init(cfg, cb), 2000);
      } else {
        console.log("connected to database");
        database.validateAndFix(cfg).then(() => cb()).catch(e => {
          console.log("Error while valitating database:", e);
          this.con.end();
          this.init(cfg, cb)
        });
      }
    });
    this.con.on('error', function (err) {
      console.log('db error', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === "ECONNRESET") {
        setTimeout(() => database.init(cfg, cb), 2000);
      } else {
        throw err;
      }
    });
  },
  async validateAndFix(cfg) {
    console.log("Database validation...");
    var r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users' LIMIT 1;", [cfg.database], true)

    if (r.rows.length == 0) {
      console.log("Users table not found, creating...");
      await this.queryPromise("CREATE TABLE `users` ( `id` VARCHAR(30) NOT NULL , `name` VARCHAR(30) NOT NULL , `mail` VARCHAR(60) NOT NULL , `picture` VARCHAR(150) NOT NULL , `isAdmin` BOOLEAN NOT NULL  DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;", [cfg.database], true)
      console.log('Created table users');
    }
    r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'songs' LIMIT 1;", [cfg.database], true)
    if (r.rows.length == 0) {
      console.log("Songs table not found, creating...");
      await this.queryPromise("CREATE TABLE `songs` ( `ytid` VARCHAR(30) NOT NULL , `name` VARCHAR(150) NOT NULL , `length` VARCHAR(10) NOT NULL , `author` VARCHAR(50) NOT NULL , `file` VARCHAR(30) NOT NULL , PRIMARY KEY (`ytid`)) ENGINE = InnoDB;", [cfg.database], true)
      console.log('Created table songs');
    }
    r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'timeSchedule' LIMIT 1;", [cfg.database], true)
    if (r.rows.length == 0) {
      console.log("TimeSchedule table not found, creating...");
      await this.queryPromise("CREATE TABLE `timeSchedule` ( `id` INT NOT NULL AUTO_INCREMENT , `data` TEXT NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, `amplifierMode` INT NOT NULL, PRIMARY KEY (`id`)) ENGINE = InnoDB;", [], true)
      console.log('Created table timeSchedule');
      await this.queryPromise("INSERT INTO `timeSchedule` (`data`, `date`, `amplifierMode`) VALUES ('{\"enabledTimes\":[],\"day\":[false,false,false,false,false,false,false]}', '2020-01-01 01:00:00', 0);", [cfg.database], true)
      console.log('Inserted default time schedule');
    }
    r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'playlist' LIMIT 1;", [cfg.database], true)
    if (r.rows.length == 0) {
      console.log("Playlist table not found, creating...");
      await this.queryPromise("CREATE TABLE `playlist` ( `id` INT NOT NULL AUTO_INCREMENT , `ytid` VARCHAR(30) NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `was` BOOLEAN NOT NULL DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;", [cfg.database], true)
      console.log('Created table playlist');
    }
    r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'history' LIMIT 1;", [cfg.database], true)
    if (r.rows.length == 0) {
      console.log("History table not found, creating...");
      await this.queryPromise("CREATE TABLE `history` ( `id` INT NOT NULL AUTO_INCREMENT , `ytid` VARCHAR(30) NOT NULL , `date` TIMESTAMP NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;", [cfg.database], true)
      console.log('Created table history');
    }
    r = await this.queryPromise("SELECT * FROM information_schema.tables WHERE table_schema = ? AND table_name = 'suggestions' LIMIT 1;", [cfg.database], true)
    if (r.rows.length == 0) {
      console.log("Suggestions table not found, creating...");
      await this.queryPromise("CREATE TABLE `suggestions` ( `id` int(11) NOT NULL AUTO_INCREMENT, `ytid` varchar(150) DEFAULT NULL, `name` text NOT NULL, `views` int(11) NOT NULL, `userId` varchar(150) NOT NULL, `status` tinyint(4) NOT NULL, PRIMARY KEY (`id`), UNIQUE KEY `ytid` (`ytid`) ) ENGINE=InnoDB;", [cfg.database], true)
      console.log('Created table suggestions');
    }
    await this.fixPlaylistToFitSchedule();
  },
  async getUser(userId) {
    return (await this.queryPromise("SELECT * FROM `users` WHERE id=?", [userId])).rows[0];
  },
  async getIPUser(ip) {
    return (await this.queryPromise("INSERT IGNORE INTO `users` SET id=?, name='Anon', mail='none', picture='https://getdrawings.com/free-icon-bw/facebook-avatar-icon-3.png', isAdmin=FALSE" +
      ";SELECT * FROM `users` WHERE id=?", [ip, ip])).rows[1][0];
  },
  async updateUser(userData) {
    return (await this.queryPromise("INSERT INTO `users`(`id`, `name`, `mail`, `picture`) VALUES " +
      "(?,?,?,?) ON DUPLICATE KEY UPDATE name=?, mail=?, picture=?",
      [userData.id, userData.name, userData.email, userData.picture.data.url,
      userData.name, userData.email, userData.picture.data.url])).rows;
  },
  async getSong(songId) {
    return (await this.queryPromise("SELECT * FROM `songs` WHERE ytid=?", [songId])).rows[0];
  },
  async getSongFiles() {
    return (await this.queryPromise("SELECT ytid, file FROM `songs`")).rows;
  },
  async getRandomSong() {
    return (await this.queryPromise("SET @id= (SELECT IFNULL((SELECT a.ytid FROM (SELECT ytid FROM ( SELECT COUNT(*) AS a, ytid FROM history WHERE YEARWEEK(DATE(date))=YEARWEEK(CURRENT_DATE) GROUP BY ytid UNION SELECT COUNT(*) as a, ytid FROM playlist WHERE YEARWEEK(DATE(date))=YEARWEEK(CURRENT_DATE) GROUP BY ytid UNION SELECT 0 as a, ytid FROM songs GROUP BY ytid )tbl GROUP BY ytid HAVING SUM(tbl.a) < ?)a INNER JOIN (SELECT SUM(tbl.a) as s, ytid FROM ( SELECT COUNT(*) AS a, ytid FROM history WHERE DATE(date)=CURRENT_DATE GROUP BY ytid UNION SELECT COUNT(*) as a, ytid FROM playlist WHERE DATE(date)=CURRENT_DATE GROUP BY ytid UNION SELECT 0 as a, ytid FROM songs GROUP BY ytid )tbl GROUP BY ytid HAVING SUM(tbl.a) < ?)b ON a.ytid = b.ytid ORDER BY RAND() LIMIT 1), (SELECT ytid FROM songs ORDER BY RAND() LIMIT 1)) AS ytid);" +
      "SELECT * FROM songs WHERE ytid=@id;", [cfg.maxPerWeek, cfg.maxPerDay])).rows[1][0];
  },
  async deleteSong(songId) {
    return (await this.queryPromise("SELECT * FROM `songs` WHERE ytid=?; DELETE FROM `songs` WHERE ytid=?", [songId, songId])).rows[0][0];
  },
  async updateSong(songData) { //TODO UPDATE
    return (await this.queryPromise("INSERT INTO `songs`(`ytid`, `name`, `length`, `author`, `file`) VALUES "+ 
    "(?,?,?,?,?) ON DUPLICATE KEY UPDATE name=?, length=?, author=?, file=?",
    [songData.ytid, songData.name, songData.length, songData.author, songData.file, songData.name, songData.length, songData.author, songData.file])).rows;
  },
  async findSong(songData) { //TODO better searching!
    var query = "SELECT * FROM `songs` ";
    var query2 = "SELECT COUNT(*) FROM `songs` ";
    var inserts = [];
    var inserts2 = [];
    if (songData) {
      if (songData.ytid) {
        query += "WHERE `ytid`=? ";
        query2 += "WHERE `ytid`=? ";
        inserts.push(songData.ytid);
        inserts2.push(songData.ytid);
      }
      if (songData.name) {
        var keywords = songData.name.split(" ");
        query += "WHERE ";
        query2 += "WHERE ";

        for (var i = 0; i < keywords.length; i++) {
          query += "(`name` LIKE ? OR `author` LIKE ?) ";
          query2 += "(`name` LIKE ? OR `author` LIKE ?) ";
          if (i + 1 < keywords.length) {
            query += "AND ";
            query2 += "AND ";
          }
          inserts.push("%" + keywords[i] + "%", "%" + keywords[i] + "%")
          inserts2.push("%" + keywords[i] + "%", "%" + keywords[i] + "%")
        }
      }
      query += "ORDER BY `name` ";
      if (songData.site) {
        query += "LIMIT ?";
        inserts.push(30 * songData.site)
      } else
        query += "LIMIT 30 ";
    } else {
      query += " ORDER BY `name` LIMIT 30";
    }
    inserts.push.apply(inserts, inserts2)
    var r = await this.queryPromise(query + ";" + query2 + ";", inserts)
    return { result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"] };
  },
  async addHistory(data) {
    if (typeof (data.date) === "number") data.date = new Date(data.date * 1000);
    if (typeof (data.date) === "string") data.date = new Date(data.date);
    data.date = Math.floor(data.date.getTime() / 1000);
    return (await this.queryPromise("INSERT INTO `history`(`ytid`, `date`) VALUES " +
      "(? ,FROM_UNIXTIME(?));", [data.ytid, data.date])).rows;
  },
  async getHistory(date, site) {
    var query = "SELECT * FROM history INNER JOIN songs ON songs.ytid = history.ytid WHERE ";
    var query2 = "SELECT COUNT(*) FROM history WHERE ";
    var inserts = [];
    var inserts2 = [];

    if (date) {
      if (typeof (date) === "number") date = new Date(date * 1000);
      if (typeof (date) === "string") date = new Date(date);
      date = Math.floor(date.getTime() / 1000);
      query += "DATE(history.date) <= DATE(FROM_UNIXTIME(?))";
      query2 += "DATE(history.date) <= DATE(FROM_UNIXTIME(?))";
      inserts.push(date);
      inserts2.push(date);
    } else {
      query += "1";
      query2 += "1";
    }

    if (!site) site = 1;
    query += " ORDER by history.date DESC ";
    query += "LIMIT ?";
    inserts.push(30 * site)
    inserts.push.apply(inserts, inserts2)
    var r = await this.queryPromise(query + ";" + query2 + ";", inserts)
    return { result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"] };
  },
  async updateSuggestion(sData) {
    var query = "";
    var inserts = []
    if (sData && sData.id && sData.status) {
      query = "UPDATE suggestions SET status=? WHERE id=?;";
      inserts.push(sData.status, sData.id)
    } else if (sData.userId && sData.ytid) {
      try {
        var info = await ytcore.getBasicInfo(sData.ytid)
      } catch (e) {
        return { err: "Failed to get video data" }
      }
      query = "INSERT IGNORE INTO suggestions (userId, status, ytid, name, views) VALUES(?, 0, ?, ?, ?);"
      inserts.push(sData.userId, sData.ytid, info.videoDetails.title, info.videoDetails.viewCount)
    }
    if (!sData || query === "") {
      return { err: "Wrong suggestion data" };
    } else
      return { res: (await this.queryPromise(query, inserts)).rows }
  },
  async getSuggestions(sData) {
    if (!sData || !(sData.waiting || sData.accepted || sData.denied)) {
      return { result: [], totalNum: 0 };
    }
    var query = "SELECT *, suggestions.name as NAME, suggestions.id as id FROM suggestions INNER JOIN users ON users.id=suggestions.userId WHERE ";
    var query2 = "SELECT COUNT(*) FROM suggestions INNER JOIN users ON users.id=suggestions.userId WHERE ";
    var inserts = [];
    var inserts2 = [];
    if (sData && sData.userId) {
      query += "suggestions.userId=" + sData.userId + " AND ";
      query2 += "suggestions.userId=" + sData.userId + " AND ";
      inserts.push(sData.userId)
      inserts2.push(sData.userId)
    }
    query += "status IN (";
    query2 += "status IN (";
    if (sData) {
      var statuses = [];
      if (sData.waiting) statuses.push(0);
      if (sData.accepted) statuses.push(1);
      if (sData.denied) statuses.push(-1);
      var tmp = "";
      for (var i = 0; i < statuses.length; i++) {
        tmp += "?,";
        inserts.push(statuses[i])
        inserts2.push(statuses[i])
      }
      if (statuses.length > 0)
        tmp = tmp.slice(0, -1);
      query += tmp;
      query2 += tmp;
    }
    query += ")";
    query2 += ")";

    query += " ORDER BY suggestions.id DESC";
    var site = sData.site || 1;
    query += " LIMIT ?";
    inserts.push(30 * site)
    inserts.push.apply(inserts, inserts2);
    var r = await this.queryPromise(query + ";" + query2, inserts);
    return { result: r.rows[0], totalNum: r.rows[1][0]["COUNT(*)"] };
  },
  async getAllPlaylistData(date) {
    var query = "SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1;" +
      "SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid WHERE ";
    var inserts = [];

    if (date) {
      if (typeof (date) === "number") date = new Date(date * 1000);
      if (typeof (date) === "string") date = new Date(date);
      if (!date || isNaN(date)) date = new Date();
      date.setHours(0, 0, 0, 0);
      var dateTo = new Date(date);
      dateTo.setHours(23, 59, 59, 999);
      date = Math.floor(date.getTime() / 1000);
      dateTo = Math.floor(dateTo.getTime() / 1000);
      query += "playlist.date>FROM_UNIXTIME(?) AND playlist.date<FROM_UNIXTIME(?)";
      inserts.push(date, dateTo)
    } else {
      date = new Date();
      date.setHours(0, 0, 0, 0);
      date = Math.floor(date.getTime() / 1000);
      query += "playlist.date>DATE(FROM_UNIXTIME(?))";
      inserts.push(date)
    }

    query += " ORDER by playlist.date ASC;";

    var r = await this.queryPromise(query, inserts);
    if (r.rows[0].length > 0)
      r.rows[0] = JSON.parse(r.rows[0][0].data)
    return r.rows;
  },
  async getPlaylistData() {
    var time = new Date(Date.now() - 30000 - cfg.timeOffset * 1000);
    time = Math.floor(time.getTime() / 1000);
    return (await this.queryPromise(" UPDATE `playlist` SET `was`=1 WHERE `date`<FROM_UNIXTIME(?); SELECT playlist.id, UNIX_TIMESTAMP(playlist.date) AS date, songs.* FROM songs INNER JOIN playlist ON songs.ytid = playlist.ytid AND playlist.was=0 ORDER BY `date` ASC;", [time])
    ).rows[1];
  },

  async modifyPlaylist(entry, isAdmin) {
    if (typeof (entry.date) === "string")
      entry.date = new Date(entry.date);
    if (entry.date instanceof Date)
      entry.date = entry.date.getTime();
    entry.date = Math.floor(entry.date / 1000);
    if (entry.id) {
      if (entry.delete) {
        var query = "DELETE FROM playlist";
        query += " WHERE id=?";
        return new Promise(resolve => {
          this.queryPromise(query, [entry.id]).then((r) => {
            database.fixPlaylistToFitSchedule(entry.date)
            resolve(r.rows)
          })
        })
      } else {
        var query = "UPDATE playlist SET";
        var inserts = [];
        if (entry.ytid) {
          query += " ytid=?";
          inserts.push(entry.ytid)
        }
        if (entry.date) {
          query += " date=?";
          inserts.push(entry.date)
        }
        if (entry.was) {
          query += " was=?";
          inserts.push(entry.was)
        }
        query += " WHERE id=?";
        inserts.push(entry.id)
        return new Promise(resolve => {
          this.queryPromise(query, inserts).then((r) => {
            database.fixPlaylistToFitSchedule(entry.date)
            resolve(r.rows)
          })
        })
      }
    } else
      if (isAdmin) {
        return new Promise(resolve => {
          this.queryPromise("INSERT INTO `playlist`(`ytid`, date) VALUES (?, FROM_UNIXTIME(?)) ", [entry.ytid, entry.date])
            .then((r) => {
              database.fixPlaylistToFitSchedule(entry.date)
              resolve(r.rows.affectedRows)
            })
        })
      } else {
        return new Promise(resolve => {
          // check if you can add song to playlist
          // check for perDay and perWeek limit
          // and check if there is already song at this time
          this.queryPromise(`
              SELECT count(*) FROM history
              WHERE DATE(date) = DATE(FROM_UNIXTIME(?)) AND ytid=?;
              SELECT count(*) FROM playlist WHERE DATE(date) = DATE(FROM_UNIXTIME(?))
              AND date > CURRENT_TIMESTAMP AND ytid=?;
              SELECT count(*) FROM history WHERE YEARWEEK(DATE(date), 1) = YEARWEEK(DATE(FROM_UNIXTIME(?)), 1) 
              AND ytid=?;
              SELECT count(*) FROM playlist WHERE YEARWEEK(DATE(date), 1) = YEARWEEK(DATE(FROM_UNIXTIME(?)), 1)
              AND date > CURRENT_TIMESTAMP AND ytid=?;
              SELECT count(*) FROM playlist WHERE UNIX_TIMESTAMP(date) <= ? 
              AND (UNIX_TIMESTAMP(date) + (SELECT length FROM songs WHERE ytid = playlist.ytid LIMIT 1)) > ?;
              SELECT count(*) FROM playlist WHERE (? < UNIX_TIMESTAMP(date)) 
              AND (? + (SELECT length FROM songs WHERE ytid = ?) >= UNIX_TIMESTAMP(date));
              `,
            [entry.date, entry.ytid, entry.date, entry.ytid, entry.date, entry.ytid, entry.date, entry.ytid, entry.date, entry.date, entry.date, entry.date, entry.ytid])
            .then((r) => {
              if (
                r.rows[0][0]['count(*)'] + r.rows[1][0]['count(*)'] < cfg.maxPerDay &&
                r.rows[2][0]['count(*)'] + r.rows[3][0]['count(*)'] < cfg.maxPerWeek
              ) {
                // limits are OK
                if (r.rows[4][0]['count(*)'] == 0 && r.rows[5][0]['count(*)'] == 0) {
                  // this time is available
                  // add song to playlist
                  this.queryPromise("INSERT INTO `playlist`(`ytid`, date) VALUES (?, FROM_UNIXTIME(?)) ", [entry.ytid, entry.date])
                    .then((r) => {
                      database.fixPlaylistToFitSchedule(entry.date)
                      resolve(1)
                    })
                } else {
                  // this time is not available!!
                  resolve(2)
                }
              } else {
                // limits are not OK!!
                resolve(0)
              }

            })
        })
      }
    //date FROM_UNIXTIME('Date.toMiliseconds or smthg')
    //modify or update entry
  },
  setAmplifierTimeSchedule(schedule) {
    if (typeof schedule === "string")
      schedule = JSON.parse(schedule);
    if (!schedule.day)
      schedule.day = [false, false, false, false, false, false, false];
    if (!schedule.enabledTimes)
      schedule.enabledTimes = [];
    schedule = JSON.stringify(schedule);

    return new Promise(resolve => {
      this.queryPromise("UPDATE `timeSchedule` SET `data`=?;", [schedule]).then(r => {
        database.fixPlaylistToFitSchedule();
        resolve(r.rows)
      })
    })
  },
  async getScheduleAndAmplifierMode() {
    var r = await this.queryPromise("SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1")
    r.rows[0].data = JSON.parse(r.rows[0].data)
    return r.rows[0]
  },
  async setAmplifierMode(mode) {
    mode = parseInt(mode);

    return new Promise(resolve => {
      this.queryPromise("UPDATE `timeSchedule` SET `amplifierMode`=?;", [mode])
        .then(r => {
          this.fixPlaylistToFitSchedule();
          resolve(r.rows)
        })
    })
  },
  fixPlaylistToFitSchedule(date) {
    if (typeof (date) === "number") date = new Date(date * 1000);
    if (typeof (date) === "string") date = new Date(date);
    if (!date || isNaN(date)) date = new Date();

    return new Promise((resolve, reject) => {
      this.getAllPlaylistData(date).then((playlistD) => {
        var songs = playlistD[1];
        var schedule = playlistD[0].day[new Date(date).getDay()] ? playlistD[0].enabledTimes : [];
        if (songs.length == 0) return resolve();
        var beginning = new Date(songs[0].date * 1000);
        var songInd = 0;
        var actSchInd = 0;
        while (songInd < songs.length) {
          songs[songInd].length = parseInt(songs[songInd].length)
          beginning = new Date(Math.max(new Date(songs[songInd].date * 1000), beginning));
          while (actSchInd < schedule.length && (schedule[actSchInd].end.hour < beginning.getHours() ||
            (schedule[actSchInd].end.hour == beginning.getHours() && schedule[actSchInd].end.minutes <= beginning.getMinutes()))) {
            actSchInd++;
          }
          if (actSchInd == schedule.length) {
            var timestamp = Math.floor(beginning.getTime() / 1000);
            this.queryPromise("DELETE FROM playlist WHERE id=?;", [songs[songInd].id])
              .catch((e) => reject(e)).then((r) => {
                player.sendPlaylistData(r);
                resolve();
              })
            songInd++;
            continue;
          }
          var tmpDate = new Date(beginning.getFullYear(), beginning.getMonth(), beginning.getDate(), schedule[actSchInd].begin.hour, schedule[actSchInd].begin.minutes)
          beginning = new Date(Math.max(tmpDate, beginning));
          var timestamp = Math.floor(beginning.getTime() / 1000);
          beginning = new Date((timestamp + songs[songInd].length) * 1000);
          if (timestamp > songs[songInd].date) {
            this.queryPromise("UPDATE playlist SET was=0, date=FROM_UNIXTIME(?) WHERE id=?;", [timestamp, songs[songInd].id])
              .catch((e) => reject(e))
          }
          songInd++;
        }
        player.sendPlaylistData();
        resolve()
      });
    })
  },
});
