FROM node:8.4-alpine

# Create app directory
RUN set -ex \
  && apk update \
  && apk add git make python cairo-dev pkgconfig g++ pango-dev giflib-dev jpeg-dev \
  && rm -rf /var/cache/apk/* \
  && mkdir -p /usr/src/app/{app,config} \
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
RUN yarn install

# Install app source
COPY ./app ./app
COPY ./config ./config
COPY index.js .

CMD ["npm", "start"]
