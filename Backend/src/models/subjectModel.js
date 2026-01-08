import mongoose from "mongoose";

// Component schema for Theory/Lab/Tutorial
const componentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["Theory", "Lab", "Tutorial"], 
    required: true 
  },
  hours: { type: Number, required: true },
  batches: { type: Number, default: 1 },
  labDuration: { type: Number, default: 2 }, // Only relevant for Lab type
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true,
    uppercase: true
  },
  name: { type: String, required: true },
  year: { 
    type: String, 
    enum: ["1st", "2nd", "3rd", "4th"], 
    required: true 
  },
  semester: { 
    type: Number, 
    required: true 
  },
  // Components array - can contain Theory, Lab, Tutorial
  components: {
    type: [componentSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Subject must have at least one component'
    }
  },
  department: { 
    type: String, 
    default: "Software Engineering" 
  }
}, { timestamps: true });

// Unique constraint: one subject code per year/semester
subjectSchema.index({ code: 1, year: 1, semester: 1 }, { unique: true });

const subjectModel = mongoose.models.subject || mongoose.model("subject", subjectSchema);
export default subjectModel;