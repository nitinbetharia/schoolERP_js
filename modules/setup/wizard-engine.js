const setupService = require('./setup-service');

class WizardEngine {
  
  constructor() {
    this.activeWizards = new Map(); // Store active wizard sessions
  }

  async startWizard(wizardId, sessionId, userContext = {}) {
    try {
      const config = await setupService.getWizardConfig(wizardId);
      if (!config) {
        throw new Error(`Wizard '${wizardId}' not found`);
      }

      const wizardSession = {
        wizardId,
        sessionId,
        userContext,
        config,
        currentStepIndex: 0,
        stepData: {},
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      this.activeWizards.set(sessionId, wizardSession);

      return {
        wizardId,
        sessionId,
        currentStep: this.getCurrentStep(wizardSession),
        totalSteps: config.steps.length,
        progress: this.calculateProgress(wizardSession)
      };
    } catch (error) {
      throw new Error(`Failed to start wizard: ${error.message}`);
    }
  }

  async getWizardStep(sessionId, stepId = null) {
    const session = this.activeWizards.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    let step;
    if (stepId) {
      step = session.config.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Step not found');
      }
      // Update current step index
      session.currentStepIndex = session.config.steps.findIndex(s => s.id === stepId);
    } else {
      step = this.getCurrentStep(session);
    }

    // Check if step should be displayed based on conditions
    if (step.condition && !this.evaluateCondition(step.condition, session.stepData)) {
      return this.getNextStep(sessionId);
    }

    return {
      step: this.formatStepForClient(step),
      currentStepIndex: session.currentStepIndex,
      totalSteps: session.config.steps.length,
      progress: this.calculateProgress(session),
      canGoBack: this.canGoBack(session),
      canSkip: this.canSkip(session, step),
      savedData: session.stepData[step.id] || {}
    };
  }

