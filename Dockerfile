FROM node:8.4

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

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
