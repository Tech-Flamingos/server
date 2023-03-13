'use strict';

const express = require('express');
const cors = require('cors');

const errorHandler = require('./error-handlers/500');
const notFound = require('./error-handlers/404');
const logger = require('./middleware/logger');
const authRoutes = require('./auth/routes');
const routes = require('./routes/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger());

app.use(authRoutes);
app.use(routes);

module.exports = {
  app: app, start: (PORT) => {
    app.listen(PORT, () => {
      console.log('Server is running on port ', PORT);
    });
  },
};
