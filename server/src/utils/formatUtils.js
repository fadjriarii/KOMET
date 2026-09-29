/** Format a numeric value for presentation in Indonesian locale. */
function formatNumber(value) {
    return value === null || value === undefined
        ? '-'
        : new Intl.NumberFormat('id-ID').format(value);
}

module.exports = { formatNumber };
