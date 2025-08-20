const BoardComplianceService = require('../services/BoardComplianceService');
const logger = require('../../../utils/logger');
const {
   ErrorFactory,
   formatErrorResponse,
   getErrorStatusCode
} = require('../../../utils/errors');

/**
 * Board Compliance Controller
 * Handles HTTP requests for board affiliation and NEP adoption
 */
function createBoardComplianceController() {

   this.boardComplianceService = new BoardComplianceService();
   

   /**
    * getEffectiveNEPPolicy method
    */
   async function getEffectiveNEPPolicy() {

      try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'NEP_POLICY',
      event: 'Get effective NEP policy failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * setSchoolNEPPolicy method
    */
   async function setSchoolNEPPolicy() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;
      const nepConfig = req.body;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'NEP_POLICY',
      event: 'Set school NEP policy failed',
      school_id: req.params.schoolId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * setTrustNEPPolicy method
    */
   async function setTrustNEPPolicy() {

      try {
      const trustId = req.tenantId; // From middleware
      const userId = req.user?.id;
      const nepConfig = req.body;

      if (!trustId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_TRUST_ID',
      message: 'Valid trust context is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'NEP_POLICY',
      event: 'Set trust NEP policy failed',
      trust_id: req.tenantId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * getBoardCompliance method
    */
   async function getBoardCompliance() {

      try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'BOARD_COMPLIANCE',
      event: 'Get board compliance failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * setBoardAffiliation method
    */
   async function setBoardAffiliation() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;
      const boardConfig = req.body;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'BOARD_COMPLIANCE',
      event: 'Set board affiliation failed',
      school_id: req.params.schoolId,
      user_id: req.user?.id,
      error: error.message,
         
   }

   /**
    * getNEPComplianceReport method
    */
   async function getNEPComplianceReport() {

      try {
      const filters = {
      adoption_status: req.query.adoption_status,
         
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Board Compliance Controller Error', {
      controller: 'board-compliance-controller',
      category: 'REPORTS',
      event: 'Generate NEP compliance report failed',
      error: error.message,
         
   }

   /**
    * registerCBSEAffiliation method
    */
   async function registerCBSEAffiliation() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('CBSE Affiliation Registration Error', {
      controller: 'board-compliance-controller',
      category: 'CBSE_AFFILIATION',
      event: 'Register CBSE affiliation failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * updateCBSECompliance method
    */
   async function updateCBSECompliance() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('CBSE Compliance Update Error', {
      controller: 'board-compliance-controller',
      category: 'CBSE_COMPLIANCE',
      event: 'Update CBSE compliance failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * generateCBSETransferCertificate method
    */
   async function generateCBSETransferCertificate() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;

      if (!schoolId || !studentId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_PARAMETERS',
      message: 'Valid school ID and student ID are required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('CBSE Transfer Certificate Generation Error', {
      controller: 'board-compliance-controller',
      category: 'CBSE_TRANSFER_CERTIFICATE',
      event: 'Generate CBSE transfer certificate failed',
      school_id: req.params.schoolId,
      student_id: req.params.studentId,
      error: error.message,
         
   }

   /**
    * registerCISCEAffiliation method
    */
   async function registerCISCEAffiliation() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('CISCE Affiliation Registration Error', {
      controller: 'board-compliance-controller',
      category: 'CISCE_AFFILIATION',
      event: 'Register CISCE affiliation failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * generateCISCETransferCertificate method
    */
   async function generateCISCETransferCertificate() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const studentId = parseInt(req.params.studentId);
      const userId = req.user?.id;

      if (!schoolId || !studentId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_PARAMETERS',
      message: 'Valid school ID and student ID are required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('CISCE Transfer Certificate Generation Error', {
      controller: 'board-compliance-controller',
      category: 'CISCE_TRANSFER_CERTIFICATE',
      event: 'Generate CISCE transfer certificate failed',
      school_id: req.params.schoolId,
      student_id: req.params.studentId,
      error: error.message,
         
   }

   /**
    * registerStateBoardAffiliation method
    */
   async function registerStateBoardAffiliation() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('State Board Affiliation Registration Error', {
      controller: 'board-compliance-controller',
      category: 'STATE_BOARD_AFFILIATION',
      event: 'Register State Board affiliation failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * registerInternationalBoardAuthorization method
    */
   async function registerInternationalBoardAuthorization() {

      try {
      const schoolId = parseInt(req.params.schoolId);
      const userId = req.user?.id;

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('International Board Authorization Registration Error', {
      controller: 'board-compliance-controller',
      category: 'INTERNATIONAL_BOARD_AUTHORIZATION',
      event: 'Register International Board authorization failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   /**
    * getComprehensiveBoardComplianceReport method
    */
   async function getComprehensiveBoardComplianceReport() {

      try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId) {
      return res.status(400).json({
      success: false,
      error: {
      code: 'INVALID_SCHOOL_ID',
      message: 'Valid school ID is required',
               
   }

   /**
    * catch method
    */
   async function catch() {

      logger.error('Comprehensive Board Compliance Report Error', {
      controller: 'board-compliance-controller',
      category: 'COMPREHENSIVE_COMPLIANCE_REPORT',
      event: 'Get comprehensive board compliance report failed',
      school_id: req.params.schoolId,
      error: error.message,
         
   }

   return {
      getEffectiveNEPPolicy,
      catch,
      setSchoolNEPPolicy,
      catch,
      setTrustNEPPolicy,
      catch,
      getBoardCompliance,
      catch,
      setBoardAffiliation,
      catch,
      getNEPComplianceReport,
      catch,
      registerCBSEAffiliation,
      catch,
      updateCBSECompliance,
      catch,
      generateCBSETransferCertificate,
      catch,
      registerCISCEAffiliation,
      catch,
      generateCISCETransferCertificate,
      catch,
      registerStateBoardAffiliation,
      catch,
      registerInternationalBoardAuthorization,
      catch,
      getComprehensiveBoardComplianceReport,
      catch
   };
}

module.exports = BoardComplianceController;
