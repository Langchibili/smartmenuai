export default {
    routes: [
        {
            method: 'POST',
            path: '/custom-functions/createBusinessWithBranchAndTables',
            handler: 'business.createBusinessWithBranchAndTables',
            config: { auth: { enabled: true } },
        },
        {
            method: 'POST',
            path: '/custom-functions/getMyBusiness',
            handler: 'business.getMyBusiness',
            config: { auth: { enabled: true } },
        },
        {
            method: 'POST',
            path: '/custom-functions/updateOnboardingStep',
            handler: 'business.updateOnboardingStep',
            config: { auth: { enabled: true } },
        },
        {
            method: 'POST',
            path: '/custom-functions/getBusinessReports',
            handler: 'business.getBusinessReports',
            config: { auth: { enabled: false } },
        },
    ],
};
