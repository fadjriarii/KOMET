const syncJobTracker = require('../../utils/syncJobTracker');

const getSyncStatus = (req, res) => {
    const state = syncJobTracker.getState();
    return res.status(200).json({
        success: true,
        data: state
    });
};

module.exports = getSyncStatus;
