/**
 * Legacy File Manager - Automates moving deprecated files to legacy folder
 *
 * Usage during refactoring:
 * - moveToLegacy(originalPath, reason, replacedBy, qaViolation)
 * - updateLegacyLog(fileInfo)
 */

const fs = require('fs').promises;
const path = require('path');

class LegacyFileManager {
  constructor() {
    this.legacyDir = path.join(process.cwd(), 'legacy');
    this.readmePath = path.join(this.legacyDir, 'README.md');
  }

  /**
   * Move a file to legacy directory with proper logging
   */
  async moveToLegacy(originalPath, reason, replacedBy, qaViolation) {
    try {
      // Ensure original file exists
      await fs.access(originalPath);

      // Calculate legacy path (preserve directory structure)
      const relativePath = path.relative(process.cwd(), originalPath);
      const legacyPath = path.join(this.legacyDir, relativePath);

      // Ensure legacy directory structure exists
      await fs.mkdir(path.dirname(legacyPath), { recursive: true });

      // Move file to legacy
      await fs.rename(originalPath, legacyPath);

      // Update legacy log
      await this.updateLegacyLog({
        date: new Date().toISOString().split('T')[0],
        fileMoved: relativePath,
        reason,
        replacedBy,
        qaViolation
      });

      console.log(`✅ Moved to legacy: ${relativePath}`);
      console.log(`📝 Reason: ${reason}`);
      console.log(`🔄 Replaced by: ${replacedBy}`);
      console.log(`❌ Q&A Violation: ${qaViolation}`);

      return legacyPath;
    } catch (error) {
      console.error(`❌ Failed to move ${originalPath} to legacy:`, error.message);
      throw error;
    }
  }

  /**
   * Update the legacy README.md log table
   */
  async updateLegacyLog(fileInfo) {
    try {
      let readmeContent = await fs.readFile(this.readmePath, 'utf8');

      // Find the log table and add new entry
      const logTableStart = readmeContent.indexOf(
        '| Date | File Moved | Reason | Replaced By | Q&A Violation |'
      );
      const logTableHeaderEnd = readmeContent.indexOf('\n', logTableStart + 1);
      const logTableSeparatorEnd = readmeContent.indexOf('\n', logTableHeaderEnd + 1);

      const newLogEntry = `| ${fileInfo.date} | \`${fileInfo.fileMoved}\` | ${fileInfo.reason} | \`${fileInfo.replacedBy}\` | ${fileInfo.qaViolation} |\n`;

      const beforeTable = readmeContent.substring(0, logTableSeparatorEnd + 1);
      const afterTable = readmeContent.substring(logTableSeparatorEnd + 1);

      readmeContent = beforeTable + newLogEntry + afterTable;

      await fs.writeFile(this.readmePath, readmeContent);
      console.log('📝 Updated legacy log');
    } catch (error) {
      console.error('❌ Failed to update legacy log:', error.message);
    }
  }

  /**
   * Create legacy directory structure for a specific module
   */
  async createLegacyStructure(modulePath) {
    const legacyModulePath = path.join(this.legacyDir, modulePath);
    await fs.mkdir(legacyModulePath, { recursive: true });
    return legacyModulePath;
  }

  /**
   * Check if a file exists in legacy
   */
  async isInLegacy(originalPath) {
    const relativePath = path.relative(process.cwd(), originalPath);
    const legacyPath = path.join(this.legacyDir, relativePath);

    try {
      await fs.access(legacyPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restore a file from legacy (emergency use)
   */
  async restoreFromLegacy(originalPath) {
    const relativePath = path.relative(process.cwd(), originalPath);
    const legacyPath = path.join(this.legacyDir, relativePath);

    try {
      await fs.access(legacyPath);
      await fs.rename(legacyPath, originalPath);
      console.log(`🔄 Restored from legacy: ${relativePath}`);
      console.log('⚠️  WARNING: You restored a non-compliant file!');
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore ${relativePath}:`, error.message);
      return false;
    }
  }

  /**
   * List all files in legacy
   */
  async listLegacyFiles() {
    try {
      const files = [];

      const walkDir = async dir => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.name !== 'README.md') {
            const relativePath = path.relative(this.legacyDir, fullPath);
            files.push(relativePath);
          }
        }
      };

      await walkDir(this.legacyDir);
      return files;
    } catch (error) {
      console.error('❌ Failed to list legacy files:', error.message);
      return [];
    }
  }
}

module.exports = new LegacyFileManager();
