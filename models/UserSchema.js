const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: { 
        type: String,
        unique: true,
        trim: true
    },
    pass: { 
        type: String,
        unique: true,
        trim: true
    },
    social_id: { 
        type: String,
        unique: true
    }
});

/* UserSchema.pre('save', function(next) {
    let user = this;
    bcrypt.hash(user.pass, 10, function(err, hash) {
        if (err) return next(err);
        user.pass = hash;
        next();
    });
}); */

let findOrCreate = function(data, callback) {
    User.findOne({'social_id': data._json.id}, function(err, user) {
        if(err) return callback(err);
        if(user) return callback(err, user)
        else {
            const { id, email, first_name } = data._json;
            const userData = {
                social_id: id,
                name: first_name,
                email
            };
            let user = new User(userData).save();
            callback(err, user);
        }
    })
}

UserSchema.statics.authenticate = function(email, pass, callback) {
    User.findOne({ email: email}).exec(function(err, user) {
        if (err) return callback(err);
        else if (!user) {
            let err = new Error('User not found.');
            err.status = 401;
            return callback(err);
        }
        bcrypt.compare(pass, user.pass, function(err, result) { 
            if (result === true) return callback(null, user);
            else return callback();
        });
    });
}

let User = mongoose.model('User', UserSchema);
module.exports = { User, findOrCreate };