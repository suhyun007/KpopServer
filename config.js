require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration (for future use)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'K-popcall',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || ''
  },
  
  // JWT configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // API configuration
  api: {
    key: process.env.API_KEY || '',
    version: '1.0.0'
  }
};

module.exports = config;
