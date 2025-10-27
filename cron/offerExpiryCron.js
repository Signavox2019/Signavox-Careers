const cron = require('node-cron');
const Application = require('../models/Application');

const expireOldOffers = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const expiredOffers = await Application.updateMany(
      {
        offerStatus: 'pending',
        offerGeneratedAt: { $lte: sevenDaysAgo },
      },
      { $set: { offerStatus: 'expired' } }
    );

    if (expiredOffers.modifiedCount > 0) {
      console.log(`🕒 ${expiredOffers.modifiedCount} offers expired automatically.`);
    }
  } catch (err) {
    console.error('❌ Error expiring offers:', err.message);
  }
};

// Run every day at midnight
cron.schedule('0 0 * * *', expireOldOffers);
console.log('✅ Offer expiry cron job scheduled (runs daily at midnight).');

module.exports = expireOldOffers;
