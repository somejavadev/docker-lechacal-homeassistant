const SerialPort = require('serialport');
const {baudRate, mqttUrl, serial, deviceMapping, discoveryPrefix, identifier, mqttUser, mqttPassword} = require('./config');
const mqtt = require('mqtt');
const log = require('./log');

// MQTT Connection
const mqttOptions = {};
if (mqttUser) {
    mqttOptions.username = mqttUser;
}
if (mqttPassword) {
    mqttOptions.password = mqttPassword;
}
log.info(`Connecting to MQTT broker [${mqttUrl}]...`);
log.debug(`MQTT options [${JSON.stringify(mqttOptions)}]`);
const mqttClient  = mqtt.connect(mqttUrl, mqttOptions);
mqttClient.on("connect",function(){	
    log.info(`Connected to MQTT broker [${mqttUrl}]`);
});

// Device mapping loading
log.info(`Loading device mapping [${deviceMapping}]...`);
const deviceMappingJson = require(`./device-mapping/${deviceMapping}`);
log.info(`Loaded device mapping [${deviceMapping}]`);
log.debug(`Device mapping contents [${JSON.stringify(deviceMappingJson)}]`);

// Serial port opening
const serialPort = new SerialPort(serial, {
    baudRate: baudRate,
    autoOpen: false
});
log.info(`Opening serial port [${serial}]...`);
serialPort.open(function (err) {
    if (err) {
        log.error(`Error opening serial port [${serial}] : `, err.message);
        process.exit(1);
    }
});
log.info(`Opened serial port [${serial}]`);

// HA sensors creation
mqttClient.on('connect', function () {
    log.info("Creating HA Sensors...");
    createHASensors();
})

// Serial port data processing
const parser = new SerialPort.parsers.Readline({ delimiter: '\n' });
serialPort.pipe(parser);
var receivedSerialData = false;
parser.on('data', function (data) {

    // Example of values: http://lechacal.com/wiki/index.php?title=RPICT7V1_v2.0
    //     NodeID  RP1     RP2     RP3     RP4     RP5     RP6     RP7     Irms1   Irms2   Irms3   Irms4   Irms5   Irms6   Irms7   Vrms
    //     11      0.0     0.0     0.0     -0.0    0.0     0.0     -0.0    202.1   208.6   235.3   207.2   223.4   3296.3  2310.8  0.9

    // Values from sensor are returned with space/tab between each value.
    var values = data.split(/[ ,]+/);
    var count = 0;

    // Read sensor mapping from JSON file.
    Object.keys(deviceMappingJson).forEach(function(key) {
        try {
            pushHASensorData(key, parseDataFromTemplateParams(values[count], key))
        } catch(e) {
            log.error(e);
        }
        count++;
    });

    if(!receivedSerialData) {
        log.info("Received data from sensor, and posted to MQTT... Program is up and running!"); 
        receivedSerialData = true;
    }

});

function parseDataFromTemplateParams(data, configItem) {
    var returnValue;
    switch(deviceMappingJson[configItem].type) {
      case "float":
        returnValue = parseFloat(data);
        if (isNaN(returnValue)) {
            log.warn(`Nan value detected for float type ${deviceMappingJson[configItem]} config item. Returning 0.0 instead...`);
            returnValue = 0.0;
        }
        break;
      case "integer":
        returnValue = parseInt(data);
        if (isNaN(returnValue)) {
            log.warn(`Nan value detected for integer type ${deviceMappingJson[configItem]} config item. Returning 0 instead...`);
            returnValue = 0;
        }
        break;
      case "string":
        returnValue = data;
        break;
      default:
        returnValue = data;
    }

    // If there's options to 'transform' the value/number (ie divide, multiply etc - apply these calculations...)
    var transformMath = (deviceMappingJson[configItem].convertMath === undefined) ? false : deviceMappingJson[configItem].convertMath;
    if(transformMath) {
        return eval(`${returnValue} ${transformMath}`);
    } else {
        return returnValue;
    }
}

function createHASensor(name, unit_of_measurement, icon) {
    mqttClient.publish(
        `${discoveryPrefix}/sensor/${identifier}_${name}/config`,
        `{
            "name": "${name}",
            "unit_of_measurement": "${unit_of_measurement}",
            "state_topic": "${discoveryPrefix}/sensor/${identifier}_${name}",
            "icon": "mdi:${icon}"
        }`
    );
}

function pushHASensorData(name, data) {
    mqttClient.publish(
        `${discoveryPrefix}/sensor/${identifier}_${name}`, `${data}`
    );
}

function createHASensors() {
    // Logic to Auto-create HA device...
    Object.keys(deviceMappingJson).forEach(function(key) {
        createHASensor(key, deviceMappingJson[key].unit_of_measurement, deviceMappingJson[key].icon)
    });
}

setTimeout(createHASensors, 1000 * 60 * 5); // Re-create HA sensors every 5 minutes (if HA is restarted etc)...