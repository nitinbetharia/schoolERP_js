const db = require('../data/database-service');
const workflowConfigs = require('../../config/workflow-configs');

class WorkflowEngine {
  
  constructor() {
    this.activeWorkflows = new Map();
  }

  async startWorkflow(workflowId, initialData, trustCode, userContext = {}) {
    try {
      // Get workflow configuration (tenant-specific if available)
      const config = this.getWorkflowConfig(workflowId, trustCode);
      if (!config) {
        throw new Error(`Workflow '${workflowId}' not found`);
      }

      // Create workflow instance
      const workflowInstanceId = this.generateWorkflowId();
      const workflow = {
        instanceId: workflowInstanceId,
        workflowId,
        trustCode,
        userContext,
        config,
        currentStepIndex: 0,
        stepData: {},
        status: 'RUNNING',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        initialData
      };

      // Store in memory (in production, use database)
      this.activeWorkflows.set(workflowInstanceId, workflow);

      // Start first step
      await this.processCurrentStep(workflow, initialData);

      return {
        workflowInstanceId,
        currentStep: this.getCurrentStep(workflow),
        status: workflow.status
      };
    } catch (error) {
      throw new Error(`Failed to start workflow: ${error.message}`);
    }
  }

  async processStep(workflowInstanceId, stepId, stepData, trustCode) {
    try {
      const workflow = this.activeWorkflows.get(workflowInstanceId);
      if (!workflow) {
        throw new Error('Workflow instance not found');
      }

      const step = workflow.config.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Step not found');
      }

      // Validate step data if validation is defined
      if (step.validation) {
        const isValid = await this.validateStepData(step, stepData, trustCode);
        if (!isValid.valid) {
          return {
            success: false,
            errors: isValid.errors,
            currentStep: step
          };
        }
      }

      // Store step data
      workflow.stepData[stepId] = stepData;
      workflow.lastActivity = new Date().toISOString();

      // Execute step actions
      await this.executeStepActions(workflow, step, stepData);

      // Check if workflow is complete
      if (this.isWorkflowComplete(workflow)) {
        return await this.completeWorkflow(workflow);
      }

      // Move to next step
      return await this.advanceWorkflow(workflow);
    } catch (error) {
      throw new Error(`Failed to process step: ${error.message}`);
    }
  }

  async executeStepActions(workflow, step, stepData) {
    switch (step.type) {
      case 'form_submission':
        await this.handleFormSubmission(workflow, step, stepData);
        break;
      
      case 'review_task':
        await this.handleReviewTask(workflow, step, stepData);
        break;
      
      case 'automated_check':
        await this.handleAutomatedCheck(workflow, step, stepData);
        break;
      
      case 'approval_task':
        await this.handleApprovalTask(workflow, step, stepData);
        break;
      
      case 'notification_task':
        await this.handleNotificationTask(workflow, step, stepData);
        break;
      
      case 'payment_task':
        await this.handlePaymentTask(workflow, step, stepData);
        break;
      
      case 'completion_task':
        await this.handleCompletionTask(workflow, step, stepData);
        break;
      
      default:
        console.log(`Unknown step type: ${step.type}`);
    }
  }

  async handleFormSubmission(workflow, step, stepData) {
    // Store form data and send notifications
    if (step.notifications?.onCompletion) {
      await this.sendNotifications(step.notifications.onCompletion, workflow, stepData);
    }

    // Auto-advance if configured
    if (step.autoAdvance) {
      workflow.currentStepIndex++;
    }
  }

  async handleReviewTask(workflow, step, stepData) {
    const action = stepData.action;
    
    switch (action) {
      case 'approve':
        workflow.stepData[step.id].approved = true;
        if (step.autoAdvance) {
          workflow.currentStepIndex++;
        }
        break;
      
      case 'reject':
        workflow.stepData[step.id].rejected = true;
        workflow.status = 'REJECTED';
        break;
      
      case 'request_clarification':
        workflow.stepData[step.id].clarificationRequested = true;
        // Don't advance, wait for clarification
        break;
    }

    if (step.notifications?.onCompletion) {
      await this.sendNotifications(step.notifications.onCompletion, workflow, stepData);
    }
  }

  async handleAutomatedCheck(workflow, step, stepData) {
    const conditions = step.conditions || [];
    let allConditionsMet = true;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, workflow, stepData);
      if (!result) {
        allConditionsMet = false;
        workflow.status = 'FAILED';
        workflow.failureReason = condition.message;
        break;
      }
    }

    if (allConditionsMet && step.autoAdvance) {
      workflow.currentStepIndex++;
    }

    if (!allConditionsMet && step.notifications?.onFailure) {
      await this.sendNotifications(step.notifications.onFailure, workflow, stepData);
    }
  }

  async handleApprovalTask(workflow, step, stepData) {
    const decision = stepData.decision || stepData.action;
    
    workflow.stepData[step.id].decision = decision;
    workflow.stepData[step.id].decisionDate = new Date().toISOString();

    if (decision === 'approve') {
      if (step.autoAdvance) {
        workflow.currentStepIndex++;
      }
    } else if (decision === 'reject') {
      workflow.status = 'REJECTED';
    } else if (decision === 'waitlist') {
      workflow.status = 'WAITLISTED';
    }

    if (step.notifications?.onCompletion) {
      await this.sendNotifications(step.notifications.onCompletion, workflow, stepData);
    }
  }

  async handleNotificationTask(workflow, step, stepData) {
    if (step.notifications) {
      await this.sendNotifications(step.notifications, workflow, stepData);
    }
    
    if (step.autoAdvance) {
      workflow.currentStepIndex++;
    }
  }

  async handlePaymentTask(workflow, step, stepData) {
    // In a real implementation, integrate with payment gateway
    const paymentStatus = stepData.payment_status || 'pending';
    
    workflow.stepData[step.id].paymentStatus = paymentStatus;
    workflow.stepData[step.id].paymentDate = new Date().toISOString();

    if (paymentStatus === 'completed' && step.autoAdvance) {
      workflow.currentStepIndex++;
    }

    if (step.notifications?.onCompletion) {
      await this.sendNotifications(step.notifications.onCompletion, workflow, stepData);
    }
  }

  async handleCompletionTask(workflow, step, stepData) {
    // Execute completion actions (create student record, generate IDs, etc.)
    if (workflow.workflowId === 'student_admission') {
      await this.completeStudentAdmission(workflow, stepData);
    }

    if (step.autoAdvance) {
      workflow.currentStepIndex++;
    }

    if (step.notifications?.onCompletion) {
      await this.sendNotifications(step.notifications.onCompletion, workflow, stepData);
    }
  }

  async completeStudentAdmission(workflow, stepData) {
    try {
      // Create student record
      const studentData = {
        ...workflow.initialData,
        ...workflow.stepData.application_submission,
        status: 'ACTIVE'
      };

      // Generate admission number and create student
      const studentService = require('./student-service');
      const result = await studentService.createStudent(studentData, workflow.trustCode);
      
      workflow.stepData.enrollment_completion = {
        studentId: result.studentId,
        admissionNumber: result.admissionNo,
        enrollmentDate: new Date().toISOString()
      };

      console.log(`Student admission completed: ${result.admissionNo}`);
    } catch (error) {
      console.error('Error completing student admission:', error);
      workflow.status = 'FAILED';
      workflow.failureReason = error.message;
    }
  }

  async evaluateCondition(condition, workflow, stepData) {
    const { field, operator, value, message } = condition;
    
    // Get field value from workflow data
    const fieldValue = this.getFieldValue(field, workflow);

    switch (operator) {
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'equals':
        return fieldValue === value;
      case 'available':
        // Check capacity availability
        if (field === 'class_capacity') {
          return await this.checkClassCapacity(workflow);
        }
        return true;
      default:
        return true;
    }
  }

  async checkClassCapacity(workflow) {
    try {
      const classId = workflow.stepData.application_submission?.class_id;
      const sectionId = workflow.stepData.application_submission?.section_id;
      
      if (!classId || !sectionId) return true; // Can't check, assume available

      const sql = `
        SELECT s.capacity, COUNT(st.id) as current_count
        FROM sections s
        LEFT JOIN students st ON s.id = st.section_id AND st.status = 'ACTIVE'
        WHERE s.id = ?
        GROUP BY s.id
      `;

      const result = await db.queryTrust(workflow.trustCode, sql, [sectionId]);
      
      if (result.length === 0) return false;

      const { capacity, current_count } = result[0];
      return current_count < capacity;
    } catch (error) {
      console.error('Error checking class capacity:', error);
      return false;
    }
  }

  async sendNotifications(notifications, workflow, stepData) {
    // In a real implementation, integrate with notification service
    for (const notification of notifications) {
      console.log(`Sending ${notification} notification for workflow ${workflow.instanceId}`);
      
      // Here you would integrate with:
      // - Email service (SendGrid, AWS SES)
      // - SMS service (Twilio, AWS SNS)
      // - In-app notification system
    }
  }

  async validateStepData(step, stepData, trustCode) {
    const errors = [];

    for (const field of step.fields || []) {
      if (field.required && (!stepData[field] || stepData[field] === '')) {
        errors.push(`${field} is required`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getWorkflowConfig(workflowId, trustCode) {
    const baseConfig = workflowConfigs[workflowId];
    if (!baseConfig) return null;

    // Check for tenant-specific configuration
    if (baseConfig.tenantConfigs && baseConfig.tenantConfigs[trustCode]) {
      const tenantConfig = baseConfig.tenantConfigs[trustCode];
      
      // Merge tenant-specific configuration with default
      return {
        ...baseConfig.defaultConfig,
        ...tenantConfig,
        steps: this.mergeSteps(baseConfig.defaultConfig.steps, tenantConfig.steps || [])
      };
    }

    return baseConfig.defaultConfig;
  }

  mergeSteps(defaultSteps, tenantSteps) {
    const merged = [...defaultSteps];
    
    // Add or modify tenant-specific steps
    for (const tenantStep of tenantSteps) {
      const existingIndex = merged.findIndex(s => s.id === tenantStep.id);
      
      if (existingIndex >= 0) {
        // Replace existing step
        merged[existingIndex] = { ...merged[existingIndex], ...tenantStep };
      } else {
        // Add new step at the specified order
        merged.push(tenantStep);
      }
    }

    // Sort by order
    return merged.sort((a, b) => a.order - b.order);
  }

  getCurrentStep(workflow) {
    return workflow.config.steps[workflow.currentStepIndex];
  }

  isWorkflowComplete(workflow) {
    return workflow.currentStepIndex >= workflow.config.steps.length || 
           ['COMPLETED', 'REJECTED', 'FAILED'].includes(workflow.status);
  }

  async advanceWorkflow(workflow) {
    const currentStep = this.getCurrentStep(workflow);
    
    if (!currentStep) {
      return await this.completeWorkflow(workflow);
    }

    return {
      success: true,
      currentStep,
      status: workflow.status,
      progress: this.calculateProgress(workflow)
    };
  }

  async completeWorkflow(workflow) {
    workflow.status = 'COMPLETED';
    workflow.completedAt = new Date().toISOString();

    // Clean up from memory
    this.activeWorkflows.delete(workflow.instanceId);

    return {
      success: true,
      completed: true,
      workflowId: workflow.workflowId,
      status: workflow.status,
      result: workflow.stepData
    };
  }

  calculateProgress(workflow) {
    const total = workflow.config.steps.length;
    const completed = workflow.currentStepIndex;
    return Math.round((completed / total) * 100);
  }

  getFieldValue(fieldPath, workflow) {
    const pathParts = fieldPath.split('.');
    let value = workflow.stepData;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  generateWorkflowId() {
    return 'wf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getWorkflow(workflowInstanceId, trustCode) {
    const workflow = this.activeWorkflows.get(workflowInstanceId);
    if (!workflow || workflow.trustCode !== trustCode) {
      throw new Error('Workflow not found');
    }

    return {
      instanceId: workflow.instanceId,
      workflowId: workflow.workflowId,
      status: workflow.status,
      currentStep: this.getCurrentStep(workflow),
      progress: this.calculateProgress(workflow),
      stepData: workflow.stepData,
      startedAt: workflow.startedAt,
      lastActivity: workflow.lastActivity
    };
  }

  // Cleanup expired workflows
  cleanupExpiredWorkflows(maxAgeHours = 24) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [instanceId, workflow] of this.activeWorkflows.entries()) {
      if (new Date(workflow.lastActivity) < cutoff) {
        this.activeWorkflows.delete(instanceId);
      }
    }
  }

  getWorkflowStats() {
    const stats = {
      total: this.activeWorkflows.size,
      byStatus: {},
      byType: {}
    };

    for (const workflow of this.activeWorkflows.values()) {
      stats.byStatus[workflow.status] = (stats.byStatus[workflow.status] || 0) + 1;
      stats.byType[workflow.workflowId] = (stats.byType[workflow.workflowId] || 0) + 1;
    }

    return stats;
  }
}

module.exports = new WorkflowEngine();