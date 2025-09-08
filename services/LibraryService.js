const { Op } = require('sequelize');
const { logError } = require('../utils/logger');
const csv = require('csv-parser');
const fs = require('fs').promises;

/**
 * Library Management Service
 * Complete library operations including book catalog, circulation, and member management
 * Phase 6 Implementation - Library Management System
 */

class LibraryService {
   constructor(models) {
      this.models = models;
   }

   /**
    * Get all books with advanced filtering and pagination
    * @param {Object} filters - Search and filter options
    * @param {Object} pagination - Page, limit, sort options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Books data with pagination info
    */
   async getAllBooks(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            search = '',
            category = '',
            author = '',
            publisher = '',
            status = '',
            isbn = '',
            publication_year = '',
         } = filters;

         const { page = 1, limit = 20, sortBy = 'title', sortOrder = 'ASC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (search) {
            whereConditions[Op.or] = [
               { title: { [Op.like]: `%${search}%` } },
               { author: { [Op.like]: `%${search}%` } },
               { isbn: { [Op.like]: `%${search}%` } },
               { publisher: { [Op.like]: `%${search}%` } },
               { description: { [Op.like]: `%${search}%` } },
            ];
         }

         if (category) {
            whereConditions.category = category;
         }

         if (author) {
            whereConditions.author = { [Op.like]: `%${author}%` };
         }

         if (publisher) {
            whereConditions.publisher = { [Op.like]: `%${publisher}%` };
         }

         if (status) {
            whereConditions.status = status;
         }

         if (isbn) {
            whereConditions.isbn = { [Op.like]: `%${isbn}%` };
         }

         if (publication_year) {
            whereConditions.publication_year = publication_year;
         }

