const passport = require('passport');
const passportFb = require('passport-facebook');
const FacebookStrategy = passportFb.Strategy;
const passportGoog = require('passport-google-oauth');
const GoogleStrategy = passportGoog.OAuth2Strategy;

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
            let acc = {
                social_id: profile.id,
                name: profile._json.first_name,
                email: profile._json.email
            }
            User.findOrCreate(acc, (err, user) => {
                if (err) return done(err);
                return done(err, user);
            });
        }
    )
);

passport.use(
    new GoogleStrategy(
        {
            clientID: '1002736574284-ofrvfc1i3d9paq9u47uueqth7ob0tanq.apps.googleusercontent.com',
            clientSecret: 'nSLB0JuiGRuWwQ9k-IyV5-jl',
            callbackURL: 'http://localhost:8080/auth/google/callback'
        },
        function(accessToken, refreshToken, profile, done) {
            let acc = {
                social_id: profile.id,
                name: profile._json.given_name,
                email: profile._json.email
            }
            User.findOrCreate(acc, (err, user) => {
                if (err) return done(err);
                return done(err, user);
            });
        }
    )
);