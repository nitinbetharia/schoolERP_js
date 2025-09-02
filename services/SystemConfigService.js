const fs = require('fs');
const path = require('path');
const appConfig = require('../config/app-config.json');
const { logError, logSystem } = require('../utils/logger');

/**
 * System Configuration Service
 * - Reads static app-config.json
 * - Applies runtime overrides from config/runtime-overrides.json (if present)
 * - Persists changes to overrides file without touching base config
 */
class SystemConfigService {
   constructor() {
      this.overridesPath = path.join(__dirname, '..', 'config', 'runtime-overrides.json');
      this.cache = null;
      this.cacheMtime = 0;
   }

   loadOverrides() {
      try {
         if (fs.existsSync(this.overridesPath)) {
            const stat = fs.statSync(this.overridesPath);
            if (!this.cache || stat.mtimeMs > this.cacheMtime) {
               const raw = fs.readFileSync(this.overridesPath, 'utf8');
               this.cache = JSON.parse(raw || '{}');
               this.cacheMtime = stat.mtimeMs;
            }
            return this.cache || {};
         }
         return {};
      } catch (error) {
         logError(error, { context: 'SystemConfigService.loadOverrides' });
         return {};
      }
   }

   getEffectiveConfig() {
      const overrides = this.loadOverrides();
      // Shallow merge at known top-level keys to avoid deep complexity
      return {
         ...appConfig,
         app: { ...appConfig.app, ...(overrides.app || {}) },
         security: { ...appConfig.security, ...(overrides.security || {}) },
         email: { ...(appConfig.email || {}), ...(overrides.email || {}) },
         integrations: { ...(appConfig.integrations || {}), ...(overrides.integrations || {}) },
         database: { ...appConfig.database, ...(overrides.database || {}) },
      };
   }

   getSection(section) {
      const effective = this.getEffectiveConfig();
      switch (section) {
         case 'general':
            return {
               timezone: effective.app?.timezone || 'UTC',
               locale: effective.app?.locale || 'en-IN',
               currency: effective.app?.currency || 'INR',
               academicYearStartMonth: effective.app?.academicYearStartMonth || 4,
               branding: effective.app?.branding || { name: 'School ERP', logo: '' },
            };
         case 'security':
            return {
               sessionMaxAge: effective.security?.sessionMaxAge || 86400000,
               maxLoginAttempts: effective.security?.maxLoginAttempts || 5,
               lockoutTimeMs: effective.security?.lockoutTimeMs || 900000,
               bcryptRounds: effective.security?.bcryptRounds || 10,
               twoFactor: effective.security?.twoFactor || { enabled: false },
            };
         case 'email':
            return {
               host: effective.email?.host || process.env.SMTP_HOST || '',
               port: effective.email?.port || Number(process.env.SMTP_PORT || 587),
               secure: effective.email?.secure ?? false,
               user: effective.email?.user || process.env.SMTP_USER || '',
               from: effective.email?.from || process.env.EMAIL_FROM || '',
            };
         case 'integrations':
            return {
               paymentGateway: effective.integrations?.paymentGateway || { provider: 'none' },
               sms: effective.integrations?.sms || { provider: 'none' },
               storage: effective.integrations?.storage || { provider: 'local' },
               analytics: effective.integrations?.analytics || { provider: 'none' },
            };
         default:
            return {};
      }
   }

   async saveSection(section, values) {
      try {
         const current = this.loadOverrides();
         const updated = { ...current };

         switch (section) {
            case 'general':
               updated.app = {
                  ...(updated.app || {}),
                  timezone: values.timezone,
                  locale: values.locale,
                  currency: values.currency,
                  academicYearStartMonth: Number(values.academicYearStartMonth || 4),
                  branding: {
                     ...(updated.app?.branding || {}),
                     name: values.branding_name || 'School ERP',
                     logo: values.branding_logo || '',
                  },
               };
               break;
            case 'security':
               updated.security = {
                  ...(updated.security || {}),
                  sessionMaxAge: Number(values.sessionMaxAge || 86400000),
                  maxLoginAttempts: Number(values.maxLoginAttempts || 5),
                  lockoutTimeMs: Number(values.lockoutTimeMs || 900000),
                  bcryptRounds: Number(values.bcryptRounds || 10),
                  twoFactor: { enabled: values.twoFactorEnabled === 'on' },
               };
               break;
            case 'email':
               updated.email = {
                  ...(updated.email || {}),
                  host: values.host || '',
                  port: Number(values.port || 587),
                  secure: values.secure === 'on',
                  user: values.user || '',
                  from: values.from || '',
               };
               break;
            case 'integrations':
               updated.integrations = {
                  ...(updated.integrations || {}),
                  paymentGateway: { provider: values.paymentProvider || 'none' },
                  sms: { provider: values.smsProvider || 'none' },
                  storage: { provider: values.storageProvider || 'local' },
                  analytics: { provider: values.analyticsProvider || 'none' },
               };
               break;
            default:
               break;
         }

         // Ensure config directory exists (it does) and write file
         fs.writeFileSync(this.overridesPath, JSON.stringify(updated, null, 2), 'utf8');
         this.cache = updated;
         this.cacheMtime = Date.now();
         logSystem(`Saved system config overrides for section: ${section}`);
         return true;
      } catch (error) {
         logError(error, { context: 'SystemConfigService.saveSection', section });
         return false;
      }
   }
}

module.exports = new SystemConfigService();
