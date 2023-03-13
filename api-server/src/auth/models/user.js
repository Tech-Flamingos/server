'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SECRET = process.env.SECRET || 'secretString';

const userModel = new mongoose.Schema({
  name: { type: 'String', required: true, unique: true },
  password: { type: 'String', required: true },
  role: { type: 'String', enum: ['user', 'writer', 'admin'], default: 'user' },
  token: {
    type: 'String',
    get: () => { return jwt.sign({ username: this.username }, SECRET); },
    set: (tokenObj) => { let token = jwt.sign(tokenObj, SECRET); return token; },
  },
  capabilities: {
    type: 'String',
    get: () => {
      const acl = { user: ['read'], write: ['read', 'create'], admin: ['read', 'create', 'update', 'delete'] }
      return acl[this.role];
    },
  },

});

userModel.pre(async (user) => {
  let hashedPass = await bcrypt.hash(user.password, 10);
  user.password = hashedPass;
});

userModel.authenticateBasic = async function (username, password) {
  const user = await this.findOne({ username: username });
  const valid = await bcrypt.compare(password, user.password);
  if (valid) {
    return user;
  }

  throw new Error('invalid user');
}

userModel.authenticateToken = async function (token) {

  try {
    const parsedToken = jwt.verify(token, SECRET);
    const user = this.findOne({
      username: parsedToken.username,

    });

    if (user) {
      return user;
    }
    throw new Error('user not found');

  } catch (error) {
    throw new Error(error.message);

  }

}



module.exports = mongoose.model('users', userModel);