var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    db: {
      dialect: 'sqlite'
    }
  },

  production: {
    db: {
      dialect: 'postgres',
      host: process.env.DB_HOST,
      username: process.env.COMMON_DB_USERNAME,
      password: process.env.COMMON_DB_PASSWORD,
      database: process.env.COMMON_DB_NAME
    }
  }
};

module.exports = config[env];
