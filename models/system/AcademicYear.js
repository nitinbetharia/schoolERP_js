/**
 * Academic Year Model
 * Handles academic year management functionality
 */
'use strict';

const database = require('./database');

/**
 * Academic Year Model Class
 */
class AcademicYear {
   constructor(data = {}) {
      this.year_id = data.year_id || null;
      this.year_name = data.year_name || '';
      this.start_date = data.start_date || null;
      this.end_date = data.end_date || null;
      this.is_active = data.is_active !== undefined ? data.is_active : false;
      this.tenant_id = data.tenant_id || null;
      this.created_at = data.created_at || null;
      this.updated_at = data.updated_at || null;
   }

   /**
    * Create new academic year
    */
   async create() {
      try {
         const sql = `
                INSERT INTO academic_years (year_name, start_date, end_date, is_active, tenant_id)
                VALUES (?, ?, ?, ?, ?)
            `;

         const result = await database.query(sql, [
            this.year_name,
            this.start_date,
            this.end_date,
            this.is_active,
            this.tenant_id,
         ]);

         this.year_id = result.insertId;
         return this;
      } catch (error) {
         throw new Error(`Failed to create academic year: ${error.message}`);
      }
   }

   /**
    * Find academic year by ID
    */
   static async findById(yearId, tenantId) {
      try {
         const sql = 'SELECT * FROM academic_years WHERE year_id = ? AND tenant_id = ?';
         const rows = await database.query(sql, [yearId, tenantId]);

         if (rows.length === 0) {
            return null;
         }

         return new AcademicYear(rows[0]);
      } catch (error) {
         throw new Error(`Failed to find academic year: ${error.message}`);
      }
   }

   /**
    * Get active academic year
    */
   static async getActive(tenantId) {
      try {
         const sql = 'SELECT * FROM academic_years WHERE is_active = 1 AND tenant_id = ?';
         const rows = await database.query(sql, [tenantId]);

         if (rows.length === 0) {
            return null;
         }

         return new AcademicYear(rows[0]);
      } catch (error) {
         throw new Error(`Failed to get active academic year: ${error.message}`);
      }
   }

   /**
    * Get all academic years for tenant
    */
   static async findAll(tenantId, options = {}) {
      try {
         let sql = 'SELECT * FROM academic_years WHERE tenant_id = ?';
         const params = [tenantId];

         if (options.orderBy) {
            sql += ` ORDER BY ${options.orderBy}`;
         } else {
            sql += ' ORDER BY start_date DESC';
         }

         if (options.limit) {
            sql += ' LIMIT ?';
            params.push(options.limit);
         }

         const rows = await database.query(sql, params);
         return rows.map((row) => new AcademicYear(row));
      } catch (error) {
         throw new Error(`Failed to get academic years: ${error.message}`);
      }
   }

   /**
    * Update academic year
    */
   async update() {
      try {
         const sql = `
                UPDATE academic_years 
                SET year_name = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW()
                WHERE year_id = ? AND tenant_id = ?
            `;

         await database.query(sql, [
            this.year_name,
            this.start_date,
            this.end_date,
            this.is_active,
            this.year_id,
            this.tenant_id,
         ]);

         return this;
      } catch (error) {
         throw new Error(`Failed to update academic year: ${error.message}`);
      }
   }

   /**
    * Delete academic year
    */
   async delete() {
      try {
         const sql = 'DELETE FROM academic_years WHERE year_id = ? AND tenant_id = ?';
         await database.query(sql, [this.year_id, this.tenant_id]);
         return true;
      } catch (error) {
         throw new Error(`Failed to delete academic year: ${error.message}`);
      }
   }

   /**
    * Validate academic year data
    */
   validate() {
      const errors = [];

      if (!this.year_name || this.year_name.trim() === '') {
         errors.push('Year name is required');
      }

      if (!this.start_date) {
         errors.push('Start date is required');
      }

      if (!this.end_date) {
         errors.push('End date is required');
      }

      if (this.start_date && this.end_date && new Date(this.start_date) >= new Date(this.end_date)) {
         errors.push('End date must be after start date');
      }

      if (!this.tenant_id) {
         errors.push('Tenant ID is required');
      }

      return {
         isValid: errors.length === 0,
         errors,
      };
   }

   /**
    * Convert to JSON
    */
   toJSON() {
      return {
         year_id: this.year_id,
         year_name: this.year_name,
         start_date: this.start_date,
         end_date: this.end_date,
         is_active: this.is_active,
         tenant_id: this.tenant_id,
         created_at: this.created_at,
         updated_at: this.updated_at,
      };
   }
}

module.exports = AcademicYear;
