const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http').Server(app);
const io = require('socket.io')(http, { pingTimeout: 60000 });
const passport = require('passport');
const formidable = require('formidable');
const fs = require('fs');

const session = require('express-session')({
  secret: 'top-secret-chat',
  resave: true,
  saveUninitialized: false,
  /* cookie: { maxAge: 5000 },
  anyKey: '/' */
  //store: new MongoStore({ mongooseConnection: mongoose.connection })
});
//const MongoStore = require('connect-mongo')(session);

const sharedsession = require('express-socket.io-session');

const bcrypt = require('bcryptjs');

const moment = require('moment');

const mongoose = require('mongoose');
const connect = require('./db.js');
const Chat = require('./models/ChatSchema.js');
const User = require('./models/UserSchema.js');
const UserController = require('./user/user.controller.js');
let name;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));
app.use(session);

app.use(passport.initialize());
app.use(passport.session());

io.use(sharedsession(session))

http.listen(8080, () => { console.log('listening on *:8080'); });
/* GET home page. */
app.get('/chat', function(req, res, next) {
  if(!req.session.name) res.redirect('/');
  else res.render('index.ejs');
});

app.get('/', (req, res, next) => {
  res.render('login.ejs');
});

app.get('/signup', (req, res, next) => {
  res.render('signup.ejs');
});

app.get('/logout', async (req, res, next) => {
  if(req.session) await req.session.destroy()
  console.log(req.session);
  res.redirect('/');
});

app.post('/date', (req, res, next) => {
  if (!req.session.name) res.send('nem\'re');
  if (req.body.datum != "") req.session.loaddate = req.body.datum;
  res.redirect('/chat');
});

app.post('/del', (req, res, next) => {
  if (!req.session.name) res.send('nem\'re');
  Chat.find({'createdAt' : { $lte: req.body.datum}}).remove().exec().then(() => {
    console.log('Documents Removed Successfully');
    req.session.loaddate = req.body.datum;
    res.redirect('/chat');
  }).catch((err) => {
    console.error('prejeba ga\n' + err);
  });
});

app.post('/upload', (req, res, next) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    let oldpath = files.file.path;
    let newpath = "/Users/goxy/Documents/KSS-Projekat/public/files/" + files.file.name;
    fs.rename(oldpath, newpath, (err) => {
      if (err) throw err;
      console.log(req.session);
      saveAndEmit('<a href="files/' + files.file.name + '"  target="_blank">' + files.file.name + '</a>', req.session.name, req.session.id);
    });
  });
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
      email: req.body.email,
      pass: bcrypt.hashSync(req.body.pass, 10)
    }

    User.create(userData, (err, user) => {
      if (err) return next(err);
      else {
        req.session.name = user.name;
        req.session.loaddate = moment().subtract(14, 'days').format('YYYY-MM-DD');
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
        req.session.name = user.name;
        req.session.loaddate = moment().subtract(14, 'days').format('YYYY-MM-DD');
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
/* app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successMessage: 'USPELO BE',
  failureMessage: 'NEJE USPELO BE'
})); */

/* app.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.redirect('/');
    req.login(user, (err) => {
      if (err) return next(err);
      name = req.user.name;
      return res.redirect('/chats');
    })
  })
}) */

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), (req, res) => {
  req.session.name = req.user.name;
  req.session.loaddate = moment().subtract(14, 'days').format('YYYY-MM-DD');
  //req.session.userId = req.user.social_id //iz nekog razloga emituje is_online pre učitavanja chat history bez ovoga???
  res.redirect('/chat');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  req.session.name = req.user.name;
  req.session.loaddate = moment().subtract(14, 'days').format('YYYY-MM-DD');
  console.log(req.session.loaddate);
  console.log(req.user);
  //req.session.userId = req.user.social_id;
  res.redirect('/chat');
});

function saveAndEmit(message, sender, sender_id) {
  let chatMessage = new Chat({ message: message, sender: sender, sender_id: sender_id});
  chatMessage.save();
  io.emit('chat_message', '<strong>' + sender + '</strong>: ' + message + ' <i style="float: right">' + moment(Date.now()).format('DD/MM/YYYY, LT') + '</i>');
}

io.on('connection', (socket) => {
  socket.on('username', async () => {
    socket.username = socket.handshake.session.name;
    socket.handshake.session.id = socket.id;
    /* await Chat.find({}, (err, chats) => {
      if (err) console.log(err);
      chats.forEach(chat => {
        socket.emit('chat_message', '<strong>' + chat.sender + '</strong>: ' + chat.message + ' <i style="float: right">' + datetime.formatTime(chat.createdAt) + '</i>');
      });
    }); */
    await Chat.find({"createdAt" : {$gte : new Date(socket.handshake.session.loaddate)}}).then(async chats => {
      chats.forEach(async chat => {
        console.log(chat.createdAt);
        socket.emit('chat_message', '<strong>' + chat.sender + '</strong>: ' + chat.message + ' <i style="float: right">' + moment(chat.createdAt).format('DD/MM/YYYY, LT') + '</i>');
      })
      /* for(i = 0; i < 15; i++) {
        let br = (i + 1) > 9 ? "" + (i + 1): "0" + (i + 1);
        chats[i].createdAt = new Date("2020-01-" + br + "T08:" + br + ":00.000Z");
        console.log(chats[i]);
        await chats[i].save();
      } */
    });
    io.emit('is_online', '<i>'+ socket.username + ' je ušao u chat <3</i>');
  });

  socket.on('disconnect', (reason) => {
    console.log("Disconnected due to " + reason);
    if(socket.username != undefined) io.emit('is_online', '<i>' + socket.username + ' je izašao iz chata ;-;</i>');
  });

  socket.on('chat_message', (message) => {
    /* console.log(socket.handshake.session);
    if(!socket.handshake.session.passport && !socket.handshake.session.user) {
      socket.emit('logout');
      res.redirect('/');
    }
    else { */
      saveAndEmit(message, socket.username, socket.id);
    //}
  });

  socket.on('is_typing', () => {
    socket.broadcast.emit('is_typing', socket.username + ' kuca...');
  });

  socket.on('stop_typing', () => {
    socket.broadcast.emit('stop_typing');
  });
});