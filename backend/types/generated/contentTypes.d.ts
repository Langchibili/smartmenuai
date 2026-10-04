import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiActivityLogActivityLog extends Struct.CollectionTypeSchema {
  collectionName: 'activity_logs';
  info: {
    displayName: 'ActivityLog';
    pluralName: 'activity-logs';
    singularName: 'activity-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    actor_user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity-log.activity-log'
    > &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    target_id: Schema.Attribute.String;
    target_type: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAdCampaignAdCampaign extends Struct.CollectionTypeSchema {
  collectionName: 'ad_campaigns';
  info: {
    displayName: 'Ad Campaign';
    pluralName: 'ad-campaigns';
    singularName: 'ad-campaign';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    advertiser: Schema.Attribute.Relation<
      'manyToOne',
      'api::advertiser.advertiser'
    >;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    campaign_name: Schema.Attribute.String & Schema.Attribute.Required;
    campaign_type: Schema.Attribute.Enumeration<
      ['platform_direct', 'business_own', 'google_adsense']
    > &
      Schema.Attribute.Required;
    clicks: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta_link: Schema.Attribute.String;
    cta_text: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    desktop_image_url: Schema.Attribute.Media;
    desktop_video_url: Schema.Attribute.Media;
    end_date: Schema.Attribute.Date;
    image_url: Schema.Attribute.Media;
    impressions: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ad-campaign.ad-campaign'
    > &
      Schema.Attribute.Private;
    mobile_image_url: Schema.Attribute.Media;
    mobile_video_url: Schema.Attribute.Media;
    placement: Schema.Attribute.String & Schema.Attribute.Required;
    priority: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    publishedAt: Schema.Attribute.DateTime;
    schedule_days: Schema.Attribute.JSON;
    schedule_end_time: Schema.Attribute.Time;
    schedule_start_time: Schema.Attribute.Time;
    start_date: Schema.Attribute.Date;
    status: Schema.Attribute.Enumeration<
      ['draft', 'active', 'paused', 'ended']
    > &
      Schema.Attribute.DefaultTo<'draft'>;
    tablet_image_url: Schema.Attribute.Media;
    tablet_video_url: Schema.Attribute.Media;
    target_business_types: Schema.Attribute.JSON;
    target_cities: Schema.Attribute.JSON;
    target_countries: Schema.Attribute.JSON;
    target_plan_types: Schema.Attribute.JSON;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    video_url: Schema.Attribute.Media;
  };
}

export interface ApiAdEventAdEvent extends Struct.CollectionTypeSchema {
  collectionName: 'ad_events';
  info: {
    displayName: 'Ad Event';
    pluralName: 'ad-events';
    singularName: 'ad-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ad_campaign: Schema.Attribute.Relation<
      'manyToOne',
      'api::ad-campaign.ad-campaign'
    >;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    event_type: Schema.Attribute.Enumeration<['impression', 'click']> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ad-event.ad-event'
    > &
      Schema.Attribute.Private;
    placement_key: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_session_id: Schema.Attribute.String;
  };
}

export interface ApiAdmnSettingAdmnSetting extends Struct.SingleTypeSchema {
  collectionName: 'admn_settings';
  info: {
    displayName: 'Admin Settings';
    name: 'admn-setting';
    pluralName: 'admn-settings';
    singularName: 'admn-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adminSupportEmails: Schema.Attribute.JSON;
    adminSupportNumbers: Schema.Attribute.JSON;
    affiliateSystemEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    allowFloatTopUpWithOkraPay: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    allowManualCompletion: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    allowMultipleTrials: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    allowNegativeFloat: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    allowRidePaymentWithOkraPay: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    appsServerPollingIntervalInSeconds: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<20>;
    autoApproveDeliverers: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    autoApproveDrivers: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    autoRenewByDefault: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    blockCashRidesOnInsufficientFloat: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    cashEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    commissionTiers: Schema.Attribute.JSON;
    commissionType: Schema.Attribute.Enumeration<
      ['percentage', 'flat_rate', 'tiered']
    > &
      Schema.Attribute.DefaultTo<'percentage'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    defaultCommissionPercentage: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<15>;
    defaultCurrency: Schema.Attribute.Relation<
      'oneToOne',
      'api::currency.currency'
    >;
    defaultFlatCommission: Schema.Attribute.Decimal;
    defaultFreeTrialDays: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<7>;
    deliveryRequestTimeoutSeconds: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<60>;
    driverCancellationCooldownMinutes: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<15>;
    driverOrderRequestRingtone: Schema.Attribute.Media<'audios'>;
    driverOrderRequestVibration: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    emailEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    externalPaymentGateway: Schema.Attribute.Enumeration<['lencopay']> &
      Schema.Attribute.DefaultTo<'lencopay'>;
    freeTrialEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    getOnlineDriverCurrentLocationCronIntervalInSecs: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<30>;
    initialDelivererFloat: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    initialDriverFloat: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::admn-setting.admn-setting'
    > &
      Schema.Attribute.Private;
    maximumCommission: Schema.Attribute.Decimal;
    maximumFloatTopup: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<1000>;
    maxSimultaneousDriverRequests: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1>;
    minimumCommission: Schema.Attribute.Decimal;
    minimumFloatTopup: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<10>;
    minimumPointsForRedemption: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<100>;
    minimumWithdrawAmount: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<10>;
    moneyPerPoint: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.1>;
    negativeFloatLimit: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    okrapayEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    overideOtpCode: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'121212'>;
    paymentSystemType: Schema.Attribute.Enumeration<
      ['float_based', 'subscription_based', 'hybrid']
    > &
      Schema.Attribute.DefaultTo<'float_based'>;
    platformName: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Okra Rides'>;
    pointsPerDriverReferral: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<50>;
    pointsPerRiderFirstRide: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<20>;
    pointsPerRiderReferral: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<10>;
    publishedAt: Schema.Attribute.DateTime;
    pushNotificationsEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    referralBonusEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireArrivalConfirmation: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireDriverLicense: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireFitnessDocument: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireInsurance: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireNationalId: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireProofOfAddress: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    requireRoadTax: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    requireVehicleRegistration: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    rideBookingRadius: Schema.Attribute.Integer;
    rideCompletionProximity: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<100>;
    rideRequestTimeoutSeconds: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<30>;
    smsEnabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    subscriptionGracePeriodDays: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<3>;
    supportEmail: Schema.Attribute.Email;
    supportPhone: Schema.Attribute.String;
    targetRidesForUnlock: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<1000>;
    tieredCommissionEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    whatsappEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    withdrawableBalance: Schema.Attribute.Enumeration<['float', 'earnings']> &
      Schema.Attribute.DefaultTo<'float'>;
  };
}

export interface ApiAdvertiserAdvertiser extends Struct.CollectionTypeSchema {
  collectionName: 'advertisers';
  info: {
    displayName: 'Advertiser';
    pluralName: 'advertisers';
    singularName: 'advertiser';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    advertiser_name: Schema.Attribute.String & Schema.Attribute.Required;
    contact_person: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    industry: Schema.Attribute.String;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::advertiser.advertiser'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media;
    notes: Schema.Attribute.Text;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBranchBranch extends Struct.CollectionTypeSchema {
  collectionName: 'branches';
  info: {
    displayName: 'Branch';
    pluralName: 'branches';
    singularName: 'branch';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.String;
    branch_name: Schema.Attribute.String & Schema.Attribute.Required;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    city: Schema.Attribute.String;
    city_record: Schema.Attribute.Relation<'manyToOne', 'api::city.city'>;
    country_record: Schema.Attribute.Relation<
      'manyToOne',
      'api::country.country'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::branch.branch'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    manager: Schema.Attribute.Relation<'manyToOne', 'api::employee.employee'>;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    tables: Schema.Attribute.Relation<'oneToMany', 'api::table.table'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBusinessAdSettingBusinessAdSetting
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_ad_settings';
  info: {
    displayName: 'Business Ad Setting';
    pluralName: 'business-ad-settings';
    singularName: 'business-ad-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    ad_mode: Schema.Attribute.Enumeration<
      [
        'platform_ads',
        'business_ads_only',
        'mixed_ads',
        'google_adsense',
        'no_ads',
      ]
    > &
      Schema.Attribute.DefaultTo<'platform_ads'>;
    allow_google_adsense: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    business: Schema.Attribute.Relation<'oneToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    force_platform_ads: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-ad-setting.business-ad-setting'
    > &
      Schema.Attribute.Private;
    platform_admin_override: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBusinessMenuSettingBusinessMenuSetting
  extends Struct.CollectionTypeSchema {
  collectionName: 'business_menu_settings';
  info: {
    displayName: 'Business Menu Setting';
    pluralName: 'business-menu-settings';
    singularName: 'business-menu-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accent_color: Schema.Attribute.String;
    background_color: Schema.Attribute.String;
    business: Schema.Attribute.Relation<'oneToOne', 'api::business.business'>;
    button_color: Schema.Attribute.String;
    card_color: Schema.Attribute.String;
    category_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'rounded_pills'>;
    cover_image_url: Schema.Attribute.Media;
    cover_video_url: Schema.Attribute.Media;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    display_name: Schema.Attribute.String;
    header_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'floating_glass'>;
    hero_text: Schema.Attribute.String;
    layout_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'classic_list'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business-menu-setting.business-menu-setting'
    > &
      Schema.Attribute.Private;
    location_text: Schema.Attribute.String;
    opening_hours: Schema.Attribute.String;
    primary_color: Schema.Attribute.String;
    product_card_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'large_image'>;
    promo_text: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    show_ai_recommendations: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    show_hero: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    status: Schema.Attribute.Enumeration<['draft', 'published']> &
      Schema.Attribute.DefaultTo<'draft'>;
    tagline: Schema.Attribute.String;
    text_color: Schema.Attribute.String;
    theme_style: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'modern_dark'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    welcome_message: Schema.Attribute.Text;
  };
}

export interface ApiBusinessBusiness extends Struct.CollectionTypeSchema {
  collectionName: 'businesses';
  info: {
    displayName: 'Business';
    pluralName: 'businesses';
    singularName: 'business';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    address: Schema.Attribute.String;
    branches: Schema.Attribute.Relation<'oneToMany', 'api::branch.branch'>;
    business_name: Schema.Attribute.String & Schema.Attribute.Required;
    business_type: Schema.Attribute.Enumeration<
      ['restaurant', 'bar', 'lounge', 'cafe', 'club']
    > &
      Schema.Attribute.DefaultTo<'restaurant'>;
    city: Schema.Attribute.String;
    city_record: Schema.Attribute.Relation<'manyToOne', 'api::city.city'>;
    country: Schema.Attribute.String;
    country_record: Schema.Attribute.Relation<
      'manyToOne',
      'api::country.country'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'USD'>;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_published: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::business.business'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    owner: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    phone: Schema.Attribute.String;
    plan_type: Schema.Attribute.Enumeration<['basic', 'premium']> &
      Schema.Attribute.DefaultTo<'basic'>;
    publishedAt: Schema.Attribute.DateTime;
    service_charge_percent: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCityCity extends Struct.CollectionTypeSchema {
  collectionName: 'cities';
  info: {
    displayName: 'City';
    pluralName: 'cities';
    singularName: 'city';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    branches: Schema.Attribute.Relation<'oneToMany', 'api::branch.branch'>;
    businesses: Schema.Attribute.Relation<
      'oneToMany',
      'api::business.business'
    >;
    country: Schema.Attribute.Relation<'manyToOne', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    latitude: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::city.city'> &
      Schema.Attribute.Private;
    longitude: Schema.Attribute.Decimal;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    population: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCountryCountry extends Struct.CollectionTypeSchema {
  collectionName: 'countries';
  info: {
    displayName: 'Country';
    name: 'country';
    pluralName: 'countries';
    singularName: 'country';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    acceptedMobileMoneyPayments: Schema.Attribute.JSON;
    branches: Schema.Attribute.Relation<'oneToMany', 'api::branch.branch'>;
    businesses: Schema.Attribute.Relation<
      'oneToMany',
      'api::business.business'
    >;
    cities: Schema.Attribute.Relation<'oneToMany', 'api::city.city'>;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Relation<'manyToOne', 'api::currency.currency'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::country.country'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    phoneCode: Schema.Attribute.String & Schema.Attribute.Required;
    phoneNumberDigitLenth: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<9>;
    phoneNumberRegex: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCurrencyCurrency extends Struct.CollectionTypeSchema {
  collectionName: 'currencies';
  info: {
    displayName: 'Currency';
    name: 'currency';
    pluralName: 'currencies';
    singularName: 'currency';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    'content-type-builder': {
      visible: true;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 3;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    exchangeRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::currency.currency'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    symbol: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCustomControllerCustomController
  extends Struct.CollectionTypeSchema {
  collectionName: 'custom_controllers';
  info: {
    displayName: 'customControllers';
    pluralName: 'custom-controllers';
    singularName: 'custom-controller';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::custom-controller.custom-controller'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCustomerCustomer extends Struct.CollectionTypeSchema {
  collectionName: 'customer_analytics';
  info: {
    displayName: 'Customer analytics query';
    pluralName: 'customers';
    singularName: 'customer';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::customer.customer'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDeviceDevice extends Struct.CollectionTypeSchema {
  collectionName: 'devices';
  info: {
    displayName: 'device';
    pluralName: 'devices';
    singularName: 'device';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String;
    deviceInfo: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::device.device'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiEmployeeInvitationEmployeeInvitation
  extends Struct.CollectionTypeSchema {
  collectionName: 'employee_invitations';
  info: {
    displayName: 'Employee Invitation';
    pluralName: 'employee-invitations';
    singularName: 'employee-invitation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    branch: Schema.Attribute.Relation<'manyToOne', 'api::branch.branch'>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expires_at: Schema.Attribute.DateTime;
    invite_token: Schema.Attribute.String & Schema.Attribute.Unique;
    invited_email: Schema.Attribute.Email & Schema.Attribute.Required;
    invited_name: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::employee-invitation.employee-invitation'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['manager', 'waiter']>;
    status: Schema.Attribute.Enumeration<
      ['pending', 'accepted', 'expired', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmployeeEmployee extends Struct.CollectionTypeSchema {
  collectionName: 'employees';
  info: {
    displayName: 'Employee';
    pluralName: 'employees';
    singularName: 'employee';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assigned_tables: Schema.Attribute.Relation<'oneToMany', 'api::table.table'>;
    branch: Schema.Attribute.Relation<'manyToOne', 'api::branch.branch'>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    full_name: Schema.Attribute.String & Schema.Attribute.Required;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::employee.employee'
    > &
      Schema.Attribute.Private;
    owner_profile: Schema.Attribute.Relation<
      'manyToOne',
      'api::user-profile.user-profile'
    >;
    permissions: Schema.Attribute.JSON;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['owner', 'manager', 'waiter']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiGlobalAdSettingGlobalAdSetting
  extends Struct.SingleTypeSchema {
  collectionName: 'global_ad_settings';
  info: {
    displayName: 'Global Ad Setting';
    pluralName: 'global-ad-settings';
    singularName: 'global-ad-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adsense_publisher_id: Schema.Attribute.String;
    cart_slot_id: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    enable_google_adsense: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    inline_slot_id: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::global-ad-setting.global-ad-setting'
    > &
      Schema.Attribute.Private;
    order_success_slot_id: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    top_banner_slot_id: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuCategoryMenuCategory
  extends Struct.CollectionTypeSchema {
  collectionName: 'menu_categories';
  info: {
    displayName: 'Menu Category';
    pluralName: 'menu-categories';
    singularName: 'menu-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.String;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-category.menu-category'
    > &
      Schema.Attribute.Private;
    menu_items: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item.menu-item'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    sort_order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuItemModifierMenuItemModifier
  extends Struct.CollectionTypeSchema {
  collectionName: 'menu_item_modifiers';
  info: {
    displayName: 'MenuItemModifier';
    pluralName: 'menu-item-modifiers';
    singularName: 'menu-item-modifier';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item-modifier.menu-item-modifier'
    > &
      Schema.Attribute.Private;
    menu_item: Schema.Attribute.Relation<
      'manyToOne',
      'api::menu-item.menu-item'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuItemVariantMenuItemVariant
  extends Struct.CollectionTypeSchema {
  collectionName: 'menu_item_variants';
  info: {
    displayName: 'MenuItemVariant';
    pluralName: 'menu-item-variants';
    singularName: 'menu-item-variant';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item-variant.menu-item-variant'
    > &
      Schema.Attribute.Private;
    menu_item: Schema.Attribute.Relation<
      'manyToOne',
      'api::menu-item.menu-item'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiMenuItemMenuItem extends Struct.CollectionTypeSchema {
  collectionName: 'menu_items';
  info: {
    displayName: 'MenuItem';
    pluralName: 'menu-items';
    singularName: 'menu-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    is_available: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    is_featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    is_popular: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    is_special_offer: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    is_sponsored: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item.menu-item'
    > &
      Schema.Attribute.Private;
    menu_category: Schema.Attribute.Relation<
      'manyToOne',
      'api::menu-category.menu-category'
    >;
    modifiers: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item-modifier.menu-item-modifier'
    >;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    preparation_time: Schema.Attribute.String;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    tags: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    variants: Schema.Attribute.Relation<
      'oneToMany',
      'api::menu-item-variant.menu-item-variant'
    >;
  };
}

export interface ApiOrderOrder extends Struct.CollectionTypeSchema {
  collectionName: 'orders';
  info: {
    displayName: 'Order';
    pluralName: 'orders';
    singularName: 'order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customer_installation_id: Schema.Attribute.String;
    customer_session_id: Schema.Attribute.String;
    items: Schema.Attribute.Component<'order.order-item', true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::order.order'> &
      Schema.Attribute.Private;
    menu_snapshot: Schema.Attribute.JSON;
    notes: Schema.Attribute.Text;
    numeric_order_number: Schema.Attribute.Integer;
    order_number: Schema.Attribute.String & Schema.Attribute.Unique;
    orderStatus: Schema.Attribute.Enumeration<
      ['pending', 'accepted', 'preparing', 'served', 'completed', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    payment_status: Schema.Attribute.Enumeration<['unpaid', 'paid']> &
      Schema.Attribute.DefaultTo<'unpaid'>;
    publishedAt: Schema.Attribute.DateTime;
    service_charge: Schema.Attribute.Decimal;
    subtotal: Schema.Attribute.Decimal;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    total: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    waiter: Schema.Attribute.Relation<'manyToOne', 'api::employee.employee'>;
  };
}

export interface ApiPlatformAdminPlatformAdmin
  extends Struct.CollectionTypeSchema {
  collectionName: 'platform_admins';
  info: {
    displayName: 'Platform Admin';
    pluralName: 'platform-admins';
    singularName: 'platform-admin';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::platform-admin.platform-admin'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'platform_master'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiPromotionPromotion extends Struct.CollectionTypeSchema {
  collectionName: 'promotions';
  info: {
    displayName: 'Promotion';
    pluralName: 'promotions';
    singularName: 'promotion';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    applicable_items: Schema.Attribute.Relation<
      'manyToMany',
      'api::menu-item.menu-item'
    >;
    branch: Schema.Attribute.Relation<'manyToOne', 'api::branch.branch'>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    end_date: Schema.Attribute.Date;
    end_time: Schema.Attribute.Time;
    image: Schema.Attribute.Media<'images'>;
    is_active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::promotion.promotion'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    start_date: Schema.Attribute.Date;
    start_time: Schema.Attribute.Time;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['happy_hour', 'event', 'combo', 'special_offer']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTableTable extends Struct.CollectionTypeSchema {
  collectionName: 'tables';
  info: {
    displayName: 'Table';
    pluralName: 'tables';
    singularName: 'table';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assigned_waiter: Schema.Attribute.Relation<
      'oneToOne',
      'api::employee.employee'
    >;
    branch: Schema.Attribute.Relation<'manyToOne', 'api::branch.branch'>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    capacity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<4>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::table.table'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    qr_code_url: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['available', 'occupied', 'needs_waiter', 'ordering', 'bill_requested']
    > &
      Schema.Attribute.DefaultTo<'available'>;
    table_name: Schema.Attribute.String;
    table_number: Schema.Attribute.Integer & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserProfileUserProfile extends Struct.CollectionTypeSchema {
  collectionName: 'user_profiles';
  info: {
    displayName: 'UserProfile';
    pluralName: 'user-profiles';
    singularName: 'user-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account_type: Schema.Attribute.Enumeration<['business_owner', 'employee']>;
    avatar: Schema.Attribute.Media<'images'>;
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    employees: Schema.Attribute.Relation<'oneToMany', 'api::employee.employee'>;
    full_name: Schema.Attribute.String;
    is_platform_admin: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-profile.user-profile'
    > &
      Schema.Attribute.Private;
    must_change_password: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    onboarding_complete: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    onboarding_step: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiWaiterCallWaiterCall extends Struct.CollectionTypeSchema {
  collectionName: 'waiter_calls';
  info: {
    displayName: 'Waiter Call';
    pluralName: 'waiter-calls';
    singularName: 'waiter-call';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    business: Schema.Attribute.Relation<'manyToOne', 'api::business.business'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::waiter-call.waiter-call'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'acknowledged', 'completed']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    table: Schema.Attribute.Relation<'manyToOne', 'api::table.table'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    waiter: Schema.Attribute.Relation<'manyToOne', 'api::employee.employee'>;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activeDevice: Schema.Attribute.Relation<'oneToOne', 'api::device.device'>;
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    country: Schema.Attribute.Relation<'oneToOne', 'api::country.country'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentLocation: Schema.Attribute.JSON;
    devices: Schema.Attribute.Relation<'oneToMany', 'api::device.device'>;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user_profile: Schema.Attribute.Relation<
      'oneToOne',
      'api::user-profile.user-profile'
    >;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::activity-log.activity-log': ApiActivityLogActivityLog;
      'api::ad-campaign.ad-campaign': ApiAdCampaignAdCampaign;
      'api::ad-event.ad-event': ApiAdEventAdEvent;
      'api::admn-setting.admn-setting': ApiAdmnSettingAdmnSetting;
      'api::advertiser.advertiser': ApiAdvertiserAdvertiser;
      'api::branch.branch': ApiBranchBranch;
      'api::business-ad-setting.business-ad-setting': ApiBusinessAdSettingBusinessAdSetting;
      'api::business-menu-setting.business-menu-setting': ApiBusinessMenuSettingBusinessMenuSetting;
      'api::business.business': ApiBusinessBusiness;
      'api::city.city': ApiCityCity;
      'api::country.country': ApiCountryCountry;
      'api::currency.currency': ApiCurrencyCurrency;
      'api::custom-controller.custom-controller': ApiCustomControllerCustomController;
      'api::customer.customer': ApiCustomerCustomer;
      'api::device.device': ApiDeviceDevice;
      'api::employee-invitation.employee-invitation': ApiEmployeeInvitationEmployeeInvitation;
      'api::employee.employee': ApiEmployeeEmployee;
      'api::global-ad-setting.global-ad-setting': ApiGlobalAdSettingGlobalAdSetting;
      'api::menu-category.menu-category': ApiMenuCategoryMenuCategory;
      'api::menu-item-modifier.menu-item-modifier': ApiMenuItemModifierMenuItemModifier;
      'api::menu-item-variant.menu-item-variant': ApiMenuItemVariantMenuItemVariant;
      'api::menu-item.menu-item': ApiMenuItemMenuItem;
      'api::order.order': ApiOrderOrder;
      'api::platform-admin.platform-admin': ApiPlatformAdminPlatformAdmin;
      'api::promotion.promotion': ApiPromotionPromotion;
      'api::table.table': ApiTableTable;
      'api::user-profile.user-profile': ApiUserProfileUserProfile;
      'api::waiter-call.waiter-call': ApiWaiterCallWaiterCall;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
