var express = require('express');

var bodyParser = require('body-parser');

var users = require('./routes/users');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/v1/users', users);

module.exports = app;
