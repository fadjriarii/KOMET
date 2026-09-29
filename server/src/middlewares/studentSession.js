const crypto = require('crypto');

const COOKIE_NAME = 'komet_student_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;

function getSecret() {
    // Session cookies and the sync API key are separate credentials. Reusing
    // the latter would allow a sync credential to access student-data routes.
    return process.env.SESSION_SECRET;
}

function sign(value) {
    return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSessionToken() {
    const payload = `${Date.now()}.${crypto.randomBytes(24).toString('base64url')}`;
    return `${payload}.${sign(payload)}`;
}

function isValidSessionToken(token) {
    if (!token || !getSecret()) return false;
    const parts = token.split('.');
    if (parts.length !== 3 || Date.now() - Number(parts[0]) > MAX_AGE_SECONDS * 1000) return false;
    const expected = sign(`${parts[0]}.${parts[1]}`);
    const actualBuffer = Buffer.from(parts[2]);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseCookies(header = '') {
    return Object.fromEntries(
        header.split(';').map(item => {
            const [name, ...rest] = item.trim().split('=');
            return [name, rest.join('=')];
        })
    );
}

function issueStudentSession(req, res) {
    if (!getSecret()) {
        return res.status(500).json({ success: false, message: 'Student session is not configured.' });
    }
    const token = createSessionToken();
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/api/students; Max-Age=${MAX_AGE_SECONDS}${secure}`);
    return res.status(204).send();
}

function studentSessionAuth(req, res, next) {
    if (isValidSessionToken(parseCookies(req.headers.cookie || '')[COOKIE_NAME])) return next();
    return res.status(401).json({ success: false, message: 'Student session is required.' });
}

module.exports = { issueStudentSession, studentSessionAuth, parseCookies };
