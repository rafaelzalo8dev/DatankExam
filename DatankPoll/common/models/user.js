'use strict';
const bcrypt = require('bcrypt');
module.exports = function(User) {
  const DEFAULT_ROUNDS = 10;
  const updateUserPassword = function (hash, userId) {
    return new Promise((resolve, reject) => {
      User.updateAll({id: userId}, {password: hash}, function(err, result) {
        if(err) reject(err);
        resolve(result);
      });
    });
  };
  User.validatesUniquenessOf('email');
  User.observe('after save', function(user, next) {
    if(user.isNewInstance) {
      bcrypt.genSalt(DEFAULT_ROUNDS, function(err, salt) {
        bcrypt.hash(user.instance.password, salt, function(err, hash) {
          updateUserPassword(hash, user.instance.id)
          .then(updatedUser => {
            return next();
          })
          .catch(err => {
            return next(err);
          });
        });
      });
    } else {
      return next();
    }
  });

  const getUserByEmail = function(email) {
    return new Promise((resolve, reject) => {
      User.findOne({
        where: { email }
      }, function(err, result) {
        if(err) reject(err);
        resolve(result);
      });
    });
  };

  User.login = function(body, cb) {
    const { email, password } = body;
    if(!email || !password) {
      cb({
        statusCode: 404,
        message: 'Hacen falta datos para continuar'
      });
    } else {
      getUserByEmail(email)
      .then(user => {
        bcrypt.compare(password, user.password, function(err, res) {
          if(res) {
            cb(null, user);
          } else {
            cb({
              statusCode: 404,
              message: 'Error en credenciales.'
            });
          }
        });
      })
      .catch(err => {
        cb({
          statusCode: 404,
          message: 'Error al consultar al usuario por email ' + err
        });
      });
    }
  };

  User.remoteMethod('login', {
    http: {
      verb: 'POST',
      path: '/login'
    },
    accepts: {
      arg: 'req',
      type: 'object',
      http: {
        source: 'body',
      },
    },
    returns: {
      type: 'object',
      arg: 'res',
      root: true
    },
    description: 'Se intenta realizar el login'
  });
};
