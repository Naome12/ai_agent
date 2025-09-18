require('dotenv').config(); // Load .env first

module.exports = {
  apps: [
    {
      name: "backend",
      script: "src/server.ts",
      interpreter: "tsx",   // or "ts-node"
      watch: false,
          env: process.env,
         output: "./logs/backend-out.log",
      error: "./logs/backend-error.log",
      autorestart: true    // Use all env vars from .env
    }
  ]
};
