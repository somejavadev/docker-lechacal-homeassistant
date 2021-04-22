const bunyan = require('bunyan');
const config = require('../config');

const log = bunyan.createLogger({
    name: 'lechacal-homeassistant',
    level: config.logLevel,
});

module.exports = log;
