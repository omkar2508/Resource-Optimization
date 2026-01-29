#!/usr/bin/env node
// scripts/cleanupOldTimetables.js
// Run this ONCE to delete all timetables without department field

import mongoose from "mongoose";
import "dotenv/config";
import timetableModel from "../models/timetableModel.js";

async function cleanupOldTimetables() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(" Connected to MongoDB\n");

    // Option 1: Delete only timetables WITHOUT department field (old data)
    console.log("🔍 Finding old timetables without department...");
    const oldTimetables = await timetableModel.find({
      $or: [
        { department: { $exists: false } },
        { department: null },
        { department: "" }
      ]
    });

    console.log(`📊 Found ${oldTimetables.length} old timetables\n`);

    if (oldTimetables.length > 0) {
      console.log("⚠️  These timetables will be deleted:");
      oldTimetables.forEach((tt, idx) => {
        console.log(`   ${idx + 1}. ${tt.year} - Div ${tt.division} (ID: ${tt._id})`);
      });

      console.log("\n⏳ Deleting old timetables...");
      const result = await timetableModel.deleteMany({
        $or: [
          { department: { $exists: false } },
          { department: null },
          { department: "" }
        ]
      });

      console.log(` Deleted ${result.deletedCount} old timetables`);
    } else {
      console.log(" No old timetables found. Database is clean!");
    }

    console.log("\n Cleanup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Verify cleanup by checking the database");
    console.log("2. Generate new timetables with department field");
    console.log("3. Each admin will now see only their department's timetables");

  } catch (error) {
    console.error("\n Cleanup failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the cleanup
cleanupOldTimetables();