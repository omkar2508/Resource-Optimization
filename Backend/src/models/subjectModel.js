import mongoose from "mongoose";

const componentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["Theory", "Lab", "Tutorial"], 
    required: true 
  },
  hours: { type: Number, required: true },
  batches: { type: Number, default: 1 },
  labDuration: { type: Number, default: 2 },
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
  semester: { type: Number, required: true },
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

subjectSchema.index({ code: 1, year: 1, semester: 1, department: 1 }, { unique: true });

const subjectModel = mongoose.models.subject || mongoose.model("subject", subjectSchema);
export default subjectModel;