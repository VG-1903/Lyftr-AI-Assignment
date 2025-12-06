const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
  try {
    // MongoDB Atlas connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      retryWrites: true,
      w: 'majority'
    };

    console.log("🔗 Connecting to MongoDB Atlas...");
    
    await mongoose.connect(MONGO_URI, options);
    
    console.log("✅ MongoDB Atlas connected successfully");
    
    // Event listeners
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB connection established');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('♻️ MongoDB reconnected');
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Closing MongoDB connection...`);
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed gracefully');
      process.exit(0);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
  } catch (err) {
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("  Error:", err.message);
    console.error("\n📋 Troubleshooting tips:");
    console.error("  1. Check your MongoDB Atlas connection string");
    console.error("  2. Verify your username and password");
    console.error("  3. Ensure your IP is whitelisted in Atlas");
    console.error("  4. Check your network connection");
    
    // In development, you might want to continue without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn("⚠️ Running without database connection (development mode)");
    }
  }
}

// Helper function to check connection status
function getConnectionStatus() {
  return {
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models)
  };
}

module.exports = { connectDB, getConnectionStatus };