'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _notification = require('../player/notification');

var _login = require('./login');

exports.default = function () {
    var api = (0, _express.Router)();

    // /api/notification
    api.get('/', _login.checkPerm, function (req, res, next) {
        _notification.notification.addListener(res);
    });

    return api;
};