/* eslint-disable import/no-cycle */
import SerialPort from 'serialport';
import loudness from 'loudness';
import { database } from '../database/database';
import { player } from './player';
import cfg from '../config/general';

const not = {
  instance: null,
  get getInstance() {
    if (!this.instance) {
      this.instance = {
        singletonMethod() { return 'singletonMethod3'; },
        type: 'NoClassSingleton1',
        get getType() { return this.type; },
        set setType(value) { this.type = value; },
      };
    } return this.instance;
  },
};
export default not; // singleton stuff, don't care about it

export const amplifier = Object.assign({}, {
  singletonMethod() {
    return 'singletonMethod3';
  },
  type: 'AplifierController',
  get getType() {
    return this.type;
  },
  set setType(value) {
    this.type = value;
  },

  modes: {
    off: 0,
    auto: 1,
    on: 2,
  },
  volume: 100,
  state: '',
  mode: 0,
  startWatchman() {
    console.log('starting');
    const port = new SerialPort('/dev/ttyUSB0', { autoOpen: false });
    let isError = false;
    this.getVolume();

    // The open event is always emitted
    port.on('open', () => {
      isError = false;
      port.write('s');
      console.log('opened');
    });

    port.on('data', (data) => {
      const newValue = data.toString()[0];
      if ((newValue === '-' || newValue === '+') && newValue !== amplifier.state) [amplifier.state] = data.toString();
    });

    let lastMode = '';

    setInterval(() => {
      if (!port.isOpen) {
        port.open((err) => {
          if (err && !isError) {
            isError = true;
            console.log('Error opening port: ', err.message);
          }
        });
      }// else{
      database.getScheduleAndAmplifierMode().then((res) => {
        function ToDateObject(t) {
          const toReturn = new Date();
          toReturn.setHours(t.hour);
          toReturn.setMinutes(t.minutes);
          toReturn.setSeconds(0);
          toReturn.setMilliseconds(0);
          return toReturn;
        }

        amplifier.mode = parseInt(res.amplifierMode, 10);
        if (amplifier.mode === amplifier.modes.on) {
          port.write('+');
          lastMode = '+';
        } else if (amplifier.mode === amplifier.modes.off) {
          port.write('-');
          player.stopPlaying(true);
          lastMode = '-';
        } else if (amplifier.mode === amplifier.modes.auto) {
          const now = new Date();
          if (!res.data.day[now.getDay()]) {
            port.write('-');
            player.stopPlaying(true);
            lastMode = '-';
            return;
          }
          let enable = false;

          res.data.enabledTimes.forEach((t) => {
            const startTime = ToDateObject(t.begin);
            const endTime = ToDateObject(t.end);

            if (now.getTime() >= (startTime.getTime() + cfg.timeOffset * 1000)
                                && now.getTime() <= (endTime.getTime() + cfg.timeOffset * 1000)
            ) {
              enable = true;
            }
          });

          if (enable) {
            port.write('+');
            if (lastMode !== '+' && player.isShuffle) player.playShuffle();
            lastMode = '+';
          } else {
            port.write('-');
            player.stopPlaying(true);
            lastMode = '-';
          }
        }
      });
      // }
    }, 1000);
  },
  setMode(mode) {
    if (mode === this.modes.on || mode === this.modes.off || mode === this.modes.auto) {
      this.mode = mode;
      database.setAmplifierMode(mode);
      player.sendPlayerData();
    }
  },
  async setVolume(v) {
    this.volume = v;
    player.sendPlayerData();
    try {
      return await loudness.setVolume(v, cfg.volumeDevice, cfg.volumeCard);
    } catch (e) {
      return e;
    }
  },
  async getVolume() {
    this.volume = await loudness.getVolume(cfg.volumeDevice, cfg.volumeCard);
    player.sendPlayerData();
    return this.volume;
  },

});
