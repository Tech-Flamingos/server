'use strict';

const express = require('express');
const authRouter = express.Router();
const UserSchema = require('./models/user');
const basicAuth = require('./middleware/basic');
// const bearerAuth = require('./middleware/bearer');
// const permissions = require('./middleware/acl');

authRouter.post('/signup', async(req, res, next) => {
  try {
    const userRecord = new UserSchema(req.body);
    await userRecord.save();
    // let userRecord = await userModel.create(req.body);
    const output = {
      user: userRecord, 
      token: userRecord.token,
    };
    res.status(201).json(output);

  } catch (error) {
    next(error.message);

  }
});

authRouter.post('/signin', basicAuth, (req, res, next) => {
  const user = {
    user: req.user, 
    token: req.user.token,
  };
  res.status(200).json(user);

});

module.exports = authRouter;
