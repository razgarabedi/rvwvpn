const { PrismaClient } = require('@prisma/client');

console.log('Testing Prisma client import...');

try {
  const prisma = new PrismaClient();
  console.log('Prisma client created successfully');
  prisma.$disconnect();
} catch (error) {
  console.error('Error creating Prisma client:', error);
}
