const PasswordGenerator = require('../../utils/passwordGenerator');

describe('Password Generator Tests', () => {
   describe('Basic Password Generation', () => {
      test('Generates password with default options', () => {
         const password = PasswordGenerator.generatePassword();
         
         expect(password).toBeDefined();
         expect(password.length).toBe(12); // Default length
         expect(typeof password).toBe('string');
      });

      test('Generates password with specified length', () => {
         const password = PasswordGenerator.generatePassword({ length: 16 });
         expect(password.length).toBe(16);
      });

      test('Generates password with only lowercase', () => {
         const password = PasswordGenerator.generatePassword({
            length: 20,
            includeUppercase: false,
            includeLowercase: true,
            includeNumbers: false,
            includeSymbols: false
         });

         expect(password).toMatch(/^[a-z]+$/);
         expect(password.length).toBe(20);
      });

      test('Generates password with mixed character types', () => {
         const password = PasswordGenerator.generatePassword({
            length: 15,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: true,
            minUppercase: 2,
            minLowercase: 2,
            minNumbers: 2,
            minSymbols: 1
         });

         expect(password.length).toBe(15);
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase
         expect(password).toMatch(/\d/);    // Has numbers
         expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Has symbols
      });
   });

   describe('User-Friendly Password Generation', () => {
      test('Generates user-friendly password', () => {
         const password = PasswordGenerator.generateUserFriendlyPassword();
         
         expect(password.length).toBe(10); // Default for user-friendly
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase
         expect(password).toMatch(/\d/);    // Has numbers
         expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // No symbols
      });

      test('Uses user-friendly character set', () => {
         const password = PasswordGenerator.generateUserFriendlyPassword(50);
         
         // Should not include symbols for user-friendliness
         expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
         // Should have a good mix of character types
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase  
         expect(password).toMatch(/\d/);    // Has numbers
      });
   });

   describe('Secure Password Generation', () => {
      test('Generates secure password with all character types', () => {
         const password = PasswordGenerator.generateSecurePassword();
         
         expect(password.length).toBe(16); // Default for secure
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase
         expect(password).toMatch(/\d/);    // Has numbers
         expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Has symbols
      });

      test('Meets minimum character requirements', () => {
         const password = PasswordGenerator.generateSecurePassword(20);
         
         const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
         const lowercaseCount = (password.match(/[a-z]/g) || []).length;
         const numberCount = (password.match(/\d/g) || []).length;
         const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;
         
         expect(uppercaseCount).toBeGreaterThanOrEqual(2);
         expect(lowercaseCount).toBeGreaterThanOrEqual(2);
         expect(numberCount).toBeGreaterThanOrEqual(2);
         expect(symbolCount).toBeGreaterThanOrEqual(1);
      });
   });

   describe('Temporary Password Generation', () => {
      test('Generates temporary password suitable for email', () => {
         const password = PasswordGenerator.generateTemporaryPassword();
         
         expect(password.length).toBe(12); // Default for temporary
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase
         expect(password).toMatch(/\d/);    // Has numbers
         expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // No symbols for readability
      });

      test('Is readable and professional', () => {
         const password = PasswordGenerator.generateTemporaryPassword(30);
         
         // Should not contain symbols for email readability
         expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
         // Should have balanced character types
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).toMatch(/[a-z]/); // Has lowercase
         expect(password).toMatch(/\d/);    // Has numbers
      });
   });

   describe('Password Strength Validation', () => {
      test('Validates empty password', () => {
         const result = PasswordGenerator.validatePasswordStrength('');
         
         expect(result.isValid).toBe(false);
         expect(result.strength).toBe('Very Weak');
         expect(result.feedback).toContain('Password is required');
      });

      test('Validates weak password', () => {
         const result = PasswordGenerator.validatePasswordStrength('abc');
         
         expect(result.isValid).toBe(false);
         expect(result.strength).toBe('Very Weak');
         expect(result.feedback.length).toBeGreaterThan(0);
      });

      test('Validates strong password', () => {
         const result = PasswordGenerator.validatePasswordStrength('StrongPass123!');
         
         expect(result.isValid).toBe(true);
         expect(['Fair', 'Good', 'Strong']).toContain(result.strength);
         expect(result.score).toBeGreaterThanOrEqual(4);
      });

      test('Penalizes common patterns', () => {
         const weakResult = PasswordGenerator.validatePasswordStrength('password123');
         const strongResult = PasswordGenerator.validatePasswordStrength('RandomSecure567');
         
         expect(weakResult.score).toBeLessThan(strongResult.score);
         expect(weakResult.feedback.some(msg => 
            msg.toLowerCase().includes('common')
         )).toBe(true);
      });

      test('Validates character type requirements', () => {
         const noUppercase = PasswordGenerator.validatePasswordStrength('lowercase123');
         const noNumbers = PasswordGenerator.validatePasswordStrength('OnlyLetters');
         const balanced = PasswordGenerator.validatePasswordStrength('MySecure789Pass');
         
         expect(noUppercase.feedback.some(msg => 
            msg.toLowerCase().includes('uppercase')
         )).toBe(true);
         
         expect(noNumbers.feedback.some(msg => 
            msg.toLowerCase().includes('number')
         )).toBe(true);
         
         expect(balanced.isValid).toBe(true);
      });

      test('Penalizes repetitive characters', () => {
         const repetitive = PasswordGenerator.validatePasswordStrength('Passsssword123');
         const normal = PasswordGenerator.validatePasswordStrength('ComplexPassword456');
         
         expect(repetitive.score).toBeLessThanOrEqual(normal.score);
         expect(repetitive.feedback.some(msg => 
            msg.toLowerCase().includes('repeat')
         )).toBe(true);
      });
   });

   describe('Utility Functions', () => {
      test('getRandomChar returns character from string', () => {
         const chars = 'abcdef';
         const randomChar = PasswordGenerator.getRandomChar(chars);
         
         expect(chars).toContain(randomChar);
         expect(randomChar.length).toBe(1);
      });

      test('shuffleArray randomizes array order', () => {
         const original = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
         const shuffled = PasswordGenerator.shuffleArray(original);
         
         expect(shuffled.length).toBe(original.length);
         expect(shuffled).toEqual(expect.arrayContaining(original));
         
         // With high probability, should not be in same order
         const sameOrder = shuffled.every((item, index) => item === original[index]);
         expect(sameOrder).toBe(false);
      });
   });

   describe('Error Handling', () => {
      test('Throws error when no character types selected', () => {
         expect(() => {
            PasswordGenerator.generatePassword({
               includeUppercase: false,
               includeLowercase: false,
               includeNumbers: false,
               includeSymbols: false
            });
         }).toThrow('No character types selected');
      });

      test('Handles edge case minimum requirements', () => {
         const password = PasswordGenerator.generatePassword({
            length: 4,
            minUppercase: 2,
            minLowercase: 2,
            minNumbers: 1,
            minSymbols: 1
         });
         
         // Should still generate 4-character password even with conflicting requirements
         expect(password.length).toBe(4);
      });
   });

   describe('Randomness and Distribution', () => {
      test('Generates different passwords on multiple calls', () => {
         const passwords = [];
         for (let i = 0; i < 10; i++) {
            passwords.push(PasswordGenerator.generatePassword());
         }
         
         // All passwords should be unique
         const uniquePasswords = new Set(passwords);
         expect(uniquePasswords.size).toBe(passwords.length);
      });

      test('Character distribution is reasonable', () => {
         const password = PasswordGenerator.generatePassword({
            length: 100,
            includeUppercase: true,
            includeLowercase: true,
            includeNumbers: true,
            includeSymbols: false
         });
         
         const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
         const lowercaseCount = (password.match(/[a-z]/g) || []).length;
         const numberCount = (password.match(/\d/g) || []).length;
         
         // With 100 characters, each type should have reasonable representation
         expect(uppercaseCount).toBeGreaterThan(5);
         expect(lowercaseCount).toBeGreaterThan(5);
         expect(numberCount).toBeGreaterThan(5);
      });
   });

   describe('Integration with Different Options', () => {
      test('Respects all configuration options', () => {
         const options = {
            length: 25,
            includeUppercase: true,
            includeLowercase: false, // Disabled
            includeNumbers: true,
            includeSymbols: true,
            excludeSimilar: false, // Disabled
            minUppercase: 3,
            minNumbers: 3,
            minSymbols: 2
         };
         
         const password = PasswordGenerator.generatePassword(options);
         
         expect(password.length).toBe(25);
         expect(password).toMatch(/[A-Z]/); // Has uppercase
         expect(password).not.toMatch(/[a-z]/); // No lowercase
         expect(password).toMatch(/\d/);    // Has numbers
         expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // Has symbols
         
         const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
         const numberCount = (password.match(/\d/g) || []).length;
         const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length;
         
         expect(uppercaseCount).toBeGreaterThanOrEqual(3);
         expect(numberCount).toBeGreaterThanOrEqual(3);
         expect(symbolCount).toBeGreaterThanOrEqual(2);
      });
   });
});
