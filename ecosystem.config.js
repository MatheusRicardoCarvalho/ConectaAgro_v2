module.exports = {
    apps : [{
      name: "gpzap",
      script: "./build/index.js",
      watch: true,
      ignore_watch: ["node_modules", "build"],
      env: {
        NODE_ENV: "production"
      }
    }]
  };
  