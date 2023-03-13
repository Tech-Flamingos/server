'use strict';

function handle500(error, req, res, next) {
  const error = error.message ? error.message: error;

  const errorObject = {status: 500, message: error};

  res.status(500).json(errorObject);
};

module.exports = handle500;