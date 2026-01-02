/** next.config.js */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Ensure Turbopack uses the project folder as root to resolve path aliases
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
