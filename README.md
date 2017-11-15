# Babel-Bot
Transation bot for Drift

Requires a Google API key with access to the Google Cloud Transation service. You can create one from here: https://cloud.google.com/translate/
## Deploying to Heroku

### CLI install 

1. `heroku create`

2. `git push heroku master`

3. `heroku addons:create heroku-postgresql:hobby-dev`

4. `heroku config:set BOT_API_TOKEN={OAuth Access token}`

5. `heroku config:set GOOGLE_API_KEY={Google Api Key}`

### GUI install

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Driftt/babel-bot)

![Settings to configure](https://d1ax1i5f2y3x71.cloudfront.net/items/1N0v3X043C0V3P180A3w/%5B9e909bd62b075a756360e2f775521709%5D_Screen+Shot+2017-11-14+at+11.57.33+AM.png?X-CloudApp-Visitor-Id=2789091&v=3f8ee715)
