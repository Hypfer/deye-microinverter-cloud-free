const EventEmitter = require("events").EventEmitter;
const Logger = require("./Logger");
const net = require("net");
const Protocol = require("./Protocol");

class DummyCloud {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.server = new net.Server();
    }

    initialize() {
        this.server.listen(
            {
                port: DummyCloud.PORT,
                host: "0.0.0.0"
            }, 
            function() {
                Logger.info(`Starting deye-dummycloud on port ${DummyCloud.PORT}`);
        });

        this.server.on("connection", (socket) => {
            this.handleConnection(socket);
        });
    }

    /**
     * @private
     * @param {net.Socket} socket
     */
    handleConnection(socket) {
        const remoteAddress = socket.remoteAddress; // As this is a getter, it may become unavailable
        Logger.info(`New connection from ${remoteAddress}`);

        socket.on("data", (data) => {
            Logger.trace(new Date().toISOString(), `Data received from client ${remoteAddress}: ${data.toString()}`);
            Logger.trace(new Date().toISOString(), `Data ${remoteAddress}:`, data.toString("hex"));

            try {
                const packet = Protocol.parsePacket(data);
                let response;

                switch (packet.header.type) {
                    case Protocol.MESSAGE_REQUEST_TYPES.HEARTBEAT: {
                        response = Protocol.buildTimeResponse(packet);
                        break;
                    }
                    case Protocol.MESSAGE_REQUEST_TYPES.WIFI: {
                        /*
                            There isn't much of interest in this packet
                            It can contain the SSID or the Logger SN
                            + Some counters increasing every second
                            
                            On connect, it also can contain the signal strength
                            But that's about it
                            
                            The signal strength over time would've been interesting, but it only gets sent on connect
                            With that, it's close to useless
                         */
                        response = Protocol.buildTimeResponse(packet);
                        break;
                    }
                    case Protocol.MESSAGE_REQUEST_TYPES.HANDSHAKE: {
                        const data = Protocol.parseLoggerPacketPayload(packet);

                        Logger.debug(`Handshake packet data from ${remoteAddress}`, data);
                        this.emitHandshake({
                            header: packet.header,
                            payload: data
                        });

                        response = Protocol.buildTimeResponse(packet);
                        break;
                    }
                    case Protocol.MESSAGE_REQUEST_TYPES.DATA: {
                        const data = Protocol.parseDataPacketPayload(packet);

                        if (data) {
                            Logger.debug(`DATA packet data from ${remoteAddress}`, data);
                            this.emitData({
                                header: packet.header,
                                payload: data,
                                meta: {
                                    remoteAddress: remoteAddress
                                }
                            });
                        } else {
                            Logger.debug("Discarded data packet");
                        }

                        response = Protocol.buildTimeResponse(packet);
                        break;
                    }

                    default: {
                        response = Protocol.buildTimeResponse(packet);
                    }
                }

                if (response) {
                    Logger.trace("Response", response.toString("hex"));

                    socket.write(response);
                }
            } catch (e) {
                Logger.error(`Error while parsing packet from ${remoteAddress}`, e);
            }
        });

        socket.on("end", function() {
            Logger.info(`Ending connection with ${remoteAddress}`);
        });

        socket.on("close", function() {
            Logger.info(`Closing connection with ${remoteAddress}`);
        });

        socket.on("error", function(err) {
            Logger.error(`Error on dummycloud socket for ${remoteAddress}`, err);
        });
    }

    emitData(data) {
        this.eventEmitter.emit(DummyCloud.PACKET_EVENTS.Data, data);
    }

    onData(listener) {
        this.eventEmitter.on(DummyCloud.PACKET_EVENTS.Data, listener);
    }

    emitHandshake(data) {
        this.eventEmitter.emit(DummyCloud.PACKET_EVENTS.Handshake, data);
    }

    onHandshake(listener) {
        this.eventEmitter.on(DummyCloud.PACKET_EVENTS.Handshake, listener);
    }
}

DummyCloud.PACKET_EVENTS = {
    Data: "Data",
    Handshake: "Handshake"
};


DummyCloud.PORT = 10000;

module.exports = DummyCloud;
