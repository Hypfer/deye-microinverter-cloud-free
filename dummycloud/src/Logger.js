const util = require("util");

class Logger {
    constructor() {
        this.logLevel = Logger.LogLevels["info"];
    }

    /**
     * @public
     * @return {string}
     */
    getLogLevel() {
        return Object.keys(Logger.LogLevels).find(key => {
            return Logger.LogLevels[key] === this.logLevel;
        });
    }

    /**
     * @public
     * @param {string} value
     */
    setLogLevel(value) {
        if (Logger.LogLevels[value] === undefined) {
            throw new Error(`Invalid log level '${value}', valid are '${Object.keys(Logger.LogLevels).join("','")}'`);
        } else {
            this.logLevel = Logger.LogLevels[value];
        }
    }


    /**
     * @private
     * @param {string} logLevel
     * @return {string}
     */
    buildLogLinePrefix(logLevel) {
        return `[${new Date().toISOString()}] [${logLevel}]`;
    }

    /**
     * @param {string} level
     * @param {...any} args
     * @private
     */
    log(level, ...args) {
        if (this.logLevel["level"] <= Logger.LogLevels[level]["level"]) {
            const logLinePrefix = this.buildLogLinePrefix(level.toUpperCase());
            const logLine = [logLinePrefix, ...args].map(arg => {
                if (typeof arg === "string") {
                    return arg;
                }

                return util.inspect(
                    arg,
                    {
                        depth: Infinity
                    }
                );
            }).join(" ");

            Logger.LogLevels[level]["callback"](logLine);
        }
    }

    /**
     * @public
     * @see console.trace
     * @param  {...any} args
     */
    trace(...args) {
        this.log("trace", ...args);
    }

    /**
     * @public
     * @see console.debug
     * @param  {...any} args
     */
    debug(...args) {
        this.log("debug", ...args);
    }

    /**
     * @public
     * @see console.info
     * @param  {...any} args
     */
    info(...args) {
        this.log("info", ...args);
    }

    /**
     * @public
     * @see console.warn
     * @param  {...any} args
     */
    warn(...args) {
        this.log("warn", ...args);
    }

    /**
     * @public
     * @see console.error
     * @param  {...any} args
     */
    error( ...args) {
        this.log("error", ...args);
    }
}

Logger.LogLevels = Object.freeze({
    // eslint-disable-next-line no-console
    "trace": {"level": -2, "callback": console.debug},
    // eslint-disable-next-line no-console
    "debug": {"level": -1, "callback": console.debug},
    // eslint-disable-next-line no-console
    "info": {"level": 0, "callback": console.info},
    // eslint-disable-next-line no-console
    "warn": {"level": 1, "callback": console.warn},
    // eslint-disable-next-line no-console
    "error": {"level": 2, "callback": console.error},
});

module.exports = new Logger();
