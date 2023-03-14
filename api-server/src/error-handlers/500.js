'use strict';

function handle500(error, req, res, next) {
  const err = error.message ? error.message: error;
  const errorObject = {status: 500, message: err};
  res.status(500).json(errorObject);
}

module.exports = handle500;
