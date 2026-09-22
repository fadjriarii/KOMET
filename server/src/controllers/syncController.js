const syncStudents = require('./sync/syncStudents');
const syncGraduates = require('./sync/syncGraduates');
const syncMbkm = require('./sync/syncMbkm');
const syncAll = require('./sync/syncAll');
const getSyncStatus = require('./sync/syncStatus');

module.exports = {
    syncStudents,
    syncGraduates,
    syncMbkm,
    syncAll,
    getSyncStatus
};