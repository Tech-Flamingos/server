'use strict';

require('dotenv').config();
const app = require('./src/server');
const port = process.env.PORT || 3002;

app.start(port);
