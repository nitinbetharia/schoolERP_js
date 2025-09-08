const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const csv = require('csv-parser');
const fs = require('fs').promises;

/**
 * Inventory Management Service
 * Complete inventory operations including stock management, procurement, and asset tracking
 * Phase 7 Implementation - Inventory Management System
 */

class InventoryService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all inventory items with advanced filtering and pagination
    * @param {Object} filters - Search and filter options
    * @param {Object} pagination - Page, limit, sort options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Inventory items data with pagination info
    */
   async getAllItems(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            search = '',
            category = '',
            subcategory = '',
            status = '',
            location = '',
            low_stock_only = false,
            supplier = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (search) {
            whereConditions[Op.or] = [
               { name: { [Op.like]: `%${search}%` } },
               { description: { [Op.like]: `%${search}%` } },
               { item_code: { [Op.like]: `%${search}%` } },
               { brand: { [Op.like]: `%${search}%` } },
               { model: { [Op.like]: `%${search}%` } },
            ];
         }

         if (category) {
            whereConditions.category = category;
         }

         if (subcategory) {
            whereConditions.subcategory = subcategory;
         }

         if (status) {
            whereConditions.status = status;
         }

         if (location) {
            whereConditions.location = { [Op.like]: `%${location}%` };
         }

         if (supplier) {
            whereConditions.supplier = { [Op.like]: `%${supplier}%` };
         }

         // Add low stock filter
         if (low_stock_only) {
            whereConditions[Op.and] = [
               this.models.sequelize.where(
                  this.models.sequelize.col('current_stock'),
                  '<=',
                  this.models.sequelize.col('minimum_stock')
               ),
            ];
         }

         const { count, rows: items } = await this.models.InventoryItem.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            include: [
               {
                  model: this.models.InventoryTransaction,
                  as: 'transactions',
                  limit: 5,
                  order: [['created_at', 'DESC']],
                  required: false,
                  include: [
                     {
                        model: this.models.User,
                        as: 'user',
                        attributes: ['id', 'first_name', 'last_name'],
                     },
                  ],
               },
            ],
         });

         // Calculate stock status for each item
         const itemsWithStatus = items.map((item) => {
            const itemData = item.toJSON();
            itemData.stock_status = this.calculateStockStatus(
               itemData.current_stock,
               itemData.minimum_stock,
               itemData.maximum_stock
            );
            itemData.stock_value = itemData.current_stock * (itemData.unit_price || 0);
            return itemData;
         });

         return {
            items: itemsWithStatus,
            pagination: {
               page: parseInt(page),
               limit: parseInt(limit),
               total: count,
               pages: Math.ceil(count / limit),
               hasNext: page < Math.ceil(count / limit),
               hasPrev: page > 1,
            },
         };
      } catch (error) {
         logError(error, { context: 'InventoryService.getAllItems', tenantCode });
         throw error;
      }
   }

   /**
    * Create a new inventory item
    * @param {Object} itemData - Item information
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Created item
    */
   async createItem(itemData, tenantCode = null) {
      try {
         // Check for existing item with same code
         if (itemData.item_code) {
            const existingItem = await this.models.InventoryItem.findOne({
               where: {
                  item_code: itemData.item_code,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (existingItem) {
               throw new Error(`Item with code ${itemData.item_code} already exists`);
            }
         }

         // Generate item code if not provided
         if (!itemData.item_code) {
            itemData.item_code = await this.generateItemCode(itemData.category, tenantCode);
         }

         // Set tenant code
         if (tenantCode) {
            itemData.tenant_code = tenantCode;
         }

         // Set default values
         itemData.status = itemData.status || 'ACTIVE';
         itemData.current_stock = itemData.current_stock || 0;
         itemData.minimum_stock = itemData.minimum_stock || 0;
         itemData.maximum_stock = itemData.maximum_stock || 0;

         const item = await this.models.InventoryItem.create(itemData);

         // Create initial stock entry if current_stock > 0
         if (itemData.current_stock > 0) {
            await this.createTransaction(
               {
                  item_id: item.id,
                  transaction_type: 'STOCK_IN',
                  quantity: itemData.current_stock,
                  unit_price: itemData.unit_price || 0,
                  reference_type: 'INITIAL_STOCK',
                  reference_number: `INIT-${item.item_code}`,
                  remarks: 'Initial stock entry',
                  user_id: itemData.created_by,
               },
               tenantCode
            );
         }

         return item.toJSON();
      } catch (error) {
         logError(error, { context: 'InventoryService.createItem', tenantCode });
         throw error;
      }
   }

   /**
    * Update inventory item
    * @param {number} itemId - Item ID
    * @param {Object} updateData - Updated item data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Updated item
    */
   async updateItem(itemId, updateData, tenantCode = null) {
      try {
         const whereConditions = {
            id: itemId,
            ...(tenantCode && { tenant_code: tenantCode }),
         };

         const item = await this.models.InventoryItem.findOne({ where: whereConditions });

         if (!item) {
            throw new Error('Inventory item not found');
         }

         // Check item code uniqueness if being updated
         if (updateData.item_code && updateData.item_code !== item.item_code) {
            const existingItem = await this.models.InventoryItem.findOne({
               where: {
                  item_code: updateData.item_code,
                  id: { [Op.ne]: itemId },
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (existingItem) {
               throw new Error(`Another item with code ${updateData.item_code} already exists`);
            }
         }

         await item.update(updateData);
         return item.toJSON();
      } catch (error) {
         logError(error, { context: 'InventoryService.updateItem', itemId, tenantCode });
         throw error;
      }
   }

   /**
    * Create inventory transaction (stock in/out, adjustment)
    * @param {Object} transactionData - Transaction details
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Transaction record
    */
   async createTransaction(transactionData, tenantCode = null) {
      const transaction = await this.models.sequelize.transaction();

      try {
         // Get current item
         const item = await this.models.InventoryItem.findOne({
            where: {
               id: transactionData.item_id,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            transaction,
         });

         if (!item) {
            throw new Error('Inventory item not found');
         }

         // Validate transaction
         const { transaction_type, quantity } = transactionData;

         if (transaction_type === 'STOCK_OUT' && item.current_stock < quantity) {
            throw new Error(`Insufficient stock. Available: ${item.current_stock}, Requested: ${quantity}`);
         }

         // Calculate new stock level
         let newStock = item.current_stock;
         switch (transaction_type) {
            case 'STOCK_IN':
            case 'PURCHASE':
            case 'TRANSFER_IN':
            case 'ADJUSTMENT_IN':
               newStock += quantity;
               break;
            case 'STOCK_OUT':
            case 'ISSUE':
            case 'TRANSFER_OUT':
            case 'ADJUSTMENT_OUT':
            case 'DAMAGED':
            case 'LOST':
               newStock -= quantity;
               break;
            default:
               throw new Error(`Invalid transaction type: ${transaction_type}`);
         }

         // Create transaction record
         const inventoryTransaction = await this.models.InventoryTransaction.create(
            {
               ...transactionData,
               previous_stock: item.current_stock,
               new_stock: newStock,
               transaction_date: transactionData.transaction_date || new Date(),
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            { transaction }
         );

         // Update item stock
         await item.update(
            {
               current_stock: newStock,
               last_updated: new Date(),
            },
            { transaction }
         );

         await transaction.commit();
         return inventoryTransaction.toJSON();
      } catch (error) {
         await transaction.rollback();
         logError(error, { context: 'InventoryService.createTransaction', tenantCode });
         throw error;
      }
   }

   /**
    * Get inventory transactions with filtering
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Transactions with pagination
    */
   async getTransactions(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            item_id = '',
            transaction_type = '',
            reference_type = '',
            date_from = '',
            date_to = '',
            user_id = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'transaction_date', sortOrder = 'DESC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (item_id) {
            whereConditions.item_id = item_id;
         }

         if (transaction_type) {
            whereConditions.transaction_type = transaction_type;
         }

         if (reference_type) {
            whereConditions.reference_type = reference_type;
         }

         if (user_id) {
            whereConditions.user_id = user_id;
         }

         if (date_from || date_to) {
            const dateConditions = {};
            if (date_from) {
               dateConditions[Op.gte] = new Date(date_from);
            }
            if (date_to) {
               dateConditions[Op.lte] = new Date(date_to);
            }
            whereConditions.transaction_date = dateConditions;
         }

         const { count, rows: transactions } = await this.models.InventoryTransaction.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            include: [
               {
                  model: this.models.InventoryItem,
                  as: 'item',
                  attributes: ['name', 'item_code', 'category', 'unit'],
               },
               {
                  model: this.models.User,
                  as: 'user',
                  attributes: ['first_name', 'last_name'],
                  required: false,
               },
            ],
         });

         return {
            transactions: transactions.map((t) => t.toJSON()),
            pagination: {
               page: parseInt(page),
               limit: parseInt(limit),
               total: count,
               pages: Math.ceil(count / limit),
               hasNext: page < Math.ceil(count / limit),
               hasPrev: page > 1,
            },
         };
      } catch (error) {
         logError(error, { context: 'InventoryService.getTransactions', tenantCode });
         throw error;
      }
   }

   /**
    * Get inventory statistics and analytics
    * @param {Object} filters - Date and other filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Inventory statistics
    */
   async getInventoryStatistics(filters = {}, tenantCode = null) {
      try {
         const { date_from = '', date_to = '', category = '' } = filters;

         const whereConditions = {
            ...(tenantCode && { tenant_code: tenantCode }),
         };

         // Category filter
         if (category) {
            whereConditions.category = category;
         }

         // Build date conditions for transactions
         const transactionDateConditions = {};
         if (date_from || date_to) {
            if (date_from) {
               transactionDateConditions[Op.gte] = new Date(date_from);
            }
            if (date_to) {
               transactionDateConditions[Op.lte] = new Date(date_to);
            }
         }

         // Basic inventory counts
         const [totalItems, activeItems, lowStockItems, outOfStockItems] = await Promise.all([
            this.models.InventoryItem.count({ where: whereConditions }),
            this.models.InventoryItem.count({ where: { ...whereConditions, status: 'ACTIVE' } }),
            this.models.InventoryItem.count({
               where: {
                  ...whereConditions,
                  [Op.and]: [
                     this.models.sequelize.where(
                        this.models.sequelize.col('current_stock'),
                        '<=',
                        this.models.sequelize.col('minimum_stock')
                     ),
                     { current_stock: { [Op.gt]: 0 } },
                  ],
               },
            }),
            this.models.InventoryItem.count({
               where: { ...whereConditions, current_stock: 0 },
            }),
         ]);

         // Transaction statistics
         const transactionWhere = {
            ...(tenantCode && { tenant_code: tenantCode }),
            ...(Object.keys(transactionDateConditions).length > 0 && {
               transaction_date: transactionDateConditions,
            }),
         };

         const [stockInTransactions, stockOutTransactions] = await Promise.all([
            this.models.InventoryTransaction.count({
               where: {
                  ...transactionWhere,
                  transaction_type: { [Op.in]: ['STOCK_IN', 'PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN'] },
               },
            }),
            this.models.InventoryTransaction.count({
               where: {
                  ...transactionWhere,
                  transaction_type: { [Op.in]: ['STOCK_OUT', 'ISSUE', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'] },
               },
            }),
         ]);

         // Stock value calculation
         const stockValue = await this.models.InventoryItem.findAll({
            attributes: [
               [
                  this.models.sequelize.fn(
                     'SUM',
                     this.models.sequelize.literal('current_stock * COALESCE(unit_price, 0)')
                  ),
                  'total_value',
               ],
            ],
            where: whereConditions,
            raw: true,
         });

         // Category-wise breakdown
         const categoryStats = await this.models.InventoryItem.findAll({
            attributes: [
               'category',
               [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'item_count'],
               [this.models.sequelize.fn('SUM', this.models.sequelize.col('current_stock')), 'total_stock'],
               [
                  this.models.sequelize.fn(
                     'SUM',
                     this.models.sequelize.literal('current_stock * COALESCE(unit_price, 0)')
                  ),
                  'category_value',
               ],
            ],
            where: whereConditions,
            group: ['category'],
            order: [[this.models.sequelize.literal('item_count'), 'DESC']],
         });

         // Top consumed items
         const topConsumed = await this.models.InventoryTransaction.findAll({
            attributes: [
               'item_id',
               [this.models.sequelize.fn('SUM', this.models.sequelize.col('quantity')), 'total_consumed'],
            ],
            where: {
               ...transactionWhere,
               transaction_type: { [Op.in]: ['STOCK_OUT', 'ISSUE'] },
            },
            group: ['item_id'],
            order: [[this.models.sequelize.literal('total_consumed'), 'DESC']],
            limit: 10,
            include: [
               {
                  model: this.models.InventoryItem,
                  as: 'item',
                  attributes: ['name', 'item_code', 'category', 'unit'],
               },
            ],
         });

         return {
            overview: {
               total_items: totalItems,
               active_items: activeItems,
               low_stock_items: lowStockItems,
               out_of_stock_items: outOfStockItems,
               total_stock_value: parseFloat(stockValue[0]?.total_value || 0),
            },
            transactions: {
               stock_in_count: stockInTransactions,
               stock_out_count: stockOutTransactions,
               total_transactions: stockInTransactions + stockOutTransactions,
            },
            category_breakdown: categoryStats.map((item) => ({
               category: item.category,
               item_count: parseInt(item.dataValues.item_count),
               total_stock: parseInt(item.dataValues.total_stock || 0),
               category_value: parseFloat(item.dataValues.category_value || 0),
            })),
            top_consumed: topConsumed.map((item) => ({
               ...item.item.toJSON(),
               total_consumed: parseInt(item.dataValues.total_consumed),
            })),
         };
      } catch (error) {
         logError(error, { context: 'InventoryService.getInventoryStatistics', tenantCode });
         throw error;
      }
   }

   /**
    * Generate item code for new inventory items
    * @param {string} category - Item category
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} Item code
    */
   async generateItemCode(category, tenantCode = null) {
      try {
         const categoryPrefix = this.getCategoryPrefix(category);
         const currentYear = new Date().getFullYear().toString().slice(-2);
         const prefix = `${categoryPrefix}${currentYear}`;

         const lastItem = await this.models.InventoryItem.findOne({
            where: {
               item_code: { [Op.like]: `${prefix}%` },
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            order: [['item_code', 'DESC']],
         });

         let nextNumber = 1;
         if (lastItem && lastItem.item_code) {
            const lastNumber = parseInt(lastItem.item_code.replace(prefix, ''));
            nextNumber = lastNumber + 1;
         }

         return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      } catch (error) {
         logError(error, { context: 'InventoryService.generateItemCode', tenantCode });
         throw error;
      }
   }

   /**
    * Get category prefix for item codes
    * @param {string} category - Category name
    * @returns {string} Category prefix
    */
   getCategoryPrefix(category) {
      const prefixes = {
         FURNITURE: 'FUR',
         ELECTRONICS: 'ELC',
         STATIONERY: 'STN',
         SPORTS: 'SPT',
         LABORATORY: 'LAB',
         BOOKS: 'BKS',
         CONSUMABLES: 'CON',
         MAINTENANCE: 'MNT',
         GENERAL: 'GEN',
      };

      return prefixes[category] || 'ITM';
   }

   /**
    * Calculate stock status based on current, minimum, and maximum levels
    * @param {number} currentStock - Current stock level
    * @param {number} minimumStock - Minimum stock level
    * @param {number} maximumStock - Maximum stock level
    * @returns {string} Stock status
    */
   calculateStockStatus(currentStock, minimumStock, maximumStock) {
      if (currentStock === 0) {
         return 'OUT_OF_STOCK';
      } else if (currentStock <= minimumStock) {
         return 'LOW_STOCK';
      } else if (maximumStock > 0 && currentStock >= maximumStock) {
         return 'OVERSTOCK';
      } else {
         return 'NORMAL';
      }
   }

   /**
    * Bulk import inventory items from CSV
    * @param {string} filePath - Path to CSV file
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Import results
    */
   async importItemsFromCSV(filePath, tenantCode = null) {
      try {
         const items = [];
         const errors = [];
         let lineNumber = 1;

         return new Promise((resolve) => {
            require('fs')
               .createReadStream(filePath)
               .pipe(csv())
               .on('data', (data) => {
                  lineNumber++;
                  try {
                     // Validate required fields
                     if (!data.name || !data.category) {
                        errors.push(`Line ${lineNumber}: Name and Category are required`);
                        return;
                     }

                     const itemData = {
                        name: data.name.trim(),
                        description: data.description ? data.description.trim() : '',
                        category: data.category.trim().toUpperCase(),
                        subcategory: data.subcategory ? data.subcategory.trim() : '',
                        unit: data.unit ? data.unit.trim() : 'PIECES',
                        minimum_stock: data.minimum_stock ? parseInt(data.minimum_stock) : 0,
                        maximum_stock: data.maximum_stock ? parseInt(data.maximum_stock) : 0,
                        current_stock: data.current_stock ? parseInt(data.current_stock) : 0,
                        unit_price: data.unit_price ? parseFloat(data.unit_price) : null,
                        supplier: data.supplier ? data.supplier.trim() : '',
                        location: data.location ? data.location.trim() : '',
                        brand: data.brand ? data.brand.trim() : '',
                        model: data.model ? data.model.trim() : '',
                        ...(tenantCode && { tenant_code: tenantCode }),
                     };

                     items.push(itemData);
                  } catch (error) {
                     errors.push(`Line ${lineNumber}: ${error.message}`);
                  }
               })
               .on('end', async () => {
                  try {
                     const results = {
                        total_processed: items.length,
                        successful: 0,
                        failed: 0,
                        errors: [...errors],
                     };

                     for (const itemData of items) {
                        try {
                           await this.createItem(itemData, tenantCode);
                           results.successful++;
                        } catch (error) {
                           results.failed++;
                           results.errors.push(`Item "${itemData.name}": ${error.message}`);
                        }
                     }

                     resolve(results);
                  } catch (error) {
                     resolve({ error: error.message });
                  }
               });
         });
      } catch (error) {
         logError(error, { context: 'InventoryService.importItemsFromCSV', tenantCode });
         throw error;
      }
   }

   /**
    * Export inventory items to CSV format
    * @param {Object} filters - Export filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} CSV data
    */
   async exportItemsToCSV(filters = {}, tenantCode = null) {
      try {
         const { items } = await this.getAllItems(filters, { page: 1, limit: 10000 }, tenantCode);

         const headers = [
            'Item Code',
            'Name',
            'Description',
            'Category',
            'Subcategory',
            'Unit',
            'Current Stock',
            'Minimum Stock',
            'Maximum Stock',
            'Unit Price',
            'Stock Value',
            'Supplier',
            'Location',
            'Brand',
            'Model',
            'Status',
         ];

         let csv = headers.join(',') + '\n';

         items.forEach((item) => {
            const row = [
               `"${item.item_code || ''}"`,
               `"${item.name || ''}"`,
               `"${item.description || ''}"`,
               `"${item.category || ''}"`,
               `"${item.subcategory || ''}"`,
               `"${item.unit || ''}"`,
               item.current_stock || 0,
               item.minimum_stock || 0,
               item.maximum_stock || 0,
               item.unit_price || '',
               item.stock_value || 0,
               `"${item.supplier || ''}"`,
               `"${item.location || ''}"`,
               `"${item.brand || ''}"`,
               `"${item.model || ''}"`,
               `"${item.status || ''}"`,
            ];
            csv += row.join(',') + '\n';
         });

         return csv;
      } catch (error) {
         logError(error, { context: 'InventoryService.exportItemsToCSV', tenantCode });
         throw error;
      }
   }
}

module.exports = InventoryService;
