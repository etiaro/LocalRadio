"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _usersController = require("../controllers/usersController");

var _usersController2 = _interopRequireDefault(_usersController);

var _errors = require("../middlewares/errors");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var api = (0, _express.Router)();

  //POST /api/users
  api.post('/', (0, _errors.catchAsync)(_usersController2.default.create));

  //GET /api/users
  api.get('/', (0, _errors.catchAsync)(_usersController2.default.findAll));

  return api;
};