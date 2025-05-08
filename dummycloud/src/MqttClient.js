const Logger = require("./Logger");
const mqtt = require("mqtt");


class MqttClient {
    /**
     *
     * @param {import("./DummyCloud")} dummyCloud
     */
    constructor(dummyCloud) {
        this.dummyCloud = dummyCloud;

        this.autoconfTimestamps = {};

        this.dummyCloud.onHandshake((data) => {
            this.handleHandshake(data);
        });
        this.dummyCloud.onData((data) => {
            this.handleData(data);
        });
    }

    initialize() {
        const options = {
            clientId: `deye_dummycloud_${Math.random().toString(16).slice(2, 9)}`,  // 23 characters allowed
        };

        if (process.env.MQTT_USERNAME) {
            options.username = process.env.MQTT_USERNAME;

            if (process.env.MQTT_PASSWORD) {
                options.password = process.env.MQTT_PASSWORD;
            }
        } else if (process.env.MQTT_PASSWORD) {
            // MQTT_PASSWORD is set but MQTT_USERNAME is not
            Logger.error("MQTT_PASSWORD is set but MQTT_USERNAME is not. MQTT_USERNAME must be set if MQTT_PASSWORD is set.");
            process.exit(1);
        }

        if (process.env.MQTT_CHECK_CERT) {
            options.rejectUnauthorized = (process.env.MQTT_CHECK_CERT !== "false");
        }

        this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

        this.client.on("connect", () => {
            Logger.info("Connected to MQTT broker");
        });

        this.client.on("error", (e) => {
            if (e && e.message === "Not supported") {
                Logger.info("Connected to non-standard-compliant MQTT Broker.");
            } else {
                Logger.error("MQTT error:", e.toString());
            }
        });

        this.client.on("reconnect", () => {
            Logger.info("Attempting to reconnect to MQTT broker");
        });
    }

    handleHandshake(data) {
        // Nothing to see here
    }

    handleData(data) {
        this.ensureAutoconf(data.meta, data.header.loggerSerial.toString(), data.payload.inverter_meta.mppt_count);
        const baseTopic = `${MqttClient.TOPIC_PREFIX}/${data.header.loggerSerial.toString()}`;

        for (let i = 1; i <= data.payload.inverter_meta.mppt_count; i++) {
            this.client.publish(`${baseTopic}/pv/${i}/v`, data.payload.pv[`${i}`].v.toString());
            this.client.publish(`${baseTopic}/pv/${i}/i`, data.payload.pv[`${i}`].i.toString());
            this.client.publish(`${baseTopic}/pv/${i}/w`, data.payload.pv[`${i}`].w.toString());
            this.client.publish(
                `${baseTopic}/pv/${i}/kWh_today`,
                data.payload.pv[`${i}`].kWh_today.toString(),
                {retain: true}
            );

            if (data.payload.pv[`${i}`].kWh_total > 0) {
                this.client.publish(
                    `${baseTopic}/pv/${i}/kWh_total`,
                    data.payload.pv[`${i}`].kWh_total.toString(),
                    {retain: true}
                );
            }
        }

        this.client.publish(`${baseTopic}/grid/active_power_w`, data.payload.grid.active_power_w.toString());

        this.client.publish(
            `${baseTopic}/grid/kWh_today`,
            data.payload.grid.kWh_today.toString(),
            {retain: true}
        );
        if (data.payload.grid.kWh_total > 0) {
            this.client.publish(
                `${baseTopic}/grid/kWh_total`,
                data.payload.grid.kWh_total.toString(),
                {retain: true}
            );
        }
        this.client.publish(`${baseTopic}/grid/v`, data.payload.grid.v.toString());
        this.client.publish(`${baseTopic}/grid/hz`, data.payload.grid.hz.toString());

        this.client.publish(`${baseTopic}/inverter/radiator_temperature`, data.payload.inverter.radiator_temp_celsius.toString());


        const totalDcPower = Object.values(data.payload.pv).reduce((sum, pv) => sum + pv.w, 0);
        const acPower = Math.abs(data.payload.grid.active_power_w);
        const efficiency = totalDcPower > 0 && totalDcPower > acPower ? ((acPower / totalDcPower) * 100).toFixed(2) : "null";

        this.client.publish(`${baseTopic}/inverter/efficiency`, efficiency);
    }