  async submitStep(sessionId, stepId, stepData) {
    try {
      const session = this.activeWizards.get(sessionId);
      if (!session) {
        throw new Error('Wizard session not found');
      }

      const step = session.config.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Step not found');
      }

      // Validate step data
      const validation = await setupService.validateWizardStep(
        session.wizardId, 
        stepId, 
        stepData
      );

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          step: this.formatStepForClient(step)
        };
      }

      // Store step data
      session.stepData[stepId] = stepData;
      session.lastActivity = new Date().toISOString();

      // Auto-save progress if enabled
      if (session.config.navigation?.autoSave) {
        await setupService.saveWizardProgress(
          session.wizardId,
          stepId,
          session.stepData,
          sessionId
        );
      }

      // Check if this is the last step
      const isLastStep = session.currentStepIndex === session.config.steps.length - 1;
      
      if (isLastStep) {
        return await this.completeWizard(sessionId);
      }

      // Move to next step
      return await this.getNextStep(sessionId);
    } catch (error) {
      throw new Error(`Failed to submit step: ${error.message}`);
    }
  }

  async getNextStep(sessionId) {
    const session = this.activeWizards.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    // Find next valid step
    let nextStepIndex = session.currentStepIndex + 1;
    
    while (nextStepIndex < session.config.steps.length) {
      const nextStep = session.config.steps[nextStepIndex];
      
      // Check if step should be displayed
      if (!nextStep.condition || this.evaluateCondition(nextStep.condition, session.stepData)) {
        session.currentStepIndex = nextStepIndex;
        return await this.getWizardStep(sessionId);
      }
      
      nextStepIndex++;
    }

    // No more steps, complete wizard
    return await this.completeWizard(sessionId);
  }

  async getPreviousStep(sessionId) {
    const session = this.activeWizards.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    if (!this.canGoBack(session)) {
      throw new Error('Cannot go back from current step');
    }

    // Find previous valid step
    let prevStepIndex = session.currentStepIndex - 1;
    
    while (prevStepIndex >= 0) {
      const prevStep = session.config.steps[prevStepIndex];
      
      // Check if step should be displayed
      if (!prevStep.condition || this.evaluateCondition(prevStep.condition, session.stepData)) {
        session.currentStepIndex = prevStepIndex;
        return await this.getWizardStep(sessionId);
      }
      
      prevStepIndex--;
    }

    throw new Error('No previous step available');
  }

  async skipStep(sessionId) {
    const session = this.activeWizards.get(sessionId);
    if (!session) {
      throw new Error('Wizard session not found');
    }

    const currentStep = this.getCurrentStep(session);
    
    if (!this.canSkip(session, currentStep)) {
      throw new Error('Current step cannot be skipped');
    }

    return await this.getNextStep(sessionId);
  }

  async completeWizard(sessionId) {
    try {
      const session = this.activeWizards.get(sessionId);
      if (!session) {
        throw new Error('Wizard session not found');
      }

      const result = await this.executeWizardCompletion(session);
      
      // Clean up session
      this.activeWizards.delete(sessionId);
      await setupService.clearWizardProgress(session.wizardId, sessionId);

      return {
        success: true,
        completed: true,
        result,
        redirectUrl: session.config.completion?.redirectUrl,
        message: session.config.completion?.successMessage || 'Wizard completed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to complete wizard: ${error.message}`);
    }
  }

  async executeWizardCompletion(session) {
    const { wizardId, stepData, userContext } = session;

    switch (wizardId) {
      case 'trust_setup':
        return await this.completeTrustSetup(stepData, userContext);
      
      case 'school_setup':
        return await this.completeSchoolSetup(stepData, userContext);
      
      default:
        throw new Error(`Unknown wizard type: ${wizardId}`);
    }
  }

  async completeTrustSetup(stepData, userContext) {
    // Combine all step data
    const trustData = {
      ...stepData.trust_info,
      ...stepData.trust_address,
      admin_user: stepData.admin_user,
      theme_config: stepData.theme_config
    };

    const result = await setupService.createTrust(trustData);
    
    // Additional completion tasks
    if (stepData.confirmation?.data_processing_consent) {
      // Log consent
      console.log('Data processing consent recorded for trust:', result.trustCode);
    }

    return result;
  }

  async completeSchoolSetup(stepData, userContext) {
    const { trustCode } = userContext;
    
    // Combine all step data
    const schoolData = {
      ...stepData.school_info,
      ...stepData.school_address,
      ...stepData.principal_info,
      ...stepData.academic_structure
    };

    return await setupService.createSchool(schoolData, trustCode);
  }

  // Helper methods
  getCurrentStep(session) {
    return session.config.steps[session.currentStepIndex];
  }

  calculateProgress(session) {
    const total = session.config.steps.length;
    const completed = session.currentStepIndex;
    return Math.round((completed / total) * 100);
  }

  canGoBack(session) {
    return session.config.navigation?.allowBack !== false && session.currentStepIndex > 0;
  }

  canSkip(session, step) {
    return (
      session.config.navigation?.allowSkip === true && 
      step.required !== true
    );
  }

  evaluateCondition(condition, stepData) {
    if (!condition) return true;

    const { field, operator, value } = condition;
    const fieldValue = this.getFieldValue(field, stepData);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      default:
        return true;
    }
  }

  getFieldValue(fieldPath, stepData) {
    const pathParts = fieldPath.split('.');
    let value = stepData;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  formatStepForClient(step) {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      order: step.order,
      required: step.required,
      component: step.component,
      fields: step.fields,
      actions: step.actions || ['next'],
      validation: !!step.validation
    };
  }

  // Session management
  getActiveSession(sessionId) {
    return this.activeWizards.get(sessionId);
  }

  destroySession(sessionId) {
    this.activeWizards.delete(sessionId);
  }

  cleanupInactiveSessions(maxAgeMinutes = 60) {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    for (const [sessionId, session] of this.activeWizards.entries()) {
      if (new Date(session.lastActivity) < cutoff) {
        this.activeWizards.delete(sessionId);
      }
    }
  }

  getSessionStats() {
    return {
      activeSessions: this.activeWizards.size,
      wizardTypes: Array.from(this.activeWizards.values()).reduce((acc, session) => {
        acc[session.wizardId] = (acc[session.wizardId] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = new WizardEngine();