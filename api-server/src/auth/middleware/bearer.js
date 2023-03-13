'use strict';

const { users } = require('../models/');

modules.exports = async(req, res, next) => {

  try {
    if(!req.headers.authorization) {
      return(_authError());
    
    }
    const token = req.headers.authorization.split(' ').pop();
    const validUser = await users.authenticateToken(token);

    req.users = validUser;
    req.token = validUser.token;
    next();

  } catch (error) {
    _authError();
  }

  function _authError() {
    res.status(403).send('invalid login');
  }
}