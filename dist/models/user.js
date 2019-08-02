'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var User = _mongoose2.default.Schema({
    name: String,
    surName: String,
    age: String,
    location: String,
    email: String
});

exports.default = _mongoose2.default.model('Users', User);