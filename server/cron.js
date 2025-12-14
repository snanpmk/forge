const cron = require('node-cron');

// Parse the URL to handle both HTTP and HTTPS automatically via node's native fetch (Node 18+)
const URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';

const job = cron.schedule('*/14 * * * *', async () => {
  console.log('🔄 Cron Job: Sending Keep-Alive Ping...');

  try {
    const response = await fetch(`${URL}/health`);
    if (response.ok) {
      console.log(`✅ Keep-Alive Ping Successful: ${response.status}`);
    } else {
      console.error(
        `❌ Keep-Alive Ping Failed with status code: ${response.status}`
      );
    }
  } catch (error) {
    console.error('❌ Keep-Alive Ping Error:', error.message);
  }
});

module.exports = job;
