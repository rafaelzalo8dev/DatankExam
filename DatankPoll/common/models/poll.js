'use strict';
const emailSender = require('../services/email');
const _ = require('lodash');
module.exports = function(Poll) {
  let userModel = null;
  let userResponseModel = null;
  const getUsersForPoll = function() {
    userModel = Poll.app.models.User;
    return new Promise((resolve, reject) => {
      userModel.find({
        where: {
          role: 'usuario'
        }
      }, (err, result) => {
        if(err) reject(err);
        resolve(result);
      });
    });
  };

  const sendEmailToResponsePoll = function(data, action) {
    const pollRoute = 'https://datankpoll.firebaseapp.com';
    const name = `${data.name} ${data.lastname}`;
    return new Promise((resolve, reject) => {
      emailSender.sendMail({
        name,
        email: data.email,
        url: pollRoute,
        user: data
      },
      action).then(email => {
        resolve(email);
      })
      .catch(err => {
        reject(err);
      });
    });
  };

  Poll.observe('after save', function(pollObject, next) {
    if (pollObject.isNewInstance) {
      const poll = pollObject.instance;
      getUsersForPoll()
      .then(users => {
        const sendEmailPromises = [];
        users.map(user => {
          sendEmailPromises.push(sendEmailToResponsePoll(user, 'POLL_REQUEST'));
        });
        Promise.all(sendEmailPromises)
        .then(emailResults => {
          return next();
        })
        .catch(err => {
          return next('Error al enviar correos a usuarios ',err);
        });
      })
      .catch(err => {
        return next('Error obteniendo usuarios para encuesta ', err);
      });
    } else {
      return next();
    }
  });

  const getPolls = function (userId) {
    return new Promise((resolve, reject) => {
      Poll.find({
        where: {
          visible: true
        },
        include: [{
          relation: 'pollOptions'
        }, {
          relation: 'userResponses',
          scope: {
            where: {
              userId
            }
          }
        }]
      }, (err, result) => {
        if(err) reject(err);
        resolve(result);
      });
    });
  };

  Poll.remoteMethod('getPollsByUser', {
    http: {
      verb: 'GET',
      path: '/getPollsByUser'
    },
    accepts: {
      arg: 'userId',
      type: 'number',
    },
    returns: {
      type: 'object',
      arg: 'res',
      root: true
    },
    description: 'Se obtienen encuestas por usuario'
  });

  Poll.getPollsByUser = function (userId, cb) {
    if(!userId) cb({
      statusCode: 404,
      message: 'Se necesita el ID del usuario a revisar'
    });
    const promisesPolls = [];
    getPolls(userId)
    .then(pollsResults => {
      const polls = JSON.parse(JSON.stringify(pollsResults));
      const answered = [];
      const unanswered = [];
      for(let x = 0; x < polls.length; x += 1) {
        const poll = polls[x];
        if(poll.userResponses && poll.userResponses.length > 0) {
          answered.push(poll);
        } else {
          unanswered.push(poll);
        }
      }
      cb(null, {
        answered,
        unanswered
      });
    })
    .catch(err => {
      cb({
        statusCode: 404,
        message: 'Error al obtener encuestas y/o respuestas de usuarios ' + err
      });
    });
  };
};
