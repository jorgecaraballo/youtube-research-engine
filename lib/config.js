'use strict';

var environments = {};

environments.staging = {
    'httpPort': 8090,
    'httpsPort': 8091,
    'envName': 'staging',
    'hashingSecret': process.env.HASHING_SECRET || 'thisIsASecret',
    'twilio': {
        'accountSid': process.env.TWILIO_SID,
        'authToken': process.env.TWILIO_TOKEN,
        'fromPhone': process.env.TWILIO_PHONE
    },
    'templateGlobals': {
        'appName': 'tercerservidor',
        'baseUrl': 'http://192.168.11.199:8090/'
    },
    'youtube': {
        'apiKey': process.env.YT_API_KEY,
        'channelId': process.env.YT_CHANNEL_ID || 'UC24-WP9J7Ekuy_GR36MnoSg'
    }
};

var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;
