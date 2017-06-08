require('dotenv').config();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');

const port = process.env.PORT || 8000;

const router = require('./routes');

const app = express();

if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(bodyParser.json());
app.use(cors());
app.use(compression());
router(app);


app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, console.log(`Server listening on port ${port}`));

module.exports = server;
