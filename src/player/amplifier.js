import SerialPort from 'serialport';
import {database} from '../database/database';
import {player} from './player';
import cfg from '../config/general';
import loudness from 'loudness';

const not = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod3';},_type: 'NoClassSingleton1', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default not;  //singleton stuff, don't care about it


export const amplifier = Object.assign({}, {
    singletonMethod() {
      return 'singletonMethod3';
    },
    _type: 'AplifierController',
    get type() {
      return this._type;
    },
    set type(value) {
      this._type = value;
    },

    modes: {
        off:0,
        auto:1,
        on:2
    },
    volume: 100,
    state: '',
    mode: 0, 
    startWatchman(){
        console.log('starting');
        const port = new SerialPort('/dev/ttyUSB0', { autoOpen: false });
        var isError = false;
        this.getVolume()

        // The open event is always emitted
        port.on('open', function() {
            isError = false;
            port.write('s');
            console.log('opened');
        });

        port.on('data', function(data) {
            var newValue = data.toString()[0];
            if((newValue === '-' || newValue === '+') && newValue !== amplifier.state)
                amplifier.state = data.toString()[0];
        });

        var lastMode = '';

        setInterval(()=>{
            if(!port.isOpen){
                port.open(function (err) {
                    if (err && !isError){
                        isError = true;
                        return console.log('Error opening port: ', err.message);
                    }
                });
            }//else{
                database.getScheduleAndAmplifierMode().then((res)=>{
                    amplifier.mode = parseInt(res.amplifierMode);
                    if(amplifier.mode === amplifier.modes.on){
                        port.write('+');
                        lastMode = '+';
                    }else if(amplifier.mode === amplifier.modes.off){
                        port.write('-');
                        player.stopPlaying(true);
                        lastMode = '-';
                    }else if(amplifier.mode === amplifier.modes.auto){
                        const now = new Date();
                        if(!res.data.day[now.getDay()]){
                            port.write('-');
                            player.stopPlaying(true);
                            lastMode = '-';
                            return;
                        }
                        var enable = false;                        
                        function ToDateObject(t){
                            var toReturn = new Date();
                            toReturn.setHours(t.hour);
                            toReturn.setMinutes(t.minutes);
                            toReturn.setSeconds(0);
                            toReturn.setMilliseconds(0);
                            return toReturn;
                        };
                        
                        for(let t of res.data.enabledTimes){
                            var startTime = ToDateObject(t.begin)
                            var endTime = ToDateObject(t.end)

                            if (now.getTime() >= (startTime.getTime() + cfg.timeOffset * 1000) 
                                && now.getTime() <= (endTime.getTime() + cfg.timeOffset * 1000)
                            )
                            {
                                enable = true;
                            }
                        }

                        if(enable){
                            port.write('+');
                            if(lastMode !== '+' && player.isShuffle) player.playShuffle();
                            lastMode = '+';
                        }else{
                            port.write('-');
                            player.stopPlaying(true);
                            lastMode = '-';
                        }
                    }
                });
            //}
        },1000);
    },
    setMode(mode){
        if(mode == this.modes.on || mode == this.modes.off || mode == this.modes.auto){
            this.mode = mode;
            database.setAmplifierMode(mode)
            player.sendPlayerData()
        }
    },
    async setVolume(v){
        this.volume = v
        player.sendPlayerData()
        return await loudness.setVolume(v, cfg.volumeDevice, cfg.volumeCard)
    },
    async getVolume(){
        this.volume = await loudness.getVolume(cfg.volumeDevice, cfg.volumeCard)
        player.sendPlayerData()
        return this.volume
    }

});