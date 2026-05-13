const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
module.exports = storage;
