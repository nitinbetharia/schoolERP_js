const crypto = require('crypto');

/**
 * Password Generator Utility for School ERP System
 * Generates secure, user-friendly passwords for new accounts
 */
class PasswordGenerator {
   /**
    * Generate a secure password with customizable options
    * @param {Object} options - Password generation options
    * @returns {string} - Generated password
    */
   static generatePassword(options = {}) {
      const defaults = {
         length: 12,
         includeUppercase: true,
         includeLowercase: true,
         includeNumbers: true,
         includeSymbols: false,
         excludeSimilar: true,
         minUppercase: 1,
         minLowercase: 1,
         minNumbers: 1,
         minSymbols: 0,
      };

      const config = { ...defaults, ...options };

      // Character sets
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      // Similar characters to exclude
      const similar = 'il1Lo0O';

      // Build character pool
      let chars = '';
      if (config.includeLowercase) {
         chars += config.excludeSimilar ? lowercase.replace(/[il]/g, '') : lowercase;
      }
      if (config.includeUppercase) {
         chars += config.excludeSimilar ? uppercase.replace(/[LO]/g, '') : uppercase;
      }
      if (config.includeNumbers) {
         chars += config.excludeSimilar ? numbers.replace(/[10]/g, '') : numbers;
      }
      if (config.includeSymbols) {
         chars += symbols;
      }

      if (chars.length === 0) {
         throw new Error('No character types selected for password generation');
      }

      // Generate password ensuring minimum requirements
      let password = '';
      const requirements = [];

      // Add minimum required characters
      if (config.includeLowercase && config.minLowercase > 0) {
         const lowerChars = config.excludeSimilar ? lowercase.replace(/[il]/g, '') : lowercase;
         for (let i = 0; i < config.minLowercase; i++) {
            requirements.push(this.getRandomChar(lowerChars));
         }
      }

      if (config.includeUppercase && config.minUppercase > 0) {
         const upperChars = config.excludeSimilar ? uppercase.replace(/[LO]/g, '') : uppercase;
         for (let i = 0; i < config.minUppercase; i++) {
            requirements.push(this.getRandomChar(upperChars));
         }
      }

      if (config.includeNumbers && config.minNumbers > 0) {
         const numChars = config.excludeSimilar ? numbers.replace(/[10]/g, '') : numbers;
         for (let i = 0; i < config.minNumbers; i++) {
            requirements.push(this.getRandomChar(numChars));
         }
      }

      if (config.includeSymbols && config.minSymbols > 0) {
         for (let i = 0; i < config.minSymbols; i++) {
            requirements.push(this.getRandomChar(symbols));
         }
      }

      // Fill the rest with random characters
      const remainingLength = Math.max(0, config.length - requirements.length);
      for (let i = 0; i < remainingLength; i++) {
         requirements.push(this.getRandomChar(chars));
      }

      // Shuffle the requirements to avoid predictable patterns
      password = this.shuffleArray(requirements).join('');

      // Truncate if necessary
      return password.substring(0, config.length);
   }

   /**
    * Generate a user-friendly password
    * Readable but still secure for manual entry
    * @param {number} length - Password length (default: 10)
    * @returns {string} - Generated password
    */
   static generateUserFriendlyPassword(length = 10) {
      return this.generatePassword({
         length,
         includeUppercase: true,
         includeLowercase: true,
         includeNumbers: true,
         includeSymbols: false,
         excludeSimilar: true,
         minUppercase: 1,
         minLowercase: 1,
         minNumbers: 1,
      });
   }

   /**
    * Generate a high-security password
    * Maximum entropy for admin accounts
    * @param {number} length - Password length (default: 16)
    * @returns {string} - Generated password
    */
   static generateSecurePassword(length = 16) {
      return this.generatePassword({
         length,
         includeUppercase: true,
         includeLowercase: true,
         includeNumbers: true,
         includeSymbols: true,
         excludeSimilar: true,
         minUppercase: 2,
         minLowercase: 2,
         minNumbers: 2,
         minSymbols: 1,
      });
   }

   /**
    * Generate a temporary password for email delivery
    * Balance of security and usability
    * @param {number} length - Password length (default: 12)
    * @returns {string} - Generated password
    */
   static generateTemporaryPassword(length = 12) {
      return this.generatePassword({
         length,
         includeUppercase: true,
         includeLowercase: true,
         includeNumbers: true,
         includeSymbols: false,
         excludeSimilar: true,
         minUppercase: 2,
         minLowercase: 2,
         minNumbers: 2,
      });
   }

   /**
    * Get a cryptographically secure random character from string
    * @param {string} chars - Character set to choose from
    * @returns {string} - Random character
    */
   static getRandomChar(chars) {
      const randomBytes = crypto.randomBytes(1);
      const randomIndex = randomBytes[0] % chars.length;
      return chars[randomIndex];
   }

   /**
    * Shuffle an array using Fisher-Yates algorithm with crypto randomness
    * @param {Array} array - Array to shuffle
    * @returns {Array} - Shuffled array
    */
   static shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
         const randomBytes = crypto.randomBytes(4);
         const randomIndex = randomBytes.readUInt32BE(0) % (i + 1);
         [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
      }
      return shuffled;
   }

   /**
    * Validate password strength
    * @param {string} password - Password to validate
    * @returns {Object} - Validation result with score and feedback
    */
   static validatePasswordStrength(password) {
      const result = {
         score: 0,
         strength: 'Very Weak',
         feedback: [],
         isValid: false,
      };

      if (!password || password.length === 0) {
         result.feedback.push('Password is required');
         return result;
      }

      // Length scoring
      if (password.length >= 8) result.score += 1;
      if (password.length >= 12) result.score += 1;
      if (password.length >= 16) result.score += 1;
      else if (password.length < 8) {
         result.feedback.push('Password should be at least 8 characters long');
      }

      // Character type scoring
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

      if (hasLowercase) result.score += 1;
      if (hasUppercase) result.score += 1;
      if (hasNumbers) result.score += 1;
      if (hasSymbols) result.score += 1;

      // Feedback for missing character types
      if (!hasLowercase) result.feedback.push('Add lowercase letters');
      if (!hasUppercase) result.feedback.push('Add uppercase letters');
      if (!hasNumbers) result.feedback.push('Add numbers');

      // Pattern checks (reduce score for common patterns)
      if (/(.)\1{2,}/.test(password)) {
         result.score -= 1;
         result.feedback.push('Avoid repeating characters');
      }

      if (/123|abc|qwe|password|admin/i.test(password)) {
         result.score -= 2;
         result.feedback.push('Avoid common patterns and words');
      }

      // Determine strength
      result.score = Math.max(0, Math.min(7, result.score));

      if (result.score <= 2) {
         result.strength = 'Very Weak';
      } else if (result.score <= 3) {
         result.strength = 'Weak';
      } else if (result.score <= 4) {
         result.strength = 'Fair';
      } else if (result.score <= 5) {
         result.strength = 'Good';
      } else {
         result.strength = 'Strong';
      }

      result.isValid = result.score >= 4;

      if (result.isValid && result.feedback.length === 0) {
         result.feedback.push('Password meets security requirements');
      }

      return result;
   }
}

module.exports = PasswordGenerator;
