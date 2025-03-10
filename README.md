# Calla Manuel Bot

## Install project instructions

### Requirements

- Node

- Git

### Install Dependencies

- Clones repon into local

- go into project folder and run

`
npm install
`

- Create .env file in project folder and add you token

`
BOT_TOKEN = "token"
USER_TO_BE_SHOUT = "userid"
`
### How to run the bot with docker

Build image
`
docker build -t callamanuelbot .
`

Run container
`
 docker container run -d --name calla-manuel-bot --restart unless-stopped -e TZ=Europe/Madrid --env-file .env callamanuelbot
`

We need to set the time zone to ensure the bot works correctly

Stop the container
`
docker stop calla-bot
`

Remove the container
`
docker rm calla-bot
`

Run the logs
`
docker logs -f calla-manuel-bot
`

Access running container
`
docker exec -it calla-manuel-bot /bin/bash
`