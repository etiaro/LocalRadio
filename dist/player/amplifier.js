'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.amplifier = undefined;

var _serialport = require('serialport');

var _serialport2 = _interopRequireDefault(_serialport);

var _database = require('../database/database');

var _player = require('./player');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var not = { _instance: null, get instance() {
        if (!this._instance) {
            this._instance = {
                singletonMethod: function singletonMethod() {
                    return 'singletonMethod3';
                },
                _type: 'NoClassSingleton1', get type() {
                    return this._type;
                }, set type(value) {
                    this._type = value;
                } };
        }return this._instance;
    } };
exports.default = not; //singleton stuff, don't care about it


var amplifier = exports.amplifier = Object.assign({}, {
    singletonMethod: function singletonMethod() {
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
        off: 0,
        auto: 1,
        on: 2
    },

    state: '',
    mode: 0,
    startWatchman: function startWatchman() {
        console.log('starting');
        var port = new _serialport2.default('/dev/ttyUSB0', { autoOpen: false });
        var isError = false;

        // The open event is always emitted
        port.on('open', function () {
            isError = false;
            port.write('s');
            console.log('opened');
        });

        port.on('data', function (data) {
            var newValue = data.toString()[0];
            if ((newValue === '-' || newValue === '+') && newValue !== amplifier.state) amplifier.state = data.toString()[0];
        });

        setInterval(function () {
            if (!port.isOpen) port.open(function (err) {
                if (err && !isError) {
                    isError = true;
                    return console.log('Error opening port: ', err.message);
                }
            });else {
                if (amplifier.mode == amplifier.modes.on) {
                    port.write('+');
                    if (_player.player.isShuffle) _player.player.playShuffle();
                } else if (amplifier.mode == amplifier.modes.off) port.write('-');else if (amplifier.mode == amplifier.modes.auto) {
                    var now = new Date();
                    _database.database.getAmplifierTimeSchedule(function (res) {
                        if (!res.day[now.getDay()]) {
                            port.write('-');
                            return;
                        }
                        var enable = false;
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = res.enabledTimes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var t = _step.value;

                                if (t.begin.hour <= now.getHours() && t.begin.minutes <= now.getMinutes() && t.end.hour >= now.getHours() && t.end.minutes >= now.getMinutes()) enable = true;
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }

                        if (enable) {
                            port.write('+');
                            if (_player.player.isShuffle) _player.player.playShuffle();
                        } else port.write('-');
                    });
                }
            }
        }, 1000);
    },
    setMode: function setMode(mode) {
        if (mode == this.modes.on || mode == this.modes.off || mode == this.modes.auto) this.mode = mode;
    }
});