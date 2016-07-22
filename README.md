# Twitter post status message using webtask

Sample project for creating an Express-based server that runs on webtask.io for accessing external IDP api with the user's idp access token.
### Version
0.0.1
# Initial Setup & Configuration
```bash
# Create a new wt-cli profile
npm install -g wt-cli
wt init

# Or, if you already use wt-cli:
wt profile ls
```

Please read the following link on how to
[Call an Identity Provider API ](https://auth0.com/docs/what-to-do-once-the-user-is-logged-in/calling-an-external-idp-api)

Some more resources to read on [Identity Provider Access Tokens](https://auth0.com/docs/tokens/idp)

### Initialization
```sh
$ wt create ext_idp_webtask.js
    -s CLIENT_ID=YOUR_NON_INTERACTIVE_AUTH0_CLIENT_ID
    -s CLIENT_SECRET=YOUR_NON_INTERACTIVE_AUTHO_CLIENT_SECRET
    -s ACCOUNT_NAME=YOUR_AUTH0_TENANT_NAME
    -s ID_TOKEN_CLIENT_SECRET=YOUR_CLIENT_SECRET
    -s TWITTER_CONSUMER_KEY=TWITTER_CONSUMER_KEY
    -s TWITTER_CONSUMER_SECRET=TWITTER_CONSUMER_SECRET

```
The above command would create a webtask and give you a url like this
```
Webtask created

You can access your webtask at the following url:

https://webtask.it.auth0.com/api/run/{CONTAINER}/twitter_status_webtask/tweet?webtask_no_cache=1
```
# Usage
```sh
  "use strict";
  const request = require('request');
  const options = {
    url: 'URL_WHEN_YOU_CREATE_WEBTASK',
    headers: {Authorization: 'Bearer USER_ID_TOKEN'},
    json: {status_message: '{TWEET}'}
  };
  request.post(options, function (e, r, b){});
```
# Example Usage

The below is a sample on how to call a Google API with.

```sh
  "use strict";

  const request = require('request');
  const options = {
    url: 'https://webtask.it.auth0.com/api/run/wt-vikas_ramasethu-gmail_com-0/twitter_status_webtask/tweet?webtask_no_cache=1',
    headers: {Authorization: 'Bearer USER_ID_TOKEN'},
    json: {status_message: 'I Love Auth0'}
  };
  request.post(options, function (e, r, b){});
```
