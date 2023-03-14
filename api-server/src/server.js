'use strict';

const express = require('express');
const cors = require('cors');

const errorHandler = require('./error-handlers/500.js');
const notFound = require('./error-handlers/404.js');
const logger = require('./middleware/logger.js');

const authRoutes = require('./auth/routes');
const routes = require('./auth/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use(authRoutes);
app.use(routes);

app.use(notFound);
app.use(errorHandler);

module.exports = {
  app: app, start: (PORT) => {
    app.listen(PORT, () => {
      console.log('Server is running on port ', PORT);
    });
  },
};
