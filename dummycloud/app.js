const DummyCloud = require("./src/DummyCloud");
const Logger = require("./src/Logger");
const MqttClient = require("./src/MqttClient");

if (process.env.LOGLEVEL) {
  Logger.setLogLevel(process.env.LOGLEVEL);
}

const dummyCloud = new DummyCloud();
const mqttClient = new MqttClient(dummyCloud);

dummyCloud.initialize();
mqttClient.initialize();
