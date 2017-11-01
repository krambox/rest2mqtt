# VR200 to mqtt

## Config

config.yml example

```
mqtt:
  server: mqtt://<hostname>
```

## Start

Set env variable koboldconfig to config.yml

Start kobold2mqtt.js

## Docker

    docker build -t rest2mqtt .

    docker run --env rest2mqtt_config=/data/config.yml  -v /Volumes/data/smarthome:/data -p 8000:8000 -it rest2mqtt 
