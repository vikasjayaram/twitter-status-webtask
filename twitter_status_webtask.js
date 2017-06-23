"use strict";

 const jwt     = require('jsonwebtoken');
 const moment  = require('moment');
 const request = require('request');
 const express = require('express');
 const Webtask = require('webtask-tools');
 const async   = require('async');
 const Twit    = require('twit@2.2.3');
 const bodyParser = require('body-parser');
 const app     = express();

 /*
 * Local variables
 */
 let accessToken = null;
 let lastLogin = null;
 var jsonParser = bodyParser.json();
 app.post('/tweet', jsonParser, function (req, res) {
   if (!req.headers['authorization']){ return res.status(401).json({ error: 'unauthorized'}); }
   if (req.webtaskContext.body === undefined) {return res.status(400).json({error: 'tweet status is required'}); }
   if (!req.webtaskContext.body || !req.webtaskContext.body['status_message']){return res.status(400).json({error: 'status_message is required'}); }
   const context = req.webtaskContext;
   const token = req.headers['authorization'].split(' ')[1];
   const reqBody = req.body;
   async.waterfall([
     async.apply(verifyJWT, context, reqBody, token),
     getAccessToken,
     getUserProfile,
     callExtIDPApi
   ], function (err, result) {
     if (err) return res.status(400).json({error: err});
     return res.status(200).json({data: result});
   });
 });
/*
* Verify that the user id_token is signed by the correct Auth0 client
*/
function verifyJWT(context, reqBody, token, cb) {
   return jwt.verify(token, new Buffer(context.data.ID_TOKEN_CLIENT_SECRET, 'base64'), function(err, decoded) {
     if (err) return cb(err);
     cb(null, context, reqBody, decoded);
   });
};
/*
* Request a Auth0 access token every 24 hours
*/
function getAccessToken(context, reqBody, decoded, cb) {
   if (!accessToken || !lastLogin || moment(new Date()).diff(lastLogin, 'minutes') > 1440) {
     const options = {
       url: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/oauth/token',
       json: {
         audience: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/api/v2/',
         grant_type: 'client_credentials',
         client_id: context.data.CLIENT_ID,
         client_secret: context.data.CLIENT_SECRET
       }
     };

     return request.post(options, function(err, response, body){
       if (err) return cb(err);
       else {
         lastLogin = moment();
         accessToken = body.access_token;
         return cb(null, context, reqBody, decoded, accessToken);
       }
     });
   } else {
     return cb(null, context, reqBody, decoded, accessToken);
   }
 };

/*
* Get the complete user profile with the read:user_idp_token scope
*/
function getUserProfile(context, reqBody, decoded, token, cb){
   const options = {
     url: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/api/v2/users/' + decoded.sub,
     json: true,
     headers: {
       authorization: 'Bearer ' + token
     }
   };

  request.get(options, function(error, response, user){
     return cb(error, context, reqBody, user);
   });
 };

/*
* Call the External API with the IDP access token to return data back to the client.
*/
function callExtIDPApi (context, reqBody, user, cb) {
  let twitter_access_token = null;
  let twitter_access_token_secret = null;
  const status_message = reqBody.status_message;
  const provider = user.user_id.split('|')[0];
  /*
  * Checks for the identities array in the user profile
  * Matches the access_token with the user_id provider/strategy
  */
  if (user && user.identities) {
    for (var i = 0; i < user.identities.length; i++) {
      if (user.identities[i].access_token && user.identities[i].provider === provider) {
        twitter_access_token = user.identities[i].access_token;
        twitter_access_token_secret = user.identities[i].access_token_secret;
        i = user.identities.length;
      }
    }
  }
  if (twitter_access_token && twitter_access_token_secret) {
    let T = new Twit({
      consumer_key:         context.data.TWITTER_CONSUMER_KEY,
      consumer_secret:      context.data.TWITTER_CONSUMER_SECRET,
      access_token:         twitter_access_token,
      access_token_secret:  twitter_access_token_secret,
    });
    T.post('statuses/update', { status:  status_message}, function(err, data, response) {
      if (err) return cb(err);
      return cb(null, data);
    });
  } else {
    cb({error: 'No Access Token Available'});
  }
};

module.exports = Webtask.fromExpress(app);
