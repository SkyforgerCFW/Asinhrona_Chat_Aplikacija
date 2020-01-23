const mongoose = require('mongoose');
const tunnel = require('tunnel-ssh');

const config = {
    username: 'vagrant',
    password: 'vagrant',
    host: '192.168.33.10',
    agent: process.env.SSH_AUTH_SOCK,
    port: '22',
    dstPort: '27017'
};

const connect = tunnel(config, (err, server) => {
    if (err) console.log('SSH connection error: ' + err);
    mongoose.connect('mongodb://localhost:27017/chat_app', { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        useCreateIndex: true 
    });
    mongoose.connection.on('connected', () => console.log('Connected'));
});

module.exports = connect;