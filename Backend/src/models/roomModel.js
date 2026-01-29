import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Classroom", "Lab", "Tutorial"], required: true },
  capacity: { type: Number, required: true },
  labCategory: { type: String, required: function() { return this.type === "Lab"; } },
  primaryYear: { type: String, enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Shared"], default: "Shared" },
  
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

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }
}, { timestamps: true });

roomSchema.index({ name: 1, department: 1 }, { unique: true });

roomSchema.pre('save', async function() {
  if (this.type === 'Lab' && this.labCategory === 'None') {
    this.labCategory = 'General Purpose';
  }
  if (this.type === 'Classroom') {
    this.labCategory = 'None';
  }
});

const roomModel = mongoose.models.room || mongoose.model("room", roomSchema);
export default roomModel;
