const redis = require('redis');

let client = null;

async function connectRedis() {
  if (process.env.REDIS_DISABLED === 'true') {
    console.log('Redis disabled via REDIS_DISABLED=true');
    return null;
  }

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || undefined;

  const url = password
    ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
    : `redis://${host}:${port}`;

  try {
    client = redis.createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis: max reconnection attempts reached. Running without Redis.');
            return false;
          }
          return Math.min(retries * 1000, 3000);
        }
      }
    });

    client.on('error', (err) => {
      console.warn('Redis error (running without cache):', err.message);
    });

    await client.connect();
    console.log('Redis connected');
    return client;
  } catch (err) {
    console.warn('Redis not available. Running without cache:', err.message);
    client = null;
    return null;
  }
}

function getRedis() {
  return client;
}

module.exports = { connectRedis, getRedis };
