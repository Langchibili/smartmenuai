export default {
    routes: [
        {
            method: 'POST',
            path: '/custom-functions/createBusinessWithBranchAndTables',
            handler: 'business.createBusinessWithBranchAndTables',
        },
        {
            method: 'POST',
            path: '/custom-functions/getMyBusiness',
            handler: 'business.getMyBusiness',
        },
        {
            method: 'POST',
            path: '/custom-functions/updateOnboardingStep',
            handler: 'business.updateOnboardingStep',
        },
        {
            method: 'POST',
            path: '/custom-functions/updateBusinessLocation',
            handler: 'business.updateBusinessLocation',
        },
        {
            method: 'POST',
            path: '/custom-functions/getBusinessReports',
            handler: 'business.getBusinessReports',
        },
    ],
};
