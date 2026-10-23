// Cached MongoDB connection. On Vercel every function call may start in a warm
// instance that already has a connection, so we keep the connection (and the
// pending promise) on `global` and reuse it instead of connecting on every request.
const mongoose = require('mongoose');

const cache = global.__mongooseCache || (global.__mongooseCache = { conn: null, promise: null });

async function connectDb() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to your .env file (or the Vercel project settings).');

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,          // fail fast instead of queueing queries while disconnected
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5                  // many function instances share one Atlas cluster, keep pools small
      })
      .catch((err) => { cache.promise = null; throw err; }); // allow a retry on the next request
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

module.exports = { connectDb };
