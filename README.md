# AdOn Mailer

A simple transactional mailer for user signup and password reset with nodemailer and a custom pug template, promisified with bluebird

## Installing

Using npm :

```
npm install adon-mailer
```

Using yarn :

```
yarn add adon-mailer
```

## Setup

Import ES6 module style :

```
import Mailer from 'adon-mailer'
```

Or CommonJS style :

```
const Mailer = require('adon-mailer')
```

Then provide a configuration object to the `constructor` :

```
const mailer = new Mailer({
  service: // Email service (ex: 'gmail')
  , user: // Email account
  , pass: // Service password
  , protocol: // Default to 'http'
  , domain: // Default to 'localhost'
  , app: // Default to 'Application'
  , logo: // Default to null (ex: 'img/logo.png')
  , locales: // Default to '../src/locales.json' (ES6 import)
  , template: // Default to '../src/template.pug'
})
```
* Have a look at [adon-i18n](https://github.com/MartyDisco/adon-i18n) for more info about the `locales` object.

## Useage

Assuming you got a user database running and some sort of API to handle email verification and password reset, the only instance function we need is `userTransaction` (in this example, we extracted `lang` from the user browser into the payload sent by the signup form to our route, hence the `req.body.lang` provided by a middleware parser).

```
exampleSignupOrResetRoute(req, res) {
  // Check if user already exist / Generate token / Create user
    .then(user => mailer.userTransaction({ user, lang: req.body.lang })
    .then(() => // Send a HTTP response)
    .catch(err => // Treat errors)
}
```

* Have a look at [adon-encrypt](https://github.com/MartyDisco/adon-encrypt) for a simple way to generate token and HMAC user passwords.

A minimal user object must contain the following properties for the module to operate (the `user.state` property is used to trigger a verification email or a password reset one accordingly).

```
const user = {
  token: // A secret string used to verify email and reset password
  , email: // User email
  , state: // 'pending' or 'verified', anything else is treated as 'banned'
}
```

Your application should also handle those GET routes and query parameters as it will be sent as links to your users :

```
/login?email=<user.email>&token=<user.token>
/reset?email=<user.email>&token=<user.token>
```

For example, you can trigger the user email verification if both queries parameters `email` and `token` are present, and serve directly your login form if not. You can do the opposite with the reset route (only serving the reset form if parameters are present and matches). Don't forget to regenerate the token after useage, make it strong and/or limit its lifespan.

## Behaviors

You can provide your own Pug template in the config object to the class `constructor`. The following properties will be passed and available in it (you can copy the default one in `src/template.pug` for a starting point) :

```
url // Protocol and domain
logo // Path from domain
header // Text Header
redirect // Route from domain
query // Query Parameters
callToAction // Call-to-action text
app // Application Title
```

You can also force the `lang` object property when calling `userTransaction` instance function to a litteral string (ex: 'fr'), or ommit it (it will then default to 'en'). The english and french locales are already built-in and will be available if you don't provide yours.

## Dependencies

* [adon-i18n](https://github.com/MartyDisco/adon-i18n) - A simple HMAC and authentication token generator class, promisified with bluebird
* [bluebird](https://github.com/petkaantonov/bluebird) - A full featured promise library with unmatched performance
* [foundation-emails](https://github.com/zurb/foundation-emails) - Quickly create responsive HTML emails that work on any device and client
* [html-minifier](https://github.com/kangax/html-minifier) - Javascript-based HTML compressor/minifier
* [juice](https://github.com/Automattic/juice) - Juice inlines CSS stylesheets into your HTML source
* [nodemailer](https://github.com/nodemailer/nodemailer) - Send e-mails with Node.JS
* [pug](https://github.com/pugjs/pug) - Robust, elegant, feature rich template engine for Node.js

## License

This project is licensed under the MIT License - see the LICENSE.md file for details
