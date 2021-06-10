/* eslint-disable import/no-cycle */
import YTmp3 from 'youtube-mp3-downloader';
import ytdl from 'ytdl-core';
import p from 'play-sound';
import fs from 'fs';
import normalize from 'ffmpeg-normalize';
import { database } from '../database/database';
import { notification } from './notification';
import { amplifier } from './amplifier';
import cfg from '../config/general';

const pl = {
  instance: null,
  get getInstance() {
    if (!this.instance) {
      this.instance = {
        singletonMethod() {
          return 'singletonMethod';
        },
        type: 'NoClassSingleton',
        get getType() { return this.type; },
        set getType(value) { this.type = value; },
      };
    } return this.instance;
  },
};
export default pl; // singleton stuff, don't care about it

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const player = Object.assign({}, {
  singletonMethod() {
    return 'singletonMethod';
  },
  type: 'PlayerController',
  get getType() {
    return this.type;
  },
  set getType(value) {
    this.type = value;
  },

  YD: new YTmp3({
    ffmpegPath: cfg.ffmpegPath, // Where is the FFmpeg binary located?
    outputPath: './Music', // Where should the downloaded and encoded files be stored?
    youtubeVideoQuality: 'highest', // What video quality should be used?
    queueParallelism: 2, // How many parallel downloads/encodes should be started?
    progressTimeout: 2000, // How long should be the interval of the progress reports
  }),
  p: p({}),
  audio: null,
  shuffleTimeout: null,
  isPlaying: false,
  isShuffle: false,
  songInfo: {},
  startTime: new Date(),
  downloadQ: [],
  init() {
    player.YD.on('error', (error, data) => {
      console.error(error, data);
      player.downloadQ.splice(player.downloadQ.indexOf(data.videoId), 1);
      notification.notify({ msg: 'Wystąpił problem podczas pobierania' }, true);
    });
    player.YD.on('progress', (progress) => {
      console.log(JSON.stringify(progress));
    });
    player.YD.on('finished', (err, data) => {
      const song = {
        ytid: data.videoId,
        file: data.file.split('/')[2],
      };

      player.downloadQ.splice(player.downloadQ.indexOf(data.videoId), 1);

      // NORMALIZATION
      fs.rename(data.file, `${data.file}.TEMP`, () => {
        normalize({
          input: `${data.file}.TEMP`,
          output: data.file,
          loudness: {
            normalization: 'rms',
            target:
                        {
                          input_i: -10, // TARGET NORMALISED VOLUME
                        },
          },
          verbose: false,
        }).then((normalized) => {
          console.log(`Normalized ${normalized.info.output.split('/')[2]}!`);
          fs.unlinkSync(`${data.file}.TEMP`);
        }).catch((error) => {
          console.error(error);
        });
      });

      ytdl.getBasicInfo(data.videoId).then((result) => {
        console.log(`Finished downloading ${result.videoDetails.title} to ${song.file}`);
        notification.notify({ msg: `Pomyślnie pobrano ${result.videoDetails.title}`, newSong: result.videoDetails.title }, true);
        song.name = result.videoDetails.title;
        song.author = result.videoDetails.author.name;
        song.length = result.videoDetails.lengthSeconds;
        database.updateSong(song);
      }).catch((error) => {
        console.log(error);
      });
    });
    player.YD.on('queueSize', (size) => {
      console.log(`${size} left in queue`);
    });
    player.startPlaylistWatchman();
  },
  playSong(fileName, name, length, ytid) {
    this.clearLastPlay();
    player.isPlaying = true;
    player.startTime = new Date();
    player.songInfo.name = name;
    player.songInfo.length = length;
    player.songInfo.ytid = ytid;
    console.log(`playing ${name} from ${fileName} ${length}seconds`);
    if (!cfg.demo) {
      if (fs.existsSync(`./Music/${fileName}`)) {
        this.audio = this.p.play(`./Music/${fileName}`, { mplayer: cfg.mplayerParameters }, (err) => {
          if (err && !err.killed && err !== 1) throw err;
        });
      } else if (fs.existsSync(`../Music/${fileName}`)) {
        this.audio = this.p.play(`../Music/${fileName}`, { mplayer: cfg.mplayerParameters }, (err) => {
          if (err && !err.killed && err !== 1) throw err;
        });
      } else throw new Error('playing failed. File not found!');
    }
    player.sendPlayerData();
    database.addHistory({ date: new Date(), ytid });
    player.shuffleTimeout = setTimeout(() => {
      player.isPlaying = false;
      player.songInfo = {};
      player.sendPlayerData();
      player.nextShuffle();
    }, length * 1000);
  },
  nextShuffle() {
    if (this.isShuffle) {
      this.isShuffle = true;
      database.getRandomSong().then((song) => {
        if (song) player.playSong(song.file, song.name, song.length, song.ytid);
      });
    }
  },
  switchShuffle() {
    this.isShuffle = !this.isShuffle;
    this.sendPlayerData();
  },
  playShuffle() {
    if (!this.isShuffle) {
      this.isShuffle = true;
      if (!this.isPlaying) this.sendPlayerData();
    }
    database.getPlaylistData().then((res) => {
      if (res.length === 0 || res[0].date * 1000 > new Date().getTime()) {
        if (!this.isPlaying) this.nextShuffle();
      }
    });
  },
  clearLastPlay() {
    if (this.audio) {
      this.audio.kill();
      this.audio = null;
    } if (this.shuffleTimeout) {
      clearTimeout(this.shuffleTimeout);
      this.shuffleTimeout = null;
    }
    this.songInfo = {};
  },
  stopPlaying(leaveSuffle) {
    this.clearLastPlay();
    const tmp = this.isPlaying;
    this.isPlaying = false;
    if (!leaveSuffle) this.isShuffle = false;
    if (tmp) {
      console.log('stopped playing');
      this.sendPlayerData();
    }
  },
  deleteSong(ytid) {
    if (ytid === this.songInfo.ytid) this.stopPlaying(true);
    database.deleteSong(ytid).then((res) => {
      try {
        fs.unlinkSync(`./Music/${res.file}`);
        notification.notify({ msg: `Usunięto ${res.name}`, deletedSong: res.name }, true);
      } catch (err) {
        console.log(err);
        notification.notify({ msg: `Usunięto ${res.name} z bazy danych, jednak nie udało się usunąć pliku mp3`, deletedSong: res.name }, true);
      }
    });
  },
  downloadSong(ytid) {
    if (cfg.demo) {
      notification.notify({ msg: 'Pobieranie jest wyłączone w trybie demostracyjnym' }, true);
      return;
    }

    database.getSong(ytid).then((res) => {
      if (res) {
        console.log(`Video already downloaded to ${res.file}`);
        notification.notify({ msg: `Pomijam ${ytid} - jest już pobrane` }, true);
        return;
      }
      if (player.downloadQ.indexOf(ytid) !== -1) {
        console.log('Video already in queue');
        notification.notify({ msg: `Pomijam ${ytid} - już w kolejce` }, true);
        return;
      }

      const song = {
        ytid,
        file: `${makeid(10)}.mp3`,
      };

      while (fs.existsSync(`./Music/${song.file}`)) song.file = `${makeid(10)}.mp3`;

      player.downloadQ.push(ytid);
      player.YD.download(ytid, song.file);
    });
  },
  downloadSongs(ytids) {
    if (cfg.demo) {
      notification.notify({ msg: 'Pobieranie jest wyłączone w trybie demostracyjnym' }, true);
      return;
    }
    for (let i = 0; i < ytids.length; i += 1) {
      this.downloadSong(ytids[i]);
    }
  },
  sendPlayerData() {
    notification.notify({ player: this.getInfo() });
  },
  sendPlaylistData() {
    database.getAllPlaylistData().then((data) => {
      notification.notify({ amplifier: data[0], playlist: data[1] });
    });
  },
  getInfo() {
    const time = Math.floor(((new Date()).getTime() - this.startTime.getTime()) / 1000);
    return {
      isPlaying: this.isPlaying,
      time,
      isShuffle: this.isShuffle,
      song: this.songInfo,
      amplifierMode: amplifier.mode,
      volume: amplifier.volume,
    };
  },
  changePlaylist(data, isAdmin) {
    this.sendPlaylistData();
    return database.modifyPlaylist(data, isAdmin);
  },
  changeSchedule(data) {
    database.setAmplifierTimeSchedule(data);
    this.sendPlaylistData();
  },
  startPlaylistWatchman() {
    amplifier.startWatchman();
    const Dhelper = new Date();
    setInterval(() => {
      if (Dhelper.getDate() !== new Date().getDate()) database.fixPlaylistToFitSchedule();
      database.getPlaylistData().then((res) => {
        if (res.length === 0) return;
        if ((res[0].date * 1000) + (cfg.timeOffset * 1000) <= new Date().getTime()) {
          this.playSong(res[0].file, res[0].name, res[0].length, res[0].ytid);
          database.modifyPlaylist({ id: res[0].id, was: 1 });
        }
      });
    }, 1000);
  },
});
