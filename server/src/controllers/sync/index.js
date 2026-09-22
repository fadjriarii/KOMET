const syncStudents = require('./syncStudents');
const syncGraduates = require('./syncGraduates');
const syncMbkm = require('./syncMbkm');
const syncAll = require('./syncAll');
const getSyncStatus = require('./syncStatus');

module.exports = {
    syncStudents,
    syncGraduates,
    syncMbkm,
    syncAll,
    getSyncStatus
};
