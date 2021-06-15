import YTmp3 from "youtube-mp3-downloader";
import { database } from "../database/database";
import ytdl from "ytdl-core";
import p from 'play-sound';
import path from 'path';
import fs, { access } from 'fs';
import { notification } from './notification';
import { amplifier } from './amplifier';
import cfg from '../config/general';
import normalize from 'ffmpeg-normalize';
import glob from 'glob';
import { constants } from "buffer";


const pl = { _instance: null, get instance() { if (!this._instance) { this._instance = { singletonMethod() { return 'singletonMethod'; }, _type: 'NoClassSingleton', get type() { return this._type; }, set type(value) { this._type = value; } }; } return this._instance; } };
export default pl;  //singleton stuff, don't care about it

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
	wantstoplay: "",
	isPlaying: false,
	isShuffle: false,
	songInfo: {},
	startTime: new Date(),
	downloadQ: [],
	removefromqueue(ytid) {
		player.downloadQ.splice(player.downloadQ.indexOf(ytid), 1);
	},
	init() {
		player.YD.on("error", function (error, data) {
			notification.notify({ msg: 'Wystąpił problem podczas pobierania' }, true);
			console.log(error, data);
			if (data && data.videoId) player.removefromqueue(data.videoId);
			else throw error;
		});
		player.YD.on("progress", function (progress) {
			console.log(JSON.stringify(progress));
			//notification.notify({msg: 'Downloading '+ytid+', '+Math.round(progress.progress.percentage)+'%'}, true);
		});
		player.YD.on("finished", function (err, data) {
			let song = {ytid: data.videoId, file: path.parse(data.file).name};
			let filepath = path.join('Music', song.file);
			console.log('Downloaded ' + song.file);

			//NORMALIZATION
			fs.rename(data.file, filepath + ".TEMP", (err) => {
				if (err) {
					player.removefromqueue(song.ytid);
					console.error(err);
					return;
				}
				console.log("Normalizing " + path.basename(song.file + '.TEMP'));
				normalize({
					input: filepath + ".TEMP",
					output: filepath,
					loudness: {
						normalization: 'rms',
						target:
						{
							input_i: -10    //TARGET NORMALIZED VOLUME
						}
					},
					verbose: false
				}).then(normalized => {
					console.log("Normalized " + path.basename(normalized.info.output));
					fs.unlinkSync(filepath + ".TEMP");
					ytdl.getBasicInfo(song.ytid).then((data) => {
						song.name = data.videoDetails.title;
						song.author = data.videoDetails.author.name;
						song.length = data.videoDetails.lengthSeconds;
						database.updateSong(song).then(() => {
							player.removefromqueue(song.ytid);
							notification.notify({ msg: 'Pomyślnie pobrano i znormalizowano ' + song.name, newSong: song.name }, true);
							console.log("Finished downloading and normalizing " + song.name + " to " + song.ytid + '.mp3');
							if (player.wantstoplay && player.wantstoplay === song.file) {
								player.playSong(song.file, song.name, song.length, song.ytid);
							}
						});
					}).catch((err) => {
						console.log(err);
						player.removefromqueue(song.ytid);
					});
				}).catch(err => {
					console.error(err);
					player.removefromqueue(song.ytid);
				});
			});
		});
		player.YD.on("queueSize", function (size) {
			console.log(size + " left in youtube-mp3-downloader queue");
		});
		player.startPlaylistWatchman();
		player.fixMissingFiles();
	},
	playSong(fileName, name, length, ytid) {
		this.wantstoplay = fileName;
		this.clearLastPlay();
		console.log("playing " + name + " from " + fileName + " " + length + "seconds");
		if (!cfg.demo) {
			if (fs.existsSync('./Music/' + fileName) &&
				!(fs.existsSync('./Music/' + fileName + '.DOWNLOAD') || fs.existsSync('./Music/' + fileName + '.TEMP'))) {
				this.audio = this.p.play('./Music/' + fileName, { mplayer: cfg.mplayerParameters }, function (err) {
					if (err && !err.killed && err !== 1) throw err;
				});
				player.isPlaying = true;
				player.startTime = new Date();
				player.songInfo.name = name;
				player.songInfo.length = length;
				player.songInfo.ytid = ytid;
				player.sendPlayerData();
				database.addHistory({ date: new Date(), ytid: ytid });
				player.shuffleTimeout = setTimeout(() => {
					player.isPlaying = false;
					player.songInfo = {};
					player.sendPlayerData();
					player.nextShuffle();
				}, length * 1000);
			}
			else {
				player.downloadSong(ytid);
				notification.notify({ msg: 'Nie ma tego pliku, pobieranie...' }, true);
				player.fixMissingFiles();
			}
		}
	},
	nextShuffle() {
		if (this.isShuffle) {
			this.isShuffle = true;
			database.getRandomSong().then((song) => {
				if (song)
					player.playSong(song.file, song.name, song.length, song.ytid);
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
			if (!this.isPlaying)
				this.sendPlayerData();
		}
		database.getPlaylistData().then((res) => {
			if (res.length == 0 || res[0].date * 1000 > new Date().getTime())
				if (!this.isPlaying)
					this.nextShuffle();
		})
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
		this.wantstoplay = "";
		this.clearLastPlay();
		let tmp = this.isPlaying;
		this.isPlaying = false;
		if (!leaveSuffle)
			this.isShuffle = false;
		if (tmp) {
			console.log("stopped playing")
			this.sendPlayerData();
		}
	},
	deleteSong(ytid) {
		if (ytid == this.songInfo.ytid)
			this.stopPlaying(true);
		database.deleteSong(ytid).then((res) => {
			let filepath = './Music/' + res.file;
			if (!fs.existsSync(filepath + '.DOWNLOAD') && !fs.existsSync(filepath + '.TEMP')) try {
				fs.unlinkSync(filepath);
				notification.notify({ msg: 'Usunięto ' + res.name, deletedSong: res.name }, true);
			} catch (err) {
				notification.notify({ msg: 'Usunięto ' + res.name + ' z bazy danych, jednak nie udało się usunąć pliku mp3', deletedSong: res.name }, true);
			}
			else
			{
				notification.notify({ msg: 'Plik ' + res.name + ' jest prawdopodobnie pobierany', deletedSong: res.name }, true);
			}
		});
	},
	downloadSong(ytid) {
		if (cfg.demo) {
			notification.notify({ msg: 'Pobieranie jest wyłączone w trybie demostracyjnym' }, true);
			return;
		}
		let filename = ytid + '.yt.mp3';
		let filepath = path.join('.', 'Music', filename);
		database.getSong(ytid).then((res) => {
			if (player.downloadQ.indexOf(ytid) !== -1) {
				console.log("Video already in queue");
				notification.notify({ msg: 'Pomijam ' + ytid + ' - już w kolejce' }, true);
				return;
			}
			if (res && (fs.existsSync(filepath + '.DOWNLOAD') || fs.existsSync(filepath + '.TEMP'))) {
				console.log("Video " + ytid + " is being downloaded");
				notification.notify({ msg: 'Pomijam ' + ytid + ' - jest pobierane' }, true);
				return;
			}
			if (res && fs.existsSync(filepath)) {
				console.log("Video " + ytid + " already downloaded");
				notification.notify({ msg: 'Pomijam ' + ytid + ' - jest już pobrane' }, true);
				return;
			}

			notification.notify({ msg: 'Pobieram ' + ytid }, true);

			player.downloadQ.push(ytid);
			player.YD.download(ytid, filename + '.DOWNLOAD');
		})
	},
	downloadSongs(ytids) {
		if (cfg.demo) {
			notification.notify({ msg: 'Pobieranie jest wyłączone w trybie demostracyjnym' }, true);
			return;
		}
		for (let i = 0; i < ytids.length; i++) {
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
		let time = Math.floor(((new Date()).getTime() - this.startTime.getTime()) / 1000);
		return { isPlaying: this.isPlaying, time: time, isShuffle: this.isShuffle, song: this.songInfo, amplifierMode: amplifier.mode, volume: amplifier.volume };
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
		let Dhelper = new Date();
		setInterval(() => {
			if (Dhelper.getDate() !== new Date().getDate())
				database.fixPlaylistToFitSchedule()
			database.getPlaylistData().then((res) => {
				if (res.length == 0)
					return;
				if ((res[0].date * 1000) + (cfg.timeOffset * 1000) <= new Date().getTime()) {
					this.playSong(res[0].file, res[0].name, res[0].length, res[0].ytid);
					database.modifyPlaylist({ id: res[0].id, was: 1 });
				}
			});
		}, 1000);
	},
	fixMissingFiles() {
		console.log('fixing missing files');
		notification.notify({ msg: 'Pobieranie brakujących plików...' }, true);
		database.getSongFiles().then((res) => {
			for (const s of res) {
				access('./Music/'+s.file, constants.F_OK, (err)=>{
					if (err) {
						player.downloadSong(s.ytid);
					}
				})
			}
		});
	}
});