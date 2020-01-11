const passport = require('passport');
const strategy = require('passport-facebook');
const FacebookStrategy = strategy.Strategy;

const User = require('../models/UserSchema.js');

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(
    new FacebookStrategy(
        {
            clientID: '2550070455269720',
            clientSecret: '179afa9c4964481048dc34f718985a7c',
            callbackURL: 'http://localhost:8080/auth/facebook/callback',
            profileFields: ['id', 'email', 'name']
        },
        function(accessToken, refreshToken, profile, done) {
            console.log(profile)
            User.findOrCreate(profile, (err, user) => {
                if (err) return done(err);
                return done(err, user);
            })
        }
    )
);