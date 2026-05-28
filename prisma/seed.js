import 'dotenv/config'
import pkg from '@prisma/client'
const { PrismaClient } = pkg
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'zaid.tarawneg.505@gmail.com'
  const adminPassword = ':75ATJOJO123456789Aa@#$'
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })
  
  if (existingAdmin) {
    console.log('Admin user already exists. Skipping seed.')
    return
  }
  
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin Zaid',
      role: 'ADMIN'
    }
  })
  
  console.log('Admin user created successfully:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
