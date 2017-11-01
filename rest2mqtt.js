#!/usr/bin/env node
var mqtt = require('mqtt');
const Hapi = require('hapi');
require('require-yaml');

// Load config from path in koboldconfig
console.log('Starting kobold to mqtt');
if (process.env.rest2mqtt_config == null) {
  console.error('Missing enviroment variable rest2mqtt_config');
  process.exit(-1);
}
console.log('Config file: ' + process.env.rest2mqtt_config);
var config = require(process.env.rest2mqtt_config);
console.log('Connect mqtt: ' + config.mqtt.server);
var mqttCon = mqtt.connect(config.mqtt.server);

var state = {};

mqttCon.on('connect', () => {
  mqttCon.subscribe('+/status/#');
});

mqttCon.on('message', (topic, message) => {
  // console.log(topic, message.toString())
  let stateIndex = topic.indexOf('/status/');
  if (stateIndex > 0) {
    let controller = topic.substr(0, stateIndex);
    let device = topic.substr(stateIndex + 7);
    if (!state[controller]) {
      state[controller] = {};
    }
    state[controller][device] = JSON.parse(message.toString());
  }
});

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
  port: 8000
});

// Add the route
server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    var response = {
    };
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        response[key] = 'http://' + request.info.host + '/' + key + '/';
      }
    }
    return reply(response);
  }
});

// Add the route
server.route({
  method: 'GET',
  path: '/{name}/',
  handler: function (request, reply) {
    return reply(state[request.params.name]);
  }
});

// Add the route
server.route({
  method: 'POST',
  path: '/{device}/{topic*}',
  handler: function (request, reply) {
    console.log(request.params.device, request.params.topic, request.payload);
    mqttCon.publish(request.params.device + '/set/' + request.params.topic, request.payload, function () {
      // console.log(topic, value)
    });
    return reply();
  }
});

// Start the server
server.start((err) => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
