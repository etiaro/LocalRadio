'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _login = require('./login');

var _database = require('../database/database');

exports.default = function () {
    var api = (0, _express.Router)();

    // /api/settings
    api.get('/schedule', _login.checkPerm, function (req, res, next) {
        _database.database.getAmplifierTimeSchedule(function (res) {
            res.status(200).send(res);
        });
    });
    api.post('/schedule', _login.checkPerm, function (req, res, next) {
        _database.database.setAmplifierTimeSchedule(req.body.schedule, function () {
            res.status(200).send({ msg: "query accepted" });
        });
    });

    return api;
};