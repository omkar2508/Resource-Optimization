import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      default: "Software Engineering",   // ← DEFAULT DEPT
    },

    year: {
      type: String,
      required: true,
    },

    division: {
      type: String,
      required: true,
    },

    timetableData: {
      type: Object,
      required: true,
    },

    savedBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

const timetableModel =
  mongoose.models.timetable || mongoose.model("timetable", timetableSchema);

export default timetableModel;
