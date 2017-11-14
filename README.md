# Driffy
Giphy for Drift

## Deploying to Heroku

### CLI install 

1. `heroku create`

2. `git push heroku master`

3. `heroku addons:create heroku-postgresql:hobby-dev`

4. `heroku config:set BOT_API_TOKEN={BOT_API_TOKEN}`

5. `heroku config:set GOOGLE_API_KEY={GOOGLE_API_KEY}`

### GUI install

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Driftt/babel-bot)
