// scripts/createSuperAdmin.js - FIXED: Reads credentials from .env
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import userModel from "../models/userModel.js";

async function createSuperadmin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to MongoDB");

    // FIXED: Read credentials from .env
    const SUPERADMIN_EMAIL = process.env.ADMIN_EMAIL || "superadmin@resourceopt.com";
    const SUPERADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
    const SUPERADMIN_NAME = process.env.ADMIN_NAME || "Super Administrator";

    console.log("\n📋 Credentials from .env:");
    console.log(`   Email: ${SUPERADMIN_EMAIL}`);
    console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
    console.log(`   Name: ${SUPERADMIN_NAME}`);

    // Check if superadmin already exists
    const existingSuperadmin = await userModel.findOne({ role: "superadmin" });
    
    if (existingSuperadmin) {
      console.log("\n⚠️  Superadmin already exists!");
      console.log(`   Current Email: ${existingSuperadmin.email}`);
      console.log(`   Current Name: ${existingSuperadmin.name}`);
      console.log("\n🔄 Updating credentials to match .env...");
      
      // UPDATE existing superadmin with new credentials
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
      existingSuperadmin.email = SUPERADMIN_EMAIL;
      existingSuperadmin.name = SUPERADMIN_NAME;
      existingSuperadmin.password = hashedPassword;
      existingSuperadmin.isActive = true;
      await existingSuperadmin.save();
      
      console.log(" Superadmin credentials updated successfully!");
      console.log("\n🎯 Login with:");
      console.log(`   Email: ${SUPERADMIN_EMAIL}`);
      console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
      process.exit(0);
    }

    // Create new superadmin
    console.log("\n🔐 Creating New Superadmin Account...");
    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

    const superadmin = await userModel.create({
      name: SUPERADMIN_NAME,
      email: SUPERADMIN_EMAIL,
      password: hashedPassword,
      role: "superadmin",
      department: "Administration",
      isAccountVerified: true,
      isActive: true
    });

    console.log("\n Superadmin created successfully!");
    console.log("\n🎯 Login Credentials:");
    console.log(`   Email: ${SUPERADMIN_EMAIL}`);
    console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
    console.log("\n Login URL: http://localhost:8080/admin/login");
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");

  } catch (error) {
    console.error(" Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

createSuperadmin();