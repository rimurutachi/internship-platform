// Test Redis connection for Document Service
// Run with: node test-redis-connection.js

require('dotenv').config({ path: '.env.production' });
const Redis = require('ioredis');

console.log('🔵 Testing Redis Connection...\n');
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
    
    // Test SET
    console.log('\n📝 Testing SET...');
    await redis.set('test-doc-service', 'Hello from Document Service!', 'EX', 60);
    console.log('✅ SET successful (expires in 60 seconds)');
    
    // Test GET
    console.log('\n📝 Testing GET...');
    const value = await redis.get('test-doc-service');
    console.log('✅ GET value:', value);
    
    // Test DEL
    console.log('\n📝 Testing DEL...');
    await redis.del('test-doc-service');
    console.log('✅ DEL successful');
    
    // Test Pub/Sub (for collaboration)
    console.log('\n📝 Testing Pub/Sub (for document collaboration)...');
    const subscriber = redis.duplicate();
    
    await subscriber.subscribe('test-channel');
    console.log('✅ Subscribed to test-channel');
    
    subscriber.on('message', (channel, message) => {
      console.log(`✅ Received message on ${channel}:`, message);
      
      // Cleanup
      subscriber.unsubscribe('test-channel');
      subscriber.quit();
      redis.quit();
      
      console.log('\n✅ All Redis tests passed!');
      console.log('\n🎉 Redis is properly configured for Document Service!');
      process.exit(0);
    });
    
    await redis.publish('test-channel', 'Test message from Document Service');
    console.log('✅ Published test message');
    
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
