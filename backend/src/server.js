const config = require('./config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`Resort API running on port ${config.port} (${config.env}, ${config.timezone})`);
});