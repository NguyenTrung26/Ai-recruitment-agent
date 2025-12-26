// Minimal legacy JWT generator for Supabase (HS256)
// Usage:
//   node backend/scripts/generate-legacy-jwts.js <legacy_jwt_secret>
// Or set env SUPABASE_LEGACY_JWT_SECRET and run without args.

const crypto = require('crypto');

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function signHS256(secret, content) {
    return crypto.createHmac('sha256', secret).update(content).digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function makeJwt(secret, role, years = 10) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + years * 365 * 24 * 60 * 60; // ~years
    const payload = { iss: 'supabase', role, iat: now, exp };
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const toSign = `${encodedHeader}.${encodedPayload}`;
    const signature = signHS256(secret, toSign);
    return `${toSign}.${signature}`;
}

function main() {
    const secret = process.argv[2] || process.env.SUPABASE_LEGACY_JWT_SECRET;
    if (!secret) {
        console.error('Provide legacy JWT secret: arg or SUPABASE_LEGACY_JWT_SECRET');
        process.exit(1);
    }
    const anon = makeJwt(secret, 'anon');
    const serviceRole = makeJwt(secret, 'service_role');
    console.log('\nLegacy anon (JWT):\n', anon);
    console.log('\nLegacy service_role (JWT):\n', serviceRole);
}

main();
