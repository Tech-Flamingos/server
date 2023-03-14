'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SECRET = process.env.SECRET || 'secretString';

const UserSchema = new mongoose.Schema({
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
      const acl = { user: ['read'], write: ['read', 'create'], admin: ['read', 'create', 'update', 'delete'] };
      return acl[this.role];
    },
  },

});

UserSchema.pre('save', async function (next) {
  let user = this;
  let hashedPass = await bcrypt.hash(user.password, 10);
  user.password = hashedPass;
});

module.exports = mongoose.model('users', UserSchema);
