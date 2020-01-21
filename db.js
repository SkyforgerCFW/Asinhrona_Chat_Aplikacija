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
    mongoose.connect('mongodb://localhost:27017/chat_app', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
    mongoose.connection.on('connected', () => console.log('Connected mamu mu'));
});

/* function query(qString, callback) {
    pool.connect((err,client,done) => {
        if(err) console.log(err);
        client.query(qString, (err, result) => {
            if (err) return console.error('Error running query: ', err);
            callback(null, result);
            client.end();
        });
    });
} */

module.exports = connect;
    /* insertMessage: (username, message, time, callback) => {
        let queryString = 'INSERT INTO message VALUES (DEFAULT, \'' + username + '\',\'' + message + '\', to_timestamp(' + time + '))';
        query(queryString, (err) => {
            if (err) callback(err);
            else callback(null);
        });
    },
    getMessages: (limit, callback) => {
        let queryString = 'SELECT username, msg, time FROM message LIMIT ' + limit;
        query(queryString, (err, result) => {
            if (err) callback(err);
            else callback(null, result.rows);
        });
    } 
}; */