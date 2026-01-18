/**
 * Automated Prisma to Mongoose Migration Script
 * Converts remaining API route files from Prisma to Mongoose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/app/api/addresses/route.ts',
  'src/app/api/addresses/[id]/route.ts',
  'src/app/api/delivery-persons/route.ts',
  'src/app/api/delivery-persons/[id]/route.ts',
  'src/app/api/files/route.ts',
  'src/app/api/files/[id]/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/restaurants/route.ts',
  'src/app/api/restaurants/[id]/route.ts',
  'src/app/api/reviews/route.ts',
  'src/app/api/transactions/route.ts',
];

const replacements = [
  // Import statements
  {
    from: /import { prisma } from ["']@\/lib\/prisma["'];?/g,
    to: `import dbConnect from "@/lib/mongodb";\nimport { User } from "@/models/User";\nimport { Restaurant } from "@/models/Restaurant";\nimport { MenuItem } from "@/models/MenuItem";\nimport { Order } from "@/models/Order";\nimport { Review } from "@/models/Review";\nimport { Address } from "@/models/Address";\nimport { DeliveryPerson } from "@/models/DeliveryPerson";\nimport { File } from "@/models/File";`,
  },
  
  // Add dbConnect() at start of try blocks
  {
    from: /(try {)(\s+)(const )/g,
    to: '$1$2await dbConnect();$2$3',
  },
  
  // Prisma model operations
  { from: /prisma\.user\.findMany\(/g, to: 'User.find(' },
  { from: /prisma\.user\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'User.findById(' },
  { from: /prisma\.user\.findFirst\(/g, to: 'User.findOne(' },
  { from: /prisma\.user\.create\(/g, to: 'User.create(' },
  { from: /prisma\.user\.update\(/g, to: 'User.findByIdAndUpdate(' },
  { from: /prisma\.user\.delete\(/g, to: 'User.findByIdAndDelete(' },
  { from: /prisma\.user\.count\(/g, to: 'User.countDocuments(' },
  
  { from: /prisma\.restaurant\.findMany\(/g, to: 'Restaurant.find(' },
  { from: /prisma\.restaurant\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'Restaurant.findById(' },
  { from: /prisma\.restaurant\.findFirst\(/g, to: 'Restaurant.findOne(' },
  { from: /prisma\.restaurant\.create\(/g, to: 'Restaurant.create(' },
  { from: /prisma\.restaurant\.update\(/g, to: 'Restaurant.findByIdAndUpdate(' },
  { from: /prisma\.restaurant\.delete\(/g, to: 'Restaurant.findByIdAndDelete(' },
  { from: /prisma\.restaurant\.count\(/g, to: 'Restaurant.countDocuments(' },
  
  { from: /prisma\.menuItem\.findMany\(/g, to: 'MenuItem.find(' },
  { from: /prisma\.menuItem\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'MenuItem.findById(' },
  { from: /prisma\.menuItem\.create\(/g, to: 'MenuItem.create(' },
  { from: /prisma\.menuItem\.update\(/g, to: 'MenuItem.findByIdAndUpdate(' },
  { from: /prisma\.menuItem\.delete\(/g, to: 'MenuItem.findByIdAndDelete(' },
  
  { from: /prisma\.order\.findMany\(/g, to: 'Order.find(' },
  { from: /prisma\.order\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'Order.findById(' },
  { from: /prisma\.order\.create\(/g, to: 'Order.create(' },
  { from: /prisma\.order\.update\(/g, to: 'Order.findByIdAndUpdate(' },
  { from: /prisma\.order\.delete\(/g, to: 'Order.findByIdAndDelete(' },
  { from: /prisma\.order\.count\(/g, to: 'Order.countDocuments(' },
  
  { from: /prisma\.review\.findMany\(/g, to: 'Review.find(' },
  { from: /prisma\.review\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'Review.findById(' },
  { from: /prisma\.review\.create\(/g, to: 'Review.create(' },
  { from: /prisma\.review\.update\(/g, to: 'Review.findByIdAndUpdate(' },
  { from: /prisma\.review\.delete\(/g, to: 'Review.findByIdAndDelete(' },
  { from: /prisma\.review\.count\(/g, to: 'Review.countDocuments(' },
  
  { from: /prisma\.address\.findMany\(/g, to: 'Address.find(' },
  { from: /prisma\.address\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'Address.findById(' },
  { from: /prisma\.address\.create\(/g, to: 'Address.create(' },
  { from: /prisma\.address\.update\(/g, to: 'Address.findByIdAndUpdate(' },
  { from: /prisma\.address\.updateMany\(/g, to: 'Address.updateMany(' },
  { from: /prisma\.address\.delete\(/g, to: 'Address.findByIdAndDelete(' },
  
  { from: /prisma\.deliveryPerson\.findMany\(/g, to: 'DeliveryPerson.find(' },
  { from: /prisma\.deliveryPerson\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'DeliveryPerson.findById(' },
  { from: /prisma\.deliveryPerson\.create\(/g, to: 'DeliveryPerson.create(' },
  { from: /prisma\.deliveryPerson\.update\(/g, to: 'DeliveryPerson.findByIdAndUpdate(' },
  { from: /prisma\.deliveryPerson\.delete\(/g, to: 'DeliveryPerson.findByIdAndDelete(' },
  { from: /prisma\.deliveryPerson\.count\(/g, to: 'DeliveryPerson.countDocuments(' },
  
  { from: /prisma\.file\.findMany\(/g, to: 'File.find(' },
  { from: /prisma\.file\.findUnique\(\{\s*where:\s*\{\s*id:/g, to: 'File.findById(' },
  { from: /prisma\.file\.create\(/g, to: 'File.create(' },
  { from: /prisma\.file\.deleteMany\(/g, to: 'File.deleteMany(' },
  
  // Remove Prisma transactions (need manual review)
  { from: /await prisma\.\$transaction\(/g, to: '// TODO: Manual review needed - was Prisma transaction\nawait (' },
];

console.log('🚀 Starting automated Prisma to Mongoose migration...\n');

let updatedCount = 0;
let skippedCount = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} - file not found`);
    skippedCount++;
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });
  
  if (changed) {
    // Backup original
    fs.writeFileSync(fullPath + '.backup', fs.readFileSync(fullPath));
    
    // Write updated content
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    updatedCount++;
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Updated: ${updatedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
console.log(`\n⚠️  IMPORTANT: Review files with "$transaction" - they need manual updates`);
console.log(`\n✨ Automated migration complete!`);
console.log(`\nNext: Run "node scripts/check-prisma-migration.js" to verify`);
