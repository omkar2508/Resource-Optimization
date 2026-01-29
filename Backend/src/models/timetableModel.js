import mongoose from "mongoose";
const timetableSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    enum: [
      "Computer Engineering",
      "IT Engineering",
      "AI Engineering",
      "Software Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering"
    ]
  },
  year: { type: String, required: true },
  division: { type: String, required: true },
  timetableData: { type: Object, required: true },
  
  savedBy: { type: String, default: "Admin" },
  
  savedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
}, { timestamps: true });

timetableSchema.index({ year: 1, division: 1, department: 1 }, { unique: true });

const timetableModel = mongoose.models.timetable || mongoose.model("timetable", timetableSchema);

export default timetableModel;