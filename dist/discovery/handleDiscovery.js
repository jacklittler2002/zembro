"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDiscovery = handleDiscovery;
const logger_1 = require("../logger");
const discoveryService_1 = require("./discoveryService");
async function handleDiscovery(job) {
    if (!job.leadSearchId) {
        logger_1.logger.warn("DISCOVERY job without leadSearchId", job.id);
        return;
    }
    await (0, discoveryService_1.runDiscoveryForLeadSearch)(job.leadSearchId);
}
//# sourceMappingURL=handleDiscovery.js.map