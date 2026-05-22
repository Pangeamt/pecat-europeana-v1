/** @type {import("pm2").StartOptions[]} */
module.exports = {
  apps: [
    {
      name: "pecat-e",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
