// roomModel.js - UPDATED: Remove assignedSubjects field
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Classroom", "Lab", "Tutorial"], required: true },
    capacity: { type: Number, required: true },
    labCategory: { type: String, required: function() { return this.type === "Lab"; } },
    primaryYear: { type: String, enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Shared"], default: "Shared" },
    department: { type: String, default: "Software Engineering" }
}, { timestamps: true });

// ✅ SIMPLIFIED: Pre-save middleware
roomSchema.pre('save', async function() {
    // Ensure labs have a category
    if (this.type === 'Lab' && this.labCategory === 'None') {
        this.labCategory = 'General Purpose';
    }
    
    // Theory classrooms default settings
    if (this.type === 'Classroom') {
        this.labCategory = 'None';
    }
});

const roomModel = mongoose.models.room || mongoose.model("room", roomSchema);
export default roomModel;