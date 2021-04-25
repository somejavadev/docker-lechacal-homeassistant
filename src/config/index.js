module.exports = {
    logLevel: process.env.LOG_LEVEL || 'info',
    serial: process.env.SERIAL || '/dev/ttyAMA0',
    baudRate: parseInt(process.env.BAUD_RATE) || 38400,
    deviceMapping: process.env.DEVICE_MAPPING || 'RPICT7V1.json',
    mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
    mqttUser: process.env.MQTT_USER,
    mqttPassword: process.env.MQTT_PASSWORD,
    identifier: process.env.IDENTIFIER || 'lechacal',
    discoveryPrefix: process.env.DISCOVERY_PREFIX || 'homeassistant',
};
