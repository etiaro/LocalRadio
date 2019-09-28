'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _errors = require('./middlewares/errors');

var _login = require('./routes/login');

var _login2 = _interopRequireDefault(_login);

var _player = require('./routes/player');

var _player2 = _interopRequireDefault(_player);

var _database = require('./config/database');

var _database2 = _interopRequireDefault(_database);

var _database3 = require('./database/database');

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_database3.database.init(_database2.default.db);

var app = (0, _express2.default)();

app.set('secretKey', 'K4UgOiCggY');
app.use((0, _cors2.default)());

app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use(_bodyParser2.default.json());

// routes config
app.use('/api/login', (0, _login2.default)()); //TODO Mainpage set password, register, then makeup of player
app.use('/api/player', (0, _player2.default)()); //TODO Mainpage set password, register, then makeup of player


// errors handling
app.use(_errors.notFound);

// Start
app.listen(80, function () {
    console.log('Server is up!');
});