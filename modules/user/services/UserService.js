const bcrypt = require('bcryptjs');
const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   // Legacy classes for backward compatibility
   ValidationError,
   NotFoundError,
   DuplicateError,
   AuthenticationError
} = require('../../../utils/errors');

/**
 * User Service
 * Handles tenant user management operations
 */
function createUserService() {

   this.defaultRoles = ['STUDENT', 'TEACHER', 'STAFF', 'PRINCIPAL', 'ADMIN'];
   

   /**
    * createUser method
    */
   async function createUser() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Username already exists in this tenant already exists');
         
   }

   /**
    * if method
    */
   async function if() {

      const existingEmail = await User.findOne({
      where: { email: userData.email
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Email already exists in this tenant already exists');
            
   }

   /**
    * if method
    */
   async function if() {

      profile = await UserProfile.create({
      user_id: user.id,
      ...userData.profile,
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'Failed to create user',
      tenant_code: tenantCode,
      username: userData.username,
      error: error.message,
         
   }

   /**
    * getUserById method
    */
   async function getUserById() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('User not found');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'Failed to get user',
      tenant_code: tenantCode,
      user_id: userId,
      error: error.message,
         
   }

   /**
    * updateUser method
    */
   async function updateUser() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('User not found');
         
   }

   /**
    * if method
    */
   async function if() {

      const existingUsername = await User.findOne({
      where: {
      username: updateData.username,
      id: { [require('sequelize').Op.ne]: userId
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Username already exists already exists');
            
   }

   /**
    * if method
    */
   async function if() {

      const existingEmail = await User.findOne({
      where: {
      email: updateData.email,
      id: { [require('sequelize').Op.ne]: userId
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.conflict('Email already exists already exists');
            
   }

   /**
    * if method
    */
   async function if() {

      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
         
   }

   /**
    * if method
    */
   async function if() {

      let profile = await UserProfile.findOne({ where: { user_id: userId
   }

   /**
    * if method
    */
   async function if() {

      await profile.update(updateData.profile);
            
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'Failed to update user',
      tenant_code: tenantCode,
      user_id: userId,
      error: error.message,
         
   }

   /**
    * getUsers method
    */
   async function getUsers() {

      try {
      const { getTenantModels
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'Failed to get users',
      tenant_code: tenantCode,
      error: error.message,
         
   }

   /**
    * authenticateUser method
    */
   async function authenticateUser() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.authentication('Invalid username or password');
         
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.authentication('Invalid username or password');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'User authentication failed',
      tenant_code: tenantCode,
      username: username,
      error: error.message,
         
   }

   /**
    * deleteUser method
    */
   async function deleteUser() {

      try {
      const { getTenantModels
   }

   /**
    * if method
    */
   async function if() {

      throw ErrorFactory.notFound('User not found');
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('User Service Error', {
      service: 'user-service',
      category: 'ERROR',
      event: 'Failed to delete user',
      tenant_code: tenantCode,
      user_id: userId,
      error: error.message,
         
   }

   return {
      createUser,
      if,
      if,
      if,
      if,
      catch,
      getUserById,
      if,
      catch,
      updateUser,
      if,
      if,
      if,
      if,
      if,
      if,
      if,
      if,
      catch,
      getUsers,
      catch,
      authenticateUser,
      if,
      if,
      catch,
      deleteUser,
      if,
      catch
   };
}

module.exports = UserService;
