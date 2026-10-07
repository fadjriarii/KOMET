const syncStudents = require('./sync/syncStudents');
const syncGraduates = require('./sync/syncGraduates');
const syncMbkm = require('./sync/syncMbkm');
const syncAll = require('./sync/syncAll');
const getSyncStatus = require('./sync/syncStatus');
const { getSyncHistory, deleteSyncRun } = require('./sync/syncHistory');

module.exports = {
  syncStudents,
  syncGraduates,
  syncMbkm,
  syncAll,
  getSyncStatus,
  getSyncHistory,
  deleteSyncRun,
};
