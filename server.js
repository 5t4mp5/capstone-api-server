const express = require('express');
const app = express();
const { dbSync } = require('./db');
const port = process.env.PORT || 3000;
const cors = require('cors');
const { User } = require('./db');
const io = require('socket.io');

//find logged in user and attach user to req.body
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }
  User.exchangeTokenForUser(req.headers.authorization)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(next);
});

const isLoggedIn = (req, res, next) => {
  if (!req.user) {
    const error = new Error('not logged in');
    error.status = 401;
    return next(error);
  }
  next();
};

app.use(cors());

//body-parsing

app.use(express.json());

//api
app.use('/api', require('./api'));

// Handle 404s
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//error handling
app.use((err, req, res, next) => {
  console.log('ERROR HANDLER');
  res.status(err.status || 500);
  res.send(err.message || 'Internal server error');
});

// start server

const createServer = () => {
  dbSync().catch(e => {
    throw e;
  });
  return app.listen(port, () => console.log(`listening on port ${port}`));
};

const server = createServer();

const socketServer = io(server);

const promiseToJoin = (socket, room) => {
  return new Promise((res, rej) => {
    socket.join(room, () => res(room));
  });
};

socketServer.on('connect', async socket => {
  const token = socket.handshake.headers.authorization;
  const user = await User.exchangeTokenForUser(token);
  const [userRoom, familyRoom] = [user.id, user.familyId];
  await Promise.all([
    promiseToJoin(socket, userRoom),
    promiseToJoin(socket, familyRoom),
  ]);
  socketServer.to(userRoom).emit('hello', { message: 'HELLO USER!' });
  socketServer.to(familyRoom).emit('hello', { message: 'HELLO FAMILY!' });
  //When a new event is created, send a message to all other users to trigger a fetch events
  socket.on('new_event', () =>
    socketServer.to(familyRoom).broadcast.emit('new_event')
  );
  //location request with a users object { target: [target user's id], requester: [requester's user id] }
  socket.on('request_loc', users => {
    socketServer
      .to(users.target)
      .emit('request_loc', { requester: users.requester });
    console.log('LOCATION REQUEST SOCKET EVENT', users.target, users.requester);
  });
  //location respond with the id of the user who requested it, and the coordinates in an object
  socket.on('response_location', response => {
    socketServer
      .to(response.requester)
      .emit('response_location', { coords: response.coords });
    console.log(
      'LOCATION RESPONSE SOCKET EVENT',
      response.requester,
      response.coords
    );
  });
  //when a new alert is created use this event to trigger client to fetch alerts
  socket.on('new_alert', () => {
    socketServer.to(familyRoom).emit('new_alert');
    console.log('NEW ALERT SOCKET EVENT');
  });
  //new poll
  socket.on('new_poll', () => {
    socketServer.to(familyRoom).broadcast.emit('new_poll');
    console.log('NEW POLL SOCKET EVENT');
  });
  //new vote
  socket.on('new_vote', () => {
    socketServer.to(familyRoom).emit('new_vote');
    console.log('NEW VOTE SCKET EVENT');
  });
  //poll ended
  socket.on('poll_ended', () => socketServer.to(familyRoom).emit('poll_ended'));
  //new family member
  socket.on('new_family_member', () => {
    socketServer.to(familyRoom).emit('new_family_member');
    console.log('NEW FAMILY MEMBER SOCKET EVENT');
  });
});

module.exports = { socketServer, app };
