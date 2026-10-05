/**
 * @komet/shared - Main entry point (CJS).
 */
const constants = require('./constants.cjs');
const formatters = require('./formatters.cjs');

module.exports = { ...constants, ...formatters };
