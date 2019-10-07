import SerialPort from 'serialport';
import {database} from '../database/database';
import {player} from './player';

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

    modes: {    //TODO get fom settings
        off:0,
        auto:1,
        on:2
    },
    
    state: '',
    mode: 0, 
    startWatchman(){
        console.log('starting');
        const port = new SerialPort('/dev/ttyUSB0', { autoOpen: false });
        var isError = false;

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
            if(!port.isOpen)
                port.open(function (err) {
                    if (err && !isError){
                        isError = true;
                        return console.log('Error opening port: ', err.message);
                    }
                });
            else{
                if(amplifier.mode == amplifier.modes.on){
                    port.write('+');
                    if(player.isShuffle) player.playShuffle();
                    lastMode = '+';
                }else if(amplifier.mode == amplifier.modes.off){
                    port.write('-');
                    if(lastMode != '-')
                        player.stopPlaying();
                    lastMode = '-';
                }else if(amplifier.mode == amplifier.modes.auto){
                    const now = new Date();
                    database.getAmplifierTimeSchedule((res)=>{
                        if(!res.day[now.getDay()]){
                            port.write('-');
                            if(lastMode != '-')
                                player.stopPlaying();
                            lastMode = '-';
                            return;
                        }
                        var enable = false;
                        for(let t of res.enabledTimes){
                            if(t.begin.hour <= now.getHours() && t.begin.minutes <= now.getMinutes() &&
                                t.end.hour >= now.getHours() && t.end.minutes >= now.getMinutes())
                                enable = true;
                        }
                        if(enable){
                            port.write('+');
                            if(player.isShuffle) player.playShuffle();
                            lastMode = '+';
                        }else{
                            port.write('-');
                            if(lastMode != '-')
                                player.stopPlaying();
                            lastMode = '-';
                        }
                    });
                }
            }
        },1000);
    },
    setMode(mode){
        if(mode == this.modes.on || mode == this.modes.off || mode == this.modes.auto)
            this.mode = mode;
    }
});