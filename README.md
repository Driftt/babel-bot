# Babel-Bot
Transation bot for Drift

Requires a Google API key with access to the Google Cloud Transation service. You can create one from here: https://cloud.google.com/translate/

You can find your OAuth Access token at dev.drift.com
![OAuth token](https://d1ax1i5f2y3x71.cloudfront.net/items/073z1y1f3Q2F28381M3J/%5B8fbf40aa6cdb4864f1a68d0bc9e04eff%5D_Screen+Shot+2017-11-17+at+9.31.53+AM.png?X-CloudApp-Visitor-Id=2789091&v=7439000e)
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


### Linking to dev.drift.com
Setup the request URL and actions

![Setup](https://d1ax1i5f2y3x71.cloudfront.net/items/0Z0z250P1H250E2N3q2x/%5B262ffbd648bec19450a399495e3ab892%5D_Screen+Shot+2017-11-17+at+9.31.36+AM.png?X-CloudApp-Visitor-Id=2789091&v=ffcd2046)
