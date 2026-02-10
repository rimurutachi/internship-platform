// Test Redis connection for Backend Service
// Run with: node test-redis-connection.js

require('dotenv').config({ path: '.env.production' });
const Redis = require('ioredis');

console.log('🔵 Testing Redis Connection for Backend...\n');
console.log('Redis URL:', process.env.REDIS_URL?.replace(/:[^:]*@/, ':****@')); // Hide password

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    console.log(`🔄 Retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
  connectTimeout: 10000,
  enableReadyCheck: true,
  enableOfflineQueue: true,
});

redis.on('connect', () => {
  console.log('✅ Redis connected!');
});

redis.on('ready', async () => {
  console.log('✅ Redis ready!\n');
  
  try {
    // Test PING
    console.log('📝 Testing PING...');
    const pong = await redis.ping();
    console.log('✅ PING response:', pong);
    
    // Test SET (session simulation)
    console.log('\n📝 Testing SET (session cache)...');
    await redis.set('session:test-user-123', JSON.stringify({
      userId: '123',
      email: 'test@cvsu.edu.ph',
      role: 'student',
      loginTime: new Date().toISOString()
    }), 'EX', 3600); // 1 hour expiry
    console.log('✅ SET session successful (expires in 1 hour)');
    
    // Test GET
    console.log('\n📝 Testing GET (retrieve session)...');
    const session = await redis.get('session:test-user-123');
    console.log('✅ GET session:', JSON.parse(session));
    
    // Test rate limiting simulation
    console.log('\n📝 Testing INCR (rate limiting)...');
    const key = 'rate-limit:192.168.1.1';
    await redis.incr(key);
    await redis.expire(key, 60); // 1 minute window
    const count = await redis.get(key);
    console.log('✅ Rate limit counter:', count);
    
    // Cleanup
    await redis.del('session:test-user-123');
    await redis.del(key);
    console.log('\n✅ Cleanup successful');
    
    await redis.quit();
    console.log('\n✅ All Redis tests passed!');
    console.log('\n🎉 Redis is properly configured for Backend Service!');
    console.log('\n💡 Note: Backend currently doesn\'t use Redis in code,');
    console.log('   but it\'s configured and ready for future features like:');
    console.log('   - Session caching');
    console.log('   - Rate limiting');
    console.log('   - Job queues (Bull)');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    redis.quit();
    process.exit(1);
  }
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Connection timeout after 30 seconds');
  redis.quit();
  process.exit(1);
}, 30000);
