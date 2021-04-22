# A Docker based Home Assistant interface for LeChacal.com's RPICT's Energy Monitoring Sensors

**Docker Hub:** [`gtricot/ha-lechacal-mqtt:latest`](https://hub.docker.com/r/gtricot/ha-lechacal-mqtt/)

![License](https://img.shields.io/github/license/ned-kelly/docker-lechacal-homeassistant.svg) ![Docker Pulls](https://img.shields.io/docker/pulls/gtricot/ha-lechacal-mqtt.png) ![buildx](https://github.com/gtricot/docker-lechacal-homeassistant/workflows/buildx/badge.svg)

----

This project is a simple lightweight docker container, designed to read data from the LeChacal Energy Monitoring PCB's and then transmit data to a [Home Assistant](https://www.home-assistant.io/) server (via MQTT) as part of a wider energy monitoring solution...

The program ** should ** support all LeChacal devices that communicate via Serial, however at the time of writing I only have a RPICT7V1_v2.0 to test it on.

Lastly, the use of a CT Clamp's to monitor energy consumption on your individual circuits, is a great addition to a fully featured smart home, and the [Voltronic HA Solar Monitor](https://github.com/ned-kelly/docker-voltronic-homeassistant) (if you are running this also).

--------------------------------------------------

The program is designed to be run in a Docker Container, and can be deployed on a Raspberry PI, inside your breaker box, using a DIN rail mount such as the [Modulbox, from Italtronic](https://au.rs-online.com/web/p/raspberry-pi-cases/7989818/).

## Supported LeChacal PCB's

- RPICT3V1 - 3 CT 1 Voltage.
- RPICT3T1 - 3 CT 1 Temperature
- RPICT4V3_v2.0 - 4 CT 3 AC Voltage.
- RPICT7V1_v2.0 - 7 CT 1 AC Voltage.
- RPICT8 - 8 CT

Note, if your device is not listed here you can create a json mapping file - Please look at the examples in the `config/device-mapping` directory.

## Prerequisites

You may need to configure your Raspberry PI's `/boot/config.txt` file like so:

```
[all]
enable_uart=1
uart_enable=yes
```

And disable the Serial Console output using the `raspi-config` tool.

## Usage
Run the official Docker image (i386, amd64, armv6, armv7, arm64).

### Run
```
docker run -d --name ha-lechacal-mqtt       \
    --device=/dev/ttyAMA0:/dev/ttyAMA0      \ # add serial port device from host
    - e MQTT_URL=mqtt://my_mqtt_broker:1883 \ # set mqtt broker url
    gtricot/ha-lechacal-mqtt
```

### Configure
Configuration uses environment variables.

| Env var         | Description                                                            | Default value          |
|-----------------|------------------------------------------------------------------------|------------------------|
|LOG_LEVEL        | Log level (INFO, DEBUG, ERROR)                                         | INFO                   |
|SERIAL           | Serial Port location                                                   | /dev/ttyAMA0           |
|BAUD_RATE        | Serial Port Baud Rate                                                  | 38400                  |
|DEVICE_MAPPING   | Lechacal Device mapping file                                           | RPICT7V1.json          |
|IRMS_MA_OFFSET   | Offset applied to Irms measures                                        | -240                   |
|MQTT_URL         | MQTT Broker connection URL                                             | mqtt://localhost:1883  |
|MQTT_USER        | MQTT user     (optional)                                               |                        |
|MQTT_PASSWORD    | MQTT password (optional)                                               |                        |
|IDENTIFIER       | Identifier for Home-Assistant Discovery                                | lechacal               |
|DISCOVERY_PREFIX | Topic prefix for Home-Assistant Discovery                              | homeassistant          |

_**Note:**_

  - builds on docker hub are currently for `linux/arm/v6,linux/arm/v7,linux/arm64/v8,linux/amd64` -- If you have issues standing up the image on your Linux distribution (i.e. An old Pi/ARM device) you may need to manually build the image to support your local device architecture - This can be done by uncommenting the build flag in your docker-compose.yml file.

## Integrating into Home Assistant.

Providing you have setup [MQTT](https://www.home-assistant.io/components/mqtt/) with Home Assistant, the device will automatically register in your Home Assistant when the container starts for the first time -- You do not need to manually define any sensors.

From here you can setup [Graphs](https://www.home-assistant.io/lovelace/history-graph/) and regular text value sensors to display sensor data.
