const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const passport = require('passport');
const flash = require('connect-flash');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const bcrypt = require('bcryptjs');

const datetime = require('simple-datetime-formater');

const mongoose = require('mongoose');
const connect = require('./db.js');
const Chat = require('./models/ChatSchema.js');
const User = require('./models/UserSchema.js');
const UserController = require('./user/user.controller.js');
let name;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(flash());

app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'top-secret-chat',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

http.listen(8080, () => { console.log('listening on *:8080'); });
/* GET home page. */
app.get('/chat', function(req, res, next) {
  res.render('index.ejs');
});

app.get('/', (req, res, next) => {
  res.render('login.ejs');
});

app.get('/signup', (req, res, next) => {
  res.render('signup.ejs');
});

app.post('/', (req, res, next) => {
  if (req.body.name && req.body.email && req.body.pass && req.body.passConf) {
    if (req.body.pass !== req.body.passConf) {
      let err = new Error('Password mismatch');
      err.status = 400;
      res.send('Šifre se ne poklapaju!');
      return next(err);
    }

    let userData = {
      name: req.body.name,
      email: req.body.email
    }

    bcrypt.hash(req.body.pass, 10, function(err, hash) {
      if (err) return next(err);
      userData.pass = hash;
      next();
    });

    User.create(userData, (err, user) => {
      if (err) return next(err);
      else {
        req.session.userId = user._id;
        name = user.name;
        return res.redirect('/chat');
      }
    });
  } else if (req.body.logemail && req.body.logpass) {
    User.authenticate(req.body.logemail, req.body.logpass, function(err, user) {
      if (err || !user) {
        let error = new Error('Wrong email or password.');
        error.status = 401;
        return next(error);
      } else {
        req.session.userId = user._id;
        name = user.name;
        return res.redirect('/chat');
      }
    });
  } else {
    let err = new Error('All fields required.');
    err.status = 400;
    return next(err);
  }
});

app.get('/auth/facebook', passport.authenticate("facebook", { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successMessage: 'USPELO BE',
  failureMessage: 'NEJE USPELO BE'
}));

io.on('connection', (socket) => {
  socket.on('username', async () => {
    socket.username = name;
    await Chat.find({}, (err, chats) => {
      if (err) console.log(err);
      chats.forEach(chat => {
        socket.emit('chat_message', '<strong>' + chat.sender + '</strong>: ' + chat.message + ' <i style="float: right">' + datetime.formatTime(chat.createdAt) + '</i>');
      });
    });
    io.emit('is_online', '<i>'+ socket.username + ' je ušao u chat <3</i>');
  });

  socket.on('disconnect', () => {
    io.emit('is_online', '<i>' + socket.username + ' je izašao iz chata ;-;</i>');
  });

  socket.on('chat_message', (message) => {
    let chatMessage = new Chat({ message: message, sender: socket.username, sender_id: socket.id});
    chatMessage.save();
    io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message + ' <i style="float: right">' + datetime.formatTime(Date.now()) + '</i>');
  });

  socket.on('is_typing', () => {
    socket.broadcast.emit('is_typing', socket.username + ' kuca...');
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('stop_typing');
  });
});