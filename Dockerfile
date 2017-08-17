FROM node:8.4

ENV NODE_ENV production

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN set -ex \
  && apt-get update \
  && apt-get install -y git python libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

# Install app dependencies
COPY package.json .
RUN yarn install

# Install app source
RUN mkdir app
COPY ./app ./app
RUN mkdir config
COPY ./config ./config
COPY index.js .

CMD ["npm", "start"]
