/**
 * Logo Helper Utility
 * Manages logo display logic for different contexts (system vs trust)
 */

const path = require('path');
const fs = require('fs');

class LogoHelper {
  constructor() {
    this.developerLogosPath = '/static/logos/developer';
    this.trustLogosPath = '/static/logos/trusts';
    
    // Default developer/system logos
    this.systemLogos = {
      primary: '/static/logos/developer/tvarita_name_only1.svg',
      square: '/static/logos/developer/tvarita_square_logo.svg',
      icon: '/static/logos/developer/tvarita_without_name.svg',
      horizontal: '/static/logos/developer/tvawrita_sideways.svg'
    };
  }

  /**
   * Get logo configuration based on context
   * @param {string} context - 'system' or 'trust'
   * @param {string} trustCode - Trust identifier (for trust context)
   * @param {string} type - Logo type: 'primary', 'square', 'icon', 'horizontal'
   * @returns {object} Logo configuration
   */
  getLogo(context = 'system', trustCode = null, type = 'primary') {
    if (context === 'system') {
      return this.getSystemLogo(type);
    } else if (context === 'trust' && trustCode) {
      return this.getTrustLogo(trustCode, type);
    }
    
    // Fallback to system logo
    return this.getSystemLogo(type);
  }

  /**
   * Get system/developer logo
   * @param {string} type - Logo type
   * @returns {object} Logo configuration
   */
  getSystemLogo(type = 'primary') {
    const logoPath = this.systemLogos[type] || this.systemLogos.primary;
    
    return {
      src: logoPath,
      alt: 'TvaritaTech School ERP',
      context: 'system',
      type: type,
      fallback: this.getDefaultSystemLogo()
    };
  }

  /**
   * Get trust-specific logo
   * @param {string} trustCode - Trust identifier
   * @param {string} type - Logo type
   * @returns {object} Logo configuration
   */
  getTrustLogo(trustCode, type = 'primary') {
    // Check if trust has custom logo
    const trustLogoPath = `${this.trustLogosPath}/${trustCode}/${type}.svg`;
    
    // For now, return system logo as fallback
    // TODO: Implement trust logo detection when trust logos are uploaded
    return {
      src: this.systemLogos[type] || this.systemLogos.primary,
      alt: `${trustCode} School ERP`,
      context: 'trust',
      trustCode: trustCode,
      type: type,
      fallback: this.getDefaultSystemLogo(),
      customLogoPath: trustLogoPath // For future implementation
    };
  }

  /**
   * Get default system logo (SVG fallback)
   * @returns {object} Default logo configuration
   */
  getDefaultSystemLogo() {
    return {
      type: 'svg',
      content: `
        <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      `,
      alt: 'School ERP'
    };
  }

  /**
   * Get logo for EJS template rendering
   * @param {object} req - Express request object
   * @returns {object} Logo configuration for template
   */
  getLogoForTemplate(req) {
    // Determine context based on request
    const isSystemContext = req.session?.loginType === 'SYSTEM' || 
                           req.path?.startsWith('/admin') ||
                           req.path?.includes('system');
    
    const context = isSystemContext ? 'system' : 'trust';
    const trustCode = req.trustCode || req.session?.trustCode;
    
    // Determine logo type based on page
    let logoType = 'primary';
    if (req.path?.includes('/auth/')) {
      logoType = 'square'; // Use square logo for auth pages
    }
    
    return this.getLogo(context, trustCode, logoType);
  }

  /**
   * Create trust logo directory structure
   * @param {string} trustCode - Trust identifier
   */
  createTrustLogoDirectory(trustCode) {
    const trustDir = path.join(__dirname, '..', 'public', 'logos', 'trusts', trustCode);
    
    try {
      if (!fs.existsSync(trustDir)) {
        fs.mkdirSync(trustDir, { recursive: true });
      }
      return trustDir;
    } catch (error) {
      console.error('Failed to create trust logo directory:', error);
      return null;
    }
  }
}

module.exports = new LogoHelper();