'use strict';

module.exports = function(Userresponse) {
  let pollModel = null;
  const updatePoll = function (pollId) {
    pollModel = Userresponse.app.models.Poll;
    return new Promise((resolve, reject) => {
      pollModel.findOne({
        where: { id: pollId }
      }, function(err, poll) {
        if(err) reject(err);
        pollModel.updateAll({id: pollId}, {answers: poll.answers + 1, updatedAt: new Date()}, function(err2, result) {
          if(err2) reject(err2);
          resolve(result);
        });
      });
    });
  };
  Userresponse.observe('after save', function(item, next) {
    if(item.isNewInstance) {
      const userResponse = item.instance;
      updatePoll(userResponse.pollId)
      .then(result => {
        return next();
      })
      .catch(err => {
        return next(`Error al actualizar la encuesta ${err}`);
      });
    } else {
      return next();
    }
  });
};
