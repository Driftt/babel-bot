 <p align="center" style="margin-bottom: 25px;"> 
    <img src="img/babel.png" alt="babel bot">
 </p>

Babel-Bot
---
Transation bot for Drift

<i>Note this project is no longer actively maintained.</i>

Requires a Google API key with access to the Google Cloud Transation service. You can create one from here: https://cloud.google.com/translate/

You can find your Drift OAuth Access token by following the quick start <a href="https://devdocs.drift.com/docs/quick-start">here</a>

## Deploying to Heroku

### CLI install 

1. `heroku create`

2. `git push heroku master`

3. `heroku addons:create heroku-postgresql:hobby-dev`

4. `heroku config:set BOT_API_TOKEN={OAuth Access token}`

5. `heroku config:set GOOGLE_API_KEY={Google Api Key}`

### GUI install

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Driftt/babel-bot)

