'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.database = undefined;

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var db = { _instance: null, get instance() {
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
exports.default = db; //singleton stuff, don't care about it

var database = exports.database = Object.assign({}, {
  singletonMethod: function singletonMethod() {
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
  init: function init(cfg) {
    this.con = _mysql2.default.createConnection(cfg);
    this.con.connect(function (err) {
      if (err) {
        console.log("Error while database connecting:", err);
        setTimeout(function () {
          return database.init(cfg);
        }, 2000);
      } else {
        console.log("connected to database");
        database.validateAndFix(cfg);
      }
    });
    this.con.on('error', function (err) {
      console.log('db error', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === "ECONNRESET") {
        setTimeout(function () {
          return database.init(cfg);
        }, 2000);
      } else {
        throw err;
      }
    });
  },
  validateAndFix: function validateAndFix(cfg) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log("Database validation...");
              _context.next = 3;
              return _this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '" + cfg.database + "' AND table_name = 'users' LIMIT 1;", function (err, result, fields) {
                if (err) console.log(err);else {
                  if (result.length == 0) {
                    console.log("Users table not found, creating...");
                    _this.con.query("CREATE TABLE `vFAJuE5WlU`.`users` ( `id` VARCHAR(30) NOT NULL , `name` VARCHAR(30) NOT NULL , `mail` VARCHAR(60) NOT NULL , `picture` VARCHAR(150) NOT NULL , `isAdmin` BOOLEAN NOT NULL  DEFAULT FALSE , PRIMARY KEY (`id`)) ENGINE = InnoDB;", function (err, result, fields) {
                      if (err) console.log(err);else console.log('Created table users');
                    });
                  }
                }
              });

            case 3:
              _context.next = 5;
              return _this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '" + cfg.database + "' AND table_name = 'songs' LIMIT 1;", function (err, result, fields) {
                if (err) console.log(err);else {
                  if (result.length == 0) {
                    console.log("Songs table not found, creating...");
                    _this.con.query("CREATE TABLE `vFAJuE5WlU`.`songs` ( `ytid` VARCHAR(30) NOT NULL , `name` VARCHAR(150) NOT NULL , `length` VARCHAR(10) NOT NULL , `author` VARCHAR(30) NOT NULL , `file` VARCHAR(30) NOT NULL , PRIMARY KEY (`ytid`)) ENGINE = InnoDB;", function (err, result, fields) {
                      if (err) console.log(err);else console.log('Created table songs');
                    });
                  }
                }
              });

            case 5:
              _context.next = 7;
              return _this.con.query("SELECT * FROM information_schema.tables WHERE table_schema = '" + cfg.database + "' AND table_name = 'timeSchedule' LIMIT 1;", function (err, result, fields) {
                if (err) console.log(err);else {
                  if (result.length == 0) {
                    console.log("TimeSchedule table not found, creating...");
                    _this.con.query("CREATE TABLE `vFAJuE5WlU`.`timeSchedule` ( `id` INT NOT NULL AUTO_INCREMENT , `data` TEXT NOT NULL , `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , PRIMARY KEY (`id`)) ENGINE = InnoDB;", function (err, result, fields) {
                      if (err) console.log(err);else console.log('Created table timeSchedule');
                    });
                  }
                }
              });

            case 7:
              console.log("Database validation done");

            case 8:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  },
  getUser: function getUser(userId, cb) {
    this.con.query("SELECT * FROM `users` WHERE id='" + userId + "'", function (err, result, fields) {
      if (err) console.log(err);else {
        cb(result[0]);
      }
    });
  },
  updateUser: function updateUser(userData, cb) {
    this.con.query("INSERT INTO `users`(`id`, `name`, `mail`, `picture`) VALUES " + "('" + userData.id + "','" + userData.name + "','" + userData.email + "','" + userData.picture.data.url + "') ON DUPLICATE KEY UPDATE " + "name='" + userData.name + "', mail='" + userData.email + "', picture='" + userData.picture.data.url + "'", function (err, result, fields) {
      if (err) console.log(err);else {
        if (cb) cb(result);
      }
    });
  },
  getSong: function getSong(songId, cb) {
    this.con.query("SELECT * FROM `songs` WHERE ytid='" + songId + "'", function (err, result, fields) {
      if (err) console.log(err);else {
        cb(result[0]);
      }
    });
  },
  getRandomSong: function getRandomSong(cb) {
    this.con.query("SELECT  * FROM songs ORDER BY RAND() LIMIT 1;", function (err, result, fields) {
      if (err) console.log(err);else {
        cb(result[0]);
      }
    });
  },
  updateSong: function updateSong(songData, cb) {
    this.con.query("INSERT INTO `songs`(`ytid`, `name`, `length`, `author`, `file`) VALUES " + "('" + songData.ytid + "','" + songData.name + "','" + songData.length + "','" + songData.author + "','" + songData.file + "')", function (err, result, fields) {
      if (err) console.log(err);else {
        if (cb) cb(result);
      }
    });
  },
  findSong: function findSong(songData, cb) {
    var query = "SELECT * FROM `songs` ";
    if (songData) {
      if (songData.ytid) query += "WHERE `ytid`='" + songData.ytid + "' ";
      if (songData.name) query += "WHERE `name` LIKE '%" + songData.name + "%' OR `author` LIKE '%" + songData.name + "%' ";
      query += "ORDER BY `name` ";
      if (songData.site) query += "LIMIT " + 30 * songData.site + " ";else query += "LIMIT 30 ";
    } else query += " ORDER BY `name` LIMIT 30;";

    this.con.query(query, function (err, result, fields) {
      if (err) console.log(err);else {
        cb(result);
      }
    });
  },
  getPlaylistData: function getPlaylistData() {
    //gets Playlist plans from now, sorted by date
  },
  modifyPlaylist: function modifyPlaylist(entry) {
    //modify or update entry
  },
  setAmplifierTimeSchedule: function setAmplifierTimeSchedule(schedule, cb) {
    if (typeof schedule === "string") schedule = JSON.parse(schedule);
    if (!schedule.day) schedule.day = [false, false, false, false, false, false, false];
    if (!schedule.enabledTimees) schedule.enabledTimes = [];
    schedule = JSON.stringify(schedule);

    this.con.query("INSERT INTO `timeSchedule`(`data`) VALUES ('" + schedule + "')", function (err, result, fields) {
      if (err) console.log(err);else if (cb) cb(result);
    });
    //adds a record
  },
  getAmplifierTimeSchedule: function getAmplifierTimeSchedule(cb) {
    this.con.query("SELECT * FROM `timeSchedule` ORDER BY `id` DESC LIMIT 1", function (err, result, fields) {
      if (err) console.log(err);else if (cb) cb(JSON.parse(result[0]));
    });
  },
  getSettings: function getSettings() {},
  setSettings: function setSettings() {}
});