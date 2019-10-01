'use strict';

require("babel-core/register");
require("babel-polyfill");

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _errors = require('./middlewares/errors');

var _login = require('./routes/login');

var _login2 = _interopRequireDefault(_login);

var _player = require('./routes/player');

var _player2 = _interopRequireDefault(_player);

var _notification = require('./routes/notification');

var _notification2 = _interopRequireDefault(_notification);

var _settings = require('./routes/settings');

var _settings2 = _interopRequireDefault(_settings);

var _database = require('./config/database');

var _database2 = _interopRequireDefault(_database);

var _database3 = require('./database/database');

var _player3 = require('./player/player');

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_database3.database.init(_database2.default.db);

var app = (0, _express2.default)();

app.set('secretKey', 'K4UgOiCggY');
app.use((0, _cors2.default)());

app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use(_bodyParser2.default.json());

// routes config
app.use('/api/login', (0, _login2.default)());
app.use('/api/player', (0, _player2.default)());
app.use('/api/notification', (0, _notification2.default)());
app.use('/api/settings', (0, _settings2.default)());

//hosting built react app(front end)
app.use(_express2.default.static(_path2.default.join(__dirname, '../public/build/')));

// errors handling
app.use(_errors.notFound);

// Start
app.listen(80, function () {
    console.log('Server is up!');
});

_player3.player.startPlaylistWatchman();