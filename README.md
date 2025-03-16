# Calla Manuel Bot

This is project is a telegram bot built with the typescript library Grammy, the objective of this project is to practice Typescript Skill with a silly meme project.



## Install project instructions

### Requirements

- Node

- Docker

- Git

### Install Dependencies

- Clones repon into local

- go into project folder and run

`
npm install
`

- Create .env file in project folder and add you token

`
BOT_TOKEN=YOURTOKEN
CREATOR_NAME=YOUR TELEGRAM ID
FIRST_ADMIN=TELEGRAM ID OF USER TO BE ADMIN
SECOND_ADMIN=TELEGRAM ID OF USER TO BE ADMIN
MANUEL_USER=TELEGRAM ID OF USER TO BE BULLIED
`

## Running the bot

To run the bot locally once the previous steps have been completed just run:

`
npm run start
`

However this will eventually shut down, for a continuis run, I opted to deploy using docker into a personal Raspberry pi

### How to run the bot with docker

*(To deploy in a raspberry you will need to install docker and clone the repo into the raspberry)*

Build image
`
docker build -t callamanuelbot .
`

Run container
`
docker container run -d --name calla-manuel-bot --restart unless-stopped --env-file .env callamanuelbot
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

or

`
docker exec -it calla-manuel-bot sh
`