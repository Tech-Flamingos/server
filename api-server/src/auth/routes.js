'use strict';

const express = require('express');
const authRouter = express.Router();
const { users } = require('./models');
const basicAuth = require('./middleware/basic');
const bearerAuth = require('./middleware/bearer');
const permissions = require('./middleware/acl');

authRouter.post('/signup', async(req, res, next) => {
  try {
    let userRecord = await users.create(req.body);
    const output = {
      user: userRecord, 
      token: userRecord.token
    };
    res.status(201).json(output);

  } catch (error) {
    next(error.message);

  }
});

authRouter.post('/signin', basicAuth, (req, res, next) => {
  const user = {
    user: req.user, 
    token: req.user.token
  };
  res.status(200).json(user);

});

module.exports = authRouter;