    ensureAutoconf(meta, loggerSerial, mpptCount) {
        // (Re-)publish every 4 hours
        if (Date.now() - (this.autoconfTimestamps[loggerSerial] ?? 0) <= 4 * 60 * 60 * 1000) {
            return;
        }
        const baseTopic = `${MqttClient.TOPIC_PREFIX}/${loggerSerial.toString()}`;
        const device = {
            "manufacturer":"Deye",
            "model":"Microinverter",
            "name":`Deye Microinverter ${loggerSerial}`,
            "configuration_url": `http://${meta.remoteAddress}/index_cn.html`,
            "identifiers":[
                `deye_dummycloud_${loggerSerial}`
            ]
        };

        for (let i = 1; i <= mpptCount; i++) {
            this.client.publish(
                `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_pv${i}_v/config`,
                JSON.stringify({
                    "state_topic": `${baseTopic}/pv/${i}/v`,
                    "name":`PV ${i} Voltage`,
                    "unit_of_measurement": "V",
                    "device_class": "voltage",
                    "state_class": "measurement",
                    "object_id": `deye_dummycloud_${loggerSerial}_pv_${i}_v`,
                    "unique_id": `deye_dummycloud_${loggerSerial}_pv_${i}_v`,
                    "expire_after": 360,
                    "enabled_by_default": i < 3,
                    "device": device
                }),
                {retain: true}
            );
            this.client.publish(
                `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_pv${i}_i/config`,
                JSON.stringify({
                    "state_topic": `${baseTopic}/pv/${i}/i`,
                    "name":`PV ${i} Current`,
                    "unit_of_measurement": "A",
                    "device_class": "current",
                    "state_class": "measurement",
                    "object_id": `deye_dummycloud_${loggerSerial}_pv_${i}_i`,
                    "unique_id": `deye_dummycloud_${loggerSerial}_pv_${i}_i`,
                    "expire_after": 360,
                    "enabled_by_default": i < 3,
                    "device": device
                }),
                {retain: true}
            );
            this.client.publish(
                `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_pv${i}_w/config`,
                JSON.stringify({
                    "state_topic": `${baseTopic}/pv/${i}/w`,
                    "name":`PV ${i} Power`,
                    "unit_of_measurement": "W",
                    "device_class": "power",
                    "state_class": "measurement",
                    "object_id": `deye_dummycloud_${loggerSerial}_pv_${i}_w`,
                    "unique_id": `deye_dummycloud_${loggerSerial}_pv_${i}_w`,
                    "expire_after": 360,
                    "enabled_by_default": i < 3,
                    "device": device
                }),
                {retain: true}
            );

            this.client.publish(
                `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_pv${i}_kWh_today/config`,
                JSON.stringify({
                    "state_topic": `${baseTopic}/pv/${i}/kWh_today`,
                    "name":`PV ${i} Energy Today`,
                    "unit_of_measurement": "kWh",
                    "device_class": "energy",
                    "state_class": "total_increasing",
                    "object_id": `deye_dummycloud_${loggerSerial}_pv_${i}_kWh_today`,
                    "unique_id": `deye_dummycloud_${loggerSerial}_pv_${i}_kWh_today`,
                    "enabled_by_default": i < 3,
                    "device": device
                }),
                {retain: true}
            );
            this.client.publish(
                `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_pv${i}_kWh_total/config`,
                JSON.stringify({
                    "state_topic": `${baseTopic}/pv/${i}/kWh_total`,
                    "name":`PV ${i} Energy Total`,
                    "unit_of_measurement": "kWh",
                    "device_class": "energy",
                    "state_class": "total_increasing",
                    "object_id": `deye_dummycloud_${loggerSerial}_pv_${i}_kWh_total`,
                    "unique_id": `deye_dummycloud_${loggerSerial}_pv_${i}_kWh_total`,
                    "enabled_by_default": i < 3,
                    "device": device
                }),
                {retain: true}
            );
        }


        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_grid_active_power_w/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/grid/active_power_w`,
                "name":"Grid Power (Active)",
                "unit_of_measurement": "W",
                "device_class": "power",
                "state_class": "measurement",
                "object_id": `deye_dummycloud_${loggerSerial}_grid_active_power_w`,
                "unique_id": `deye_dummycloud_${loggerSerial}_grid_active_power_w`,
                "expire_after": 360,
                "device": device
            }),
            {retain: true}
        );
        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_grid_kWh_today/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/grid/kWh_today`,
                "name":"Grid Energy Today",
                "unit_of_measurement": "kWh",
                "device_class": "energy",
                "state_class": "total_increasing",
                "object_id": `deye_dummycloud_${loggerSerial}_grid_energy_today`,
                "unique_id": `deye_dummycloud_${loggerSerial}_grid_energy_today`,
                "device": device
            }),
            {retain: true}
        );
        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_grid_kWh_total/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/grid/kWh_total`,
                "name":"Grid Energy Total",
                "unit_of_measurement": "kWh",
                "device_class": "energy",
                "state_class": "total_increasing",
                "object_id": `deye_dummycloud_${loggerSerial}_grid_energy_total`,
                "unique_id": `deye_dummycloud_${loggerSerial}_grid_energy_total`,
                "device": device
            }),
            {retain: true}
        );
        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_grid_v/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/grid/v`,
                "name":"Grid Voltage",
                "unit_of_measurement": "V",
                "device_class": "voltage",
                "state_class": "measurement",
                "object_id": `deye_dummycloud_${loggerSerial}_grid_v`,
                "unique_id": `deye_dummycloud_${loggerSerial}_grid_v`,
                "expire_after": 360,
                "device": device
            }),
            {retain: true}
        );
        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_grid_hz/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/grid/hz`,
                "name":"Grid Frequency",
                "unit_of_measurement": "Hz",
                "device_class": "frequency",
                "state_class": "measurement",
                "object_id": `deye_dummycloud_${loggerSerial}_grid_hz`,
                "unique_id": `deye_dummycloud_${loggerSerial}_grid_hz`,
                "expire_after": 360,
                "device": device
            }),
            {retain: true}
        );

        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_inverter_radiator_temperature/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/inverter/radiator_temperature`,
                "name":"Radiator Temperature",
                "unit_of_measurement": "°C",
                "device_class": "temperature",
                "state_class": "measurement",
                "object_id": `deye_dummycloud_${loggerSerial}_inverter_radiator_temperature`,
                "unique_id": `deye_dummycloud_${loggerSerial}_inverter_radiator_temperature`,
                "expire_after": 360,
                "device": device
            }),
            {retain: true}
        );

        this.client.publish(
            `homeassistant/sensor/deye_dummycloud_${loggerSerial}/${loggerSerial}_inverter_efficiency/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/inverter/efficiency`,
                "name":"Inverter Efficiency",
                "unit_of_measurement": "%",
                "entity_category": "diagnostic",
                "icon": "mdi:cog-transfer",
                "state_class": "measurement",
                "object_id": `deye_dummycloud_${loggerSerial}_inverter_efficiency`,
                "unique_id": `deye_dummycloud_${loggerSerial}_inverter_efficiency`,
                "expire_after": 360,
                "value_template": "{{ value_json }}",
                "device": device
            }),
            {retain: true}
        );

        this.autoconfTimestamps[loggerSerial] = Date.now();
    }
}

MqttClient.TOPIC_PREFIX = "deye-dummycloud";

module.exports = MqttClient;
