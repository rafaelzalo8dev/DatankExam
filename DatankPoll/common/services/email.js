'use strict';

const nodemailer = require('nodemailer');
const smtp = require('nodemailer-smtp-transport');
const EmailTemplate = require('email-templates');
const _ = require('lodash');
const path = require('path');
const emailConfig = require('../config/emailConfig.json');
const emailTemplatesConfig = require('../config/emailTemplates.json');

function transportCreator(options = {}) {
  return nodemailer.createTransport(smtp(emailConfig.smtpConfig));
}

const email = new EmailTemplate({
  message: {
    from: 'rafaelzalo8@gmail.com'
  },
  send: true,
  transport: {
    jsonTransport: true
  }
});

exports.sendMail = (data, action, options = {}, smtpOptions = {}) => { // eslint-disable-line
  const transporter = transportCreator(smtpOptions);
  const emailTemplates = emailTemplatesConfig[action];
  const mailOptions = _.merge(emailTemplates, {to: data.email});
  if (!_.isEmpty(options)) options = _.merge(emailTemplates, options);
  else options = data;
  if (options.sujeto) mailOptions.subject = `${mailOptions.subject} ${options.sujeto}`; // eslint-disable-line
  const templateDir = path.join(__dirname, 'templates', mailOptions.html);
  var options = {
    from: 'rafaelzalo8@gmail.com',
    to: data.email,
    subject: mailOptions.subject || 'DATANK POLL ',
    html: '<h1>Nueva encuesta en DATANK POLL.</h1> <a href="http://localhost:3000">Ingresar</a>',
    text:'Existe una nueva encuesta'
  };
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, function(error, info) {
      if(error) {
        reject(error);
      }
      else{
        resolve(info);
      };
    });
  });
};
