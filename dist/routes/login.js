'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.checkPerm = undefined;

var _express = require('express');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _database = require('../database/database');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validate(req, res, next) {
    _jsonwebtoken2.default.verify(req.headers['x-access-token'], req.app.get('secretKey'), function (err, decoded) {
        if (err) {
            return res.status(500).send({ message: err.message, data: null });
        } else {
            _database.database.getUser(decoded.userInfo.id, function (result) {
                req.userInfo = decoded.userInfo;
                req.userInfo.isAdmin = result.isAdmin;
                next();
            });
        }
    });
}

var checkPerm = exports.checkPerm = function checkPerm(req, res, next) {
    _jsonwebtoken2.default.verify(req.headers['x-access-token'], req.app.get('secretKey'), function (err, decoded) {
        if (err) {
            return res.status(500).send({ message: err.message, data: null });
        } else {
            _database.database.getUser(decoded.userInfo.id, function (result) {
                req.userInfo = decoded.userInfo;
                req.userInfo.isAdmin = result.isAdmin;
                if (!req.userInfo.isAdmin) //HERE IS THE DIFFERENCE TO VALIDATE!
                    return res.status(500).send({ message: err.message, data: null });
                next();
            });
        }
    });
};

exports.default = function () {
    var api = (0, _express.Router)();

    // /api/login
    api.post('/', function (req, res, next) {
        if (req.body.accessToken) {
            (0, _request2.default)('https://graph.facebook.com/me?fields=id,name,email,picture&access_token=' + req.body.accessToken, { json: true }, function (err, res2, body) {
                if (err || !body.id) {
                    console.log(err);
                    return res.status(500).send({ err: 'bad token ' + err });
                }
                _database.database.updateUser(body);
                body.loggedIn = true;
                _database.database.getUser(body.id, function (result) {
                    if (result.isAdmin) body.isAdmin = true;
                    var token = _jsonwebtoken2.default.sign({ id: body.id, 'userInfo': body }, req.app.get('secretKey'), { expiresIn: '15m' });
                    return res.status(200).send({ token: token });
                });
            });
        } else {
            return res.status(500).send(req.body);
        }
    });

    api.post('/data/', validate, function (req, res, next) {
        return res.status(200).send(req.userInfo);
    });

    return api;
};