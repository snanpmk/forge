const cron = require('node-cron');
const logger = require('./utils/logger'); // Import logger

// Parse the URL to handle both HTTP and HTTPS automatically via node's native fetch (Node 18+)
const URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';

const job = cron.schedule('*/14 * * * *', async () => {
  logger.info('🔄 Cron Job: Sending Keep-Alive Ping...');

  try {
    const response = await fetch(`${URL}/health`);
    if (response.ok) {
      logger.info(`✅ Keep-Alive Ping Successful: ${response.status}`);
    } else {
      logger.error(
        `❌ Keep-Alive Ping Failed with status code: ${response.status}`
      );
    }
  } catch (error) {
    logger.error(`❌ Keep-Alive Ping Error: ${error.message}`);
  }
});

module.exports = job;
