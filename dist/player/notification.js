'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var not = { _instance: null, get instance() {
        if (!this._instance) {
            this._instance = {
                singletonMethod: function singletonMethod() {
                    return 'singletonMethod2';
                },
                _type: 'NoClassSingleton1', get type() {
                    return this._type;
                }, set type(value) {
                    this._type = value;
                } };
        }return this._instance;
    } };
exports.default = not; //singleton stuff, don't care about it


var notification = exports.notification = Object.assign({}, {
    singletonMethod: function singletonMethod() {
        return 'singletonMethod2';
    },

    _type: 'NotificationController',
    get type() {
        return this._type;
    },
    set type(value) {
        this._type = value;
    },

    listeners: [],
    addListener: function addListener(res) {
        this.listeners.push(function (data) {
            res.status(200).send(data);
        });
    },
    notify: function notify(data) {
        for (var i = 0; i < this.listeners.length; i++) {
            try {
                this.listeners[i](data);
            } catch (e) {
                console.log('listener disconnected ', e);
            }
            this.listeners.splice(i, 1);
            i--;
        }
    }
});