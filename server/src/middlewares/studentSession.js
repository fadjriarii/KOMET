const crypto = require('crypto');
const { authenticateApiKey } = require('./auth');
const { createSession, hasSession, revokeSession } = require('../services/sessionStore');

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

function hasValidSignature(token) {
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

function setSessionCookie(res, token, maxAge = MAX_AGE_SECONDS) {
    const sameSiteMode = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
    const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; SameSite=${sameSiteMode}; Path=/api; Max-Age=${maxAge}${secureFlag}`);
}

async function issueStudentSession(req, res, next) {
    if (!getSecret()) {
        return res.status(500).json({ success: false, message: 'Student session is not configured.' });
    }
    try {
        const token = createSessionToken();
        await createSession(token, MAX_AGE_SECONDS);
        setSessionCookie(res, token);
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
}

async function revokeStudentSession(req, res, next) {
    try {
        const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
        if (token) await revokeSession(token);
        setSessionCookie(res, '', 0);
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
}

async function studentSessionAuth(req, res, next) {
    const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME];
    if (hasValidSignature(token) && await hasSession(token)) return next();
    if (authenticateApiKey(req)) return next();
    return res.status(401).json({ success: false, message: 'Student session is required.' });
}

module.exports = { issueStudentSession, revokeStudentSession, studentSessionAuth, parseCookies, hasValidSignature };
