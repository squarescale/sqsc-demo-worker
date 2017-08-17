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
      logging: false,
      dialect: 'postgres',
      host: process.env.DB_HOST,
      username: process.env.COMMON_DB_USERNAME || "postgres",
      password: process.env.COMMON_DB_PASSWORD || "MeXypcQ5eavgEeCaMkyAzVI9r2cLgbXk",
      database: process.env.COMMON_DB_NAME || "postgres",
    }
  }
};

module.exports = config[env];
