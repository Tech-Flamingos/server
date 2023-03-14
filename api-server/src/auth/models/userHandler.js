'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET = process.env.SECRET || 'secretString';
const UserSchema = require('../models/user');

let authenticateBasic = async (username, password) => {
  const user = await UserSchema.findOne({ name: username });
  const valid = await bcrypt.compare(password, user.password);
  if (valid) {
    return user;
  }
  throw new Error('invalid user');
};

let authenticateToken= async (token) => {
  try {
    const parsedToken = jwt.verify(token, SECRET);
    const user = UserSchema.findOne({
      username: parsedToken.username,
    });
    if (user) {
      return user;
    }
    throw new Error('user not found');
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { authenticateToken, authenticateBasic };
