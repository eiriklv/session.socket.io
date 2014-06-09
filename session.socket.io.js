var util = require('util');

module.exports = function(io, sessionStore, cookieParser, key) {
  key = key || 'connect.sid';

  this.of = function(namespace) {
    return {
      on: function(event, callback) {
        return bind.call(this, event, callback, io.of(namespace));
      }.bind(this)
    };
  };

  this.on = function(event, callback) {
    return bind.call(this, event, callback, io.sockets);
  };

  // fikse denne
  this.getSession = function(socket, callback) {
    cookieParser(socket.handshake, {}, function (parseErr){
      sessionStore.get(findCookie(socket.handshake), function (storeErr, session) {
        var err = resolve(parseErr, storeErr, session);
        callback(err, session);
      });
    });
  };

  function bind(event, callback, namespace) {
    namespace.on(event, function (socket) {
      this.getSession(socket, function (err, session) {
        callback(err, socket, session);
      });
    }.bind(this));
  }

  function findCookie(handshakeInput) {
    // fix for express 4.x (parse the cookie sid to extract the correct part)
    var handshake = JSON.parse(JSON.stringify(handshakeInput)); // copy of object
    if(handshake.secureCookies && handshake.secureCookies[key]) handshake.secureCookies = (handshake.secureCookies[key].match(/\:(.*)\./) || []).pop();
    if(handshake.signedCookies && handshake.signedCookies[key]) handshake.signedCookies[key] = (handshake.signedCookies[key].match(/\:(.*)\./) || []).pop();
    if(handshake.cookies && handshake.cookies[key]) handshake.cookies[key] = (handshake.cookies[key].match(/\:(.*)\./) || []).pop();

    // original code
    return (handshake.secureCookies && handshake.secureCookies[key])
        || (handshake.signedCookies && handshake.signedCookies[key])
        || (handshake.cookies && handshake.cookies[key]);
  }

  function resolve(parseErr, storeErr, session) {
    if (parseErr) return parseErr;
    if (!storeErr && !session) return new Error ('could not look up session by key: ' + key);
    return storeErr;
  }
};
