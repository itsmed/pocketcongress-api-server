require('dotenv').config();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const port = process.env.PORT || 8000;

const router = require('./routes');

const app = express();

if (process.env.NODE_ENV === 'dev') {
  app.use('dev');
} else {
  app.use(morgan('combined'));
}

app.use(bodyParser.json());
app.use(cors());
app.use(compression());
router(app);

const server = app.listen(port, console.log(`Server listening on port ${port}`));

module.exports = server;
