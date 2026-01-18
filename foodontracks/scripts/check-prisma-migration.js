#!/usr/bin/env node

/**
 * Prisma to Mongoose Migration Helper
 * 
 * This script helps identify files that still use Prisma
 * and provides suggestions for migration to Mongoose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEARCH_DIRS = [
  path.join(__dirname, '../src/app/api'),
  path.join(__dirname, '../src/middleware'),
  path.join(__dirname, '../src/lib'),
];

const PRISMA_PATTERNS = [
  /import.*prisma/i,
  /from.*prisma/i,
  /prisma\./,
  /@prisma\/client/,
];

const MIGRATION_GUIDE = {
  'prisma.user.findMany()': 'User.find()',
  'prisma.user.findUnique({ where: { id } })': 'User.findById(id)',
  'prisma.user.create({ data })': 'User.create(data)',
  'prisma.user.update({ where: { id }, data })': 'User.findByIdAndUpdate(id, data, { new: true })',
  'prisma.user.delete({ where: { id } })': 'User.findByIdAndDelete(id)',
  'prisma.user.count()': 'User.countDocuments()',
  
  'prisma.restaurant.findMany()': 'Restaurant.find()',
  'prisma.restaurant.findUnique({ where: { id } })': 'Restaurant.findById(id)',
  
  'prisma.menuItem.findMany()': 'MenuItem.find()',
  'prisma.order.findMany()': 'Order.find()',
  'prisma.review.findMany()': 'Review.find()',
  
  'select: { id: true, name: true }': '.select("name")',
  'orderBy: { createdAt: "desc" }': '.sort({ createdAt: -1 })',
  'take: 10': '.limit(10)',
  'skip: 20': '.skip(20)',
  
  'include: { user: true }': '.populate("userId")',
  'include: { restaurant: { select: { name: true } } }': '.populate("restaurantId", "name")',
};

function findPrismaFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findPrismaFiles(filePath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasPrisma = PRISMA_PATTERNS.some(pattern => pattern.test(content));
      
      if (hasPrisma) {
        results.push({
          file: filePath,
          content: content,
        });
      }
    }
  }
  
  return results;
}

function generateMigrationReport() {
  console.log('🔍 Scanning for Prisma references...\n');
  
  let allFiles = [];
  for (const dir of SEARCH_DIRS) {
    const files = findPrismaFiles(dir);
    allFiles = allFiles.concat(files);
  }
  
  if (allFiles.length === 0) {
    console.log('✅ No Prisma references found! Migration complete.\n');
    return;
  }
  
  console.log(`❌ Found ${allFiles.length} files with Prisma references:\n`);
  
  allFiles.forEach(({ file, content }, index) => {
    console.log(`${index + 1}. ${path.relative(process.cwd(), file)}`);
    
    // Find specific Prisma patterns in the file
    const lines = content.split('\n');
    lines.forEach((line, lineNum) => {
      PRISMA_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          console.log(`   Line ${lineNum + 1}: ${line.trim()}`);
        }
      });
    });
    
    console.log('');
  });
  
  console.log('\n📖 Migration Guide:\n');
  console.log('Common Prisma → Mongoose conversions:\n');
  
  Object.entries(MIGRATION_GUIDE).forEach(([prismaCode, mongooseCode]) => {
    console.log(`  Prisma:   ${prismaCode}`);
    console.log(`  Mongoose: ${mongooseCode}`);
    console.log('');
  });
  
  console.log('\n📝 Required imports for Mongoose:\n');
  console.log('  import dbConnect from "@/lib/mongodb";');
  console.log('  import { User } from "@/models/User";');
  console.log('  import { Restaurant } from "@/models/Restaurant";');
  console.log('  import { MenuItem } from "@/models/MenuItem";');
  console.log('  import { Order } from "@/models/Order";');
  console.log('  import { Review } from "@/models/Review";');
  console.log('');
  console.log('  // In your API route:');
  console.log('  await dbConnect();');
  console.log('');
  
  console.log('\n🚀 Next Steps:\n');
  console.log('1. Update each file listed above');
  console.log('2. Replace Prisma imports with Mongoose models');
  console.log('3. Update query syntax using the migration guide');
  console.log('4. Add await dbConnect() at the start of API routes');
  console.log('5. Test each endpoint after migration');
  console.log('6. Remove prisma folder and @prisma/client package');
  console.log('');
}

// Run the script
generateMigrationReport();