         const { count, rows: books } = await this.models.Book.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            include: [
               {
                  model: this.models.BookCirculation,
                  as: 'circulations',
                  required: false,
                  where: { status: 'ISSUED' },
                  include: [
                     {
                        model: this.models.Student,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name', 'admission_number'],
                     },
                  ],
               },
            ],
         });

         // Calculate availability status for each book
         const booksWithAvailability = books.map((book) => {
            const bookData = book.toJSON();
            const issuedCopies = bookData.circulations ? bookData.circulations.length : 0;
            bookData.available_copies = bookData.total_copies - issuedCopies;
            bookData.is_available = bookData.available_copies > 0;
            return bookData;
         });

         return {
            books: booksWithAvailability,
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
         logError(error, { context: 'LibraryService.getAllBooks', tenantCode });
         throw error;
      }
   }

   /**
    * Create a new book in the catalog
    * @param {Object} bookData - Book information
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Created book
    */
   async createBook(bookData, tenantCode = null) {
      try {
         // Check for existing book with same ISBN
         if (bookData.isbn) {
            const existingBook = await this.models.Book.findOne({
               where: {
                  isbn: bookData.isbn,
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (existingBook) {
               throw new Error(`Book with ISBN ${bookData.isbn} already exists in the catalog`);
            }
         }

         // Generate book accession number if not provided
         if (!bookData.accession_number) {
            bookData.accession_number = await this.generateAccessionNumber(tenantCode);
         }

         // Set tenant code
         if (tenantCode) {
            bookData.tenant_code = tenantCode;
         }

         // Set default values
         bookData.status = bookData.status || 'AVAILABLE';
         bookData.total_copies = bookData.total_copies || 1;

         const book = await this.models.Book.create(bookData);
         return book.toJSON();
      } catch (error) {
         logError(error, { context: 'LibraryService.createBook', tenantCode });
         throw error;
      }
   }

   /**
    * Update book information
    * @param {number} bookId - Book ID
    * @param {Object} updateData - Updated book data
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Updated book
    */
   async updateBook(bookId, updateData, tenantCode = null) {
      try {
         const whereConditions = {
            id: bookId,
            ...(tenantCode && { tenant_code: tenantCode }),
         };

         const book = await this.models.Book.findOne({ where: whereConditions });

         if (!book) {
            throw new Error('Book not found');
         }

         // Check ISBN uniqueness if being updated
         if (updateData.isbn && updateData.isbn !== book.isbn) {
            const existingBook = await this.models.Book.findOne({
               where: {
                  isbn: updateData.isbn,
                  id: { [Op.ne]: bookId },
                  ...(tenantCode && { tenant_code: tenantCode }),
               },
            });

            if (existingBook) {
               throw new Error(`Another book with ISBN ${updateData.isbn} already exists`);
            }
         }

         await book.update(updateData);
         return book.toJSON();
      } catch (error) {
         logError(error, { context: 'LibraryService.updateBook', bookId, tenantCode });
         throw error;
      }
   }

   /**
    * Issue a book to a student
    * @param {number} bookId - Book ID
    * @param {number} studentId - Student ID
    * @param {Object} circulationData - Circulation details
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Circulation record
    */
   async issueBook(bookId, studentId, circulationData = {}, tenantCode = null) {
      try {
         // Check book availability
         const book = await this.models.Book.findOne({
            where: {
               id: bookId,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            include: [
               {
                  model: this.models.BookCirculation,
                  as: 'circulations',
                  where: { status: 'ISSUED' },
                  required: false,
               },
            ],
         });

         if (!book) {
            throw new Error('Book not found');
         }

         if (book.status !== 'AVAILABLE') {
            throw new Error('Book is not available for circulation');
         }

         const issuedCopies = book.circulations ? book.circulations.length : 0;
         if (issuedCopies >= book.total_copies) {
            throw new Error('All copies of this book are currently issued');
         }

         // Check student eligibility
         const student = await this.models.Student.findOne({
            where: {
               id: studentId,
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (!student) {
            throw new Error('Student not found');
         }

         // Check if student has overdue books
         const overdueBooks = await this.models.BookCirculation.findAll({
            where: {
               student_id: studentId,
               status: 'ISSUED',
               due_date: { [Op.lt]: new Date() },
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         if (overdueBooks.length > 0) {
            throw new Error('Student has overdue books. Cannot issue new books until returned.');
         }

         // Check maximum book limit per student
         const issuedToStudent = await this.models.BookCirculation.count({
            where: {
               student_id: studentId,
               status: 'ISSUED',
               ...(tenantCode && { tenant_code: tenantCode }),
            },
         });

         const maxBooks = 3; // Default limit, should be configurable
         if (issuedToStudent >= maxBooks) {
            throw new Error(`Student has reached the maximum limit of ${maxBooks} books`);
         }

         // Create circulation record
         const issueDate = circulationData.issue_date || new Date();
         const dueDate = circulationData.due_date || this.calculateDueDate(issueDate);

         const circulation = await this.models.BookCirculation.create({
            book_id: bookId,
            student_id: studentId,
            issue_date: issueDate,
            due_date: dueDate,
            status: 'ISSUED',
            issued_by: circulationData.issued_by,
            remarks: circulationData.remarks || '',
            ...(tenantCode && { tenant_code: tenantCode }),
         });

         return circulation.toJSON();
      } catch (error) {
         logError(error, { context: 'LibraryService.issueBook', bookId, studentId, tenantCode });
         throw error;
      }
   }

   /**
    * Return a book from circulation
    * @param {number} circulationId - Circulation ID
    * @param {Object} returnData - Return details
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Updated circulation record
    */
   async returnBook(circulationId, returnData = {}, tenantCode = null) {
      try {
         const circulation = await this.models.BookCirculation.findOne({
            where: {
               id: circulationId,
               status: 'ISSUED',
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            include: [
               {
                  model: this.models.Book,
                  as: 'book',
                  attributes: ['title', 'author'],
               },
               {
                  model: this.models.Student,
                  as: 'student',
                  attributes: ['first_name', 'last_name', 'admission_number'],
               },
            ],
         });

         if (!circulation) {
            throw new Error('Active circulation record not found');
         }

         const returnDate = returnData.return_date || new Date();

         // Calculate fine if overdue
         let fineAmount = 0;
         if (returnDate > circulation.due_date) {
            const overdueDays = Math.ceil((returnDate - circulation.due_date) / (1000 * 60 * 60 * 24));
            fineAmount = overdueDays * 1; // $1 per day fine
         }

         // Update circulation record
         await circulation.update({
            return_date: returnDate,
            status: 'RETURNED',
            fine_amount: fineAmount,
            condition_on_return: returnData.condition || 'GOOD',
            return_remarks: returnData.remarks || '',
            returned_by: returnData.returned_by,
         });

         return circulation.toJSON();
      } catch (error) {
         logError(error, { context: 'LibraryService.returnBook', circulationId, tenantCode });
         throw error;
      }
   }

   /**
    * Get circulation history with filtering
    * @param {Object} filters - Filter criteria
    * @param {Object} pagination - Pagination options
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Circulation records with pagination
    */
   async getCirculationHistory(filters = {}, pagination = {}, tenantCode = null) {
      try {
         const {
            student_id = '',
            book_id = '',
            status = '',
            date_from = '',
            date_to = '',
            overdue_only = false,
         } = filters;

         const { page = 1, limit = 20, sortBy = 'issue_date', sortOrder = 'DESC' } = pagination;

         const offset = (page - 1) * limit;

         // Build where conditions
         const whereConditions = {};

         if (tenantCode) {
            whereConditions.tenant_code = tenantCode;
         }

         if (student_id) {
            whereConditions.student_id = student_id;
         }

         if (book_id) {
            whereConditions.book_id = book_id;
         }

         if (status) {
            whereConditions.status = status;
         }

         if (date_from || date_to) {
            const dateConditions = {};
            if (date_from) {
               dateConditions[Op.gte] = new Date(date_from);
            }
            if (date_to) {
               dateConditions[Op.lte] = new Date(date_to);
            }
            whereConditions.issue_date = dateConditions;
         }

         if (overdue_only) {
            whereConditions.status = 'ISSUED';
            whereConditions.due_date = { [Op.lt]: new Date() };
         }

         const { count, rows: circulations } = await this.models.BookCirculation.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: offset,
            order: [[sortBy, sortOrder.toUpperCase()]],
            include: [
               {
                  model: this.models.Book,
                  as: 'book',
                  attributes: ['title', 'author', 'isbn', 'accession_number'],
               },
               {
                  model: this.models.Student,
                  as: 'student',
                  attributes: ['first_name', 'last_name', 'admission_number'],
                  include: [
                     {
                        model: this.models.Class,
                        as: 'class',
                        attributes: ['name', 'standard'],
                     },
                  ],
               },
            ],
         });

         return {
            circulations: circulations.map((c) => c.toJSON()),
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
         logError(error, { context: 'LibraryService.getCirculationHistory', tenantCode });
         throw error;
      }
   }

   /**
    * Get library statistics and analytics
    * @param {Object} filters - Date and other filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Library statistics
    */
   async getLibraryStatistics(filters = {}, tenantCode = null) {
      try {
         const { date_from = '', date_to = '' } = filters;

         // Build date conditions
         const dateConditions = {};
         if (date_from || date_to) {
            if (date_from) {
               dateConditions[Op.gte] = new Date(date_from);
            }
            if (date_to) {
               dateConditions[Op.lte] = new Date(date_to);
            }
         }

         const whereConditions = {
            ...(tenantCode && { tenant_code: tenantCode }),
         };

         // Total books and availability
         const [totalBooks, availableBooks, issuedBooks] = await Promise.all([
            this.models.Book.count({ where: whereConditions }),
            this.models.Book.count({ where: { ...whereConditions, status: 'AVAILABLE' } }),
            this.models.BookCirculation.count({
               where: { ...whereConditions, status: 'ISSUED' },
            }),
         ]);

         // Circulation statistics
         const circulationWhere = {
            ...whereConditions,
            ...(Object.keys(dateConditions).length > 0 && { issue_date: dateConditions }),
         };

         const [totalIssued, totalReturned, overdueBooks] = await Promise.all([
            this.models.BookCirculation.count({
               where: { ...circulationWhere, status: 'ISSUED' },
            }),
            this.models.BookCirculation.count({
               where: { ...circulationWhere, status: 'RETURNED' },
            }),
            this.models.BookCirculation.count({
               where: {
                  ...whereConditions,
                  status: 'ISSUED',
                  due_date: { [Op.lt]: new Date() },
               },
            }),
         ]);

         // Popular books
         const popularBooks = await this.models.BookCirculation.findAll({
            attributes: [
               'book_id',
               [this.models.sequelize.fn('COUNT', this.models.sequelize.col('book_id')), 'circulation_count'],
            ],
            where: circulationWhere,
            group: ['book_id'],
            order: [[this.models.sequelize.literal('circulation_count'), 'DESC']],
            limit: 10,
            include: [
               {
                  model: this.models.Book,
                  as: 'book',
                  attributes: ['title', 'author', 'category'],
               },
            ],
         });

         // Category-wise distribution
         const categoryStats = await this.models.Book.findAll({
            attributes: [
               'category',
               [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'book_count'],
            ],
            where: whereConditions,
            group: ['category'],
            order: [[this.models.sequelize.literal('book_count'), 'DESC']],
         });

         return {
            overview: {
               total_books: totalBooks,
               available_books: availableBooks,
               issued_books: issuedBooks,
               overdue_books: overdueBooks,
               utilization_rate: totalBooks > 0 ? ((issuedBooks / totalBooks) * 100).toFixed(2) : 0,
            },
            circulation: {
               total_issued: totalIssued,
               total_returned: totalReturned,
               currently_issued: issuedBooks,
               overdue_count: overdueBooks,
            },
            popular_books: popularBooks.map((item) => ({
               ...item.book.toJSON(),
               circulation_count: parseInt(item.dataValues.circulation_count),
            })),
            category_distribution: categoryStats.map((item) => ({
               category: item.category,
               book_count: parseInt(item.dataValues.book_count),
            })),
         };
      } catch (error) {
         logError(error, { context: 'LibraryService.getLibraryStatistics', tenantCode });
         throw error;
      }
   }

   /**
    * Generate accession number for new books
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} Accession number
    */
   async generateAccessionNumber(tenantCode = null) {
      try {
         const currentYear = new Date().getFullYear();
         const prefix = `ACC${currentYear}`;

         const lastBook = await this.models.Book.findOne({
            where: {
               accession_number: { [Op.like]: `${prefix}%` },
               ...(tenantCode && { tenant_code: tenantCode }),
            },
            order: [['accession_number', 'DESC']],
         });

         let nextNumber = 1;
         if (lastBook && lastBook.accession_number) {
            const lastNumber = parseInt(lastBook.accession_number.replace(prefix, ''));
            nextNumber = lastNumber + 1;
         }

         return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      } catch (error) {
         logError(error, { context: 'LibraryService.generateAccessionNumber', tenantCode });
         throw error;
      }
   }

   /**
    * Calculate due date for book issue
    * @param {Date} issueDate - Issue date
    * @returns {Date} Due date
    */
   calculateDueDate(issueDate) {
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
      return dueDate;
   }

   /**
    * Bulk import books from CSV
    * @param {string} filePath - Path to CSV file
    * @param {string} tenantCode - Tenant identifier
    * @returns {Object} Import results
    */
   async importBooksFromCSV(filePath, tenantCode = null) {
      try {
         const books = [];
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
                     if (!data.title || !data.author) {
                        errors.push(`Line ${lineNumber}: Title and Author are required`);
                        return;
                     }

                     const bookData = {
                        title: data.title.trim(),
                        author: data.author.trim(),
                        isbn: data.isbn ? data.isbn.trim() : null,
                        publisher: data.publisher ? data.publisher.trim() : '',
                        publication_year: data.publication_year ? parseInt(data.publication_year) : null,
                        category: data.category ? data.category.trim() : 'GENERAL',
                        description: data.description ? data.description.trim() : '',
                        total_copies: data.total_copies ? parseInt(data.total_copies) : 1,
                        price: data.price ? parseFloat(data.price) : null,
                        language: data.language ? data.language.trim() : 'English',
                        ...(tenantCode && { tenant_code: tenantCode }),
                     };

                     books.push(bookData);
                  } catch (error) {
                     errors.push(`Line ${lineNumber}: ${error.message}`);
                  }
               })
               .on('end', async () => {
                  try {
                     const results = {
                        total_processed: books.length,
                        successful: 0,
                        failed: 0,
                        errors: [...errors],
                     };

                     for (const bookData of books) {
                        try {
                           await this.createBook(bookData, tenantCode);
                           results.successful++;
                        } catch (error) {
                           results.failed++;
                           results.errors.push(`Book "${bookData.title}": ${error.message}`);
                        }
                     }

                     resolve(results);
                  } catch (error) {
                     resolve({ error: error.message });
                  }
               });
         });
      } catch (error) {
         logError(error, { context: 'LibraryService.importBooksFromCSV', tenantCode });
         throw error;
      }
   }

   /**
    * Export books to CSV format
    * @param {Object} filters - Export filters
    * @param {string} tenantCode - Tenant identifier
    * @returns {string} CSV data
    */
   async exportBooksToCSV(filters = {}, tenantCode = null) {
      try {
         const { books } = await this.getAllBooks(filters, { page: 1, limit: 10000 }, tenantCode);

         const headers = [
            'Title',
            'Author',
            'ISBN',
            'Publisher',
            'Publication Year',
            'Category',
            'Total Copies',
            'Available Copies',
            'Price',
            'Language',
            'Status',
            'Accession Number',
         ];

         let csv = headers.join(',') + '\n';

         books.forEach((book) => {
            const row = [
               `"${book.title || ''}"`,
               `"${book.author || ''}"`,
               `"${book.isbn || ''}"`,
               `"${book.publisher || ''}"`,
               book.publication_year || '',
               `"${book.category || ''}"`,
               book.total_copies || 0,
               book.available_copies || 0,
               book.price || '',
               `"${book.language || ''}"`,
               `"${book.status || ''}"`,
               `"${book.accession_number || ''}"`,
            ];
            csv += row.join(',') + '\n';
         });

         return csv;
      } catch (error) {
         logError(error, { context: 'LibraryService.exportBooksToCSV', tenantCode });
         throw error;
      }
   }
}

module.exports = LibraryService;
