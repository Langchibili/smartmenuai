export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getAdCampaigns',
      handler: 'ad-campaign.getAdCampaigns',
      config: { auth: { enabled: false } }
    },
  ],
};

