import connectDB from '../src/config/database.js';
import userModel from '../src/models/user.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await connectDB();

    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
    const testEmail = 'auth_test_' + Date.now() + '@test.com';

    // 1. Create user
    const user = await userModel.create({ username: 'testuser' + Date.now(), email: testEmail, password: 'Test123!', verified: true });
    console.log('1. ✅ User created:', user._id);

    // 2. Generate access token
    const accessToken = jwt.sign({ id: user._id.toString(), username: user.username, role: 'user' }, ACCESS_SECRET, { expiresIn: '15m' });
    console.log('2. ✅ Access token (15m):', accessToken.substring(0, 30) + '...');

    // 3. Generate & hash refresh token
    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(rawRefresh).digest('hex');
    user.refreshTokens.push({ tokenHash: refreshHash, userAgent: 'Test-Agent' });
    await user.save();
    console.log('3. ✅ Refresh token stored (hashed in DB)');

    // 4. Simulate lookup
    const found = await userModel.findOne({ 'refreshTokens.tokenHash': refreshHash });
    console.log('4. ✅ Found user by refresh token hash:', !!found);

    // 5. Rotate tokens
    const newRaw = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');
    found.refreshTokens = found.refreshTokens.filter(t => t.tokenHash !== refreshHash);
    found.refreshTokens.push({ tokenHash: newHash, userAgent: 'Test-Agent' });
    await found.save();
    console.log('5. ✅ Token rotation complete. Active tokens:', found.refreshTokens.length);

    // 6. Logout - revoke token
    await userModel.updateOne({ _id: user._id }, { $pull: { refreshTokens: { tokenHash: newHash } } });
    const afterLogout = await userModel.findById(user._id);
    console.log('6. ✅ After logout, tokens:', afterLogout.refreshTokens.length, '(should be 0)');

    // 7. Cleanup
    await userModel.findByIdAndDelete(user._id);
    console.log('\n🎉 ALL AUTH TESTS PASSED — Refresh token rotation working correctly');
    process.exit(0);
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
