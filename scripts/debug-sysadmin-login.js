require('dotenv').config();
const bcrypt = require('bcryptjs');
(async () => {
   try {
      const { dbManager } = require('../models/system/database');
      const { defineSystemUserModel } = require('../models/system/SystemUser');
      const systemDB = await dbManager.getSystemDB();
      const SystemUser = defineSystemUserModel(systemDB);
      const user = await SystemUser.findOne({ where: { username: 'sysadmin' } });
      if (!user) {
         console.log('No sysadmin found');
         process.exit(2);
      }
      console.log('Sysadmin row:', {
         id: user.id,
         username: user.username,
         email: user.email,
         role: user.role,
         status: user.status,
         login_attempts: user.login_attempts,
         locked_until: user.locked_until,
         password_hash_len: user.password_hash?.length,
      });
      const ok = await bcrypt.compare('sysadmin123', user.password_hash);
      console.log('bcrypt.compare("sysadmin123") ->', ok);
      process.exit(0);
   } catch (e) {
      console.error('Debug error:', e);
      process.exit(1);
   }
})();
