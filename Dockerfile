FROM node:8.2-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
RUN yarn install

# Install app source
COPY . .

CMD ["npm", "start"]
