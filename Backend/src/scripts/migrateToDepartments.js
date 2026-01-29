// migration_add_subjects_to_teachers.js
// Run this ONCE after updating the userModel schema
// Usage: node migration_add_subjects_to_teachers.js

import mongoose from "mongoose";
import "dotenv/config";
import userModel from "./models/userModel.js";

async function migrateTeachers() {
  try {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to database");

    console.log("\n📊 Checking teachers...");
    
    // Find all teachers
    const teachers = await userModel.find({ role: "teacher" });
    console.log(`Found ${teachers.length} teachers`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const teacher of teachers) {
      // Check if subjects field exists
      if (teacher.subjects === undefined) {
        // Add empty subjects array
        teacher.subjects = [];
        await teacher.save();
        console.log(` Updated: ${teacher.name} - Added empty subjects array`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped: ${teacher.name} - Already has subjects field (${teacher.subjects.length} subjects)`);
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Migration Summary:");
    console.log(`  Total teachers: ${teachers.length}`);
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log("=".repeat(60));

    console.log("\n⚠️  IMPORTANT: Now you need to assign subjects to teachers!");
    console.log("   Option 1: Update via admin interface");
    console.log("   Option 2: Run the subject assignment script");
    console.log("   Option 3: Manually update in MongoDB");

    await mongoose.disconnect();
    console.log("\n Migration complete. Database disconnected.");
    
  } catch (error) {
    console.error(" Migration failed:", error);
    process.exit(1);
  }
}

migrateTeachers();