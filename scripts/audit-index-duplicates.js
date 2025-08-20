#!/usr/bin/env node
/**
 * Index Duplication Audit Script
 * 
 * This script checks all models for duplicate index definitions that could
 * cause the MySQL 64-key limit issue.
 */

const fs = require('fs');
const path = require('path');

function findJSFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findJSFiles(fullPath, files);
        } else if (item.endsWith('.js') && (
            dir.includes('/models') || 
            dir.includes('\\models')
        )) {
            files.push(fullPath);
        }
    }
    
    return files;
}

function analyzeModel(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Find field-level unique constraints
        const uniqueFieldsRegex = /(\w+):\s*{[^}]*unique:\s*true[^}]*}/g;
        const uniqueFields = [];
        let match;
        
        while ((match = uniqueFieldsRegex.exec(content)) !== null) {
            uniqueFields.push(match[1]);
        }
        
        // Find explicit unique indexes
        const uniqueIndexRegex = /{\s*[^}]*unique:\s*true[^}]*fields:\s*\['?(\w+)'?\][^}]*}/g;
        const explicitUniqueIndexes = [];
        
        while ((match = uniqueIndexRegex.exec(content)) !== null) {
            explicitUniqueIndexes.push(match[1]);
        }
        
        // Find potential duplicates
        const duplicates = uniqueFields.filter(field => 
            explicitUniqueIndexes.includes(field)
        );
        
        if (duplicates.length > 0) {
            return {
                file: filePath,
                uniqueFields,
                explicitUniqueIndexes,
                duplicates,
                issue: true
            };
        }
        
        return {
            file: filePath,
            uniqueFields,
            explicitUniqueIndexes,
            duplicates,
            issue: false
        };
        
    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error.message);
        return null;
    }
}

function main() {
    console.log('🔍 Index Duplication Audit');
    console.log('==========================');
    
    const modelFiles = findJSFiles('./');
    const issues = [];
    const clean = [];
    
    modelFiles.forEach(file => {
        const analysis = analyzeModel(file);
        if (analysis) {
            if (analysis.issue) {
                issues.push(analysis);
            } else {
                clean.push(analysis);
            }
        }
    });
    
    console.log(`\n📊 Analysis Results:`);
    console.log(`   Total models analyzed: ${modelFiles.length}`);
    console.log(`   Models with issues: ${issues.length}`);
    console.log(`   Clean models: ${clean.length}`);
    
    if (issues.length > 0) {
        console.log(`\n❌ Models with Index Duplication Issues:`);
        issues.forEach(issue => {
            console.log(`\n   📁 ${issue.file}`);
            console.log(`      🔑 Field-level unique: ${issue.uniqueFields.join(', ')}`);
            console.log(`      📊 Explicit unique indexes: ${issue.explicitUniqueIndexes.join(', ')}`);
            console.log(`      ⚠️  Duplicates: ${issue.duplicates.join(', ')}`);
        });
    } else {
        console.log(`\n✅ No index duplication issues found!`);
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`   All models have been checked for the pattern that caused`);
    console.log(`   the MySQL 64-key limit issue (field unique + explicit unique index).`);
}

if (require.main === module) {
    main();
}

module.exports = { analyzeModel, findJSFiles };
