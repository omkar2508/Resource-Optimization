import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/mern-auth";  

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Classroom", "Lab", "Tutorial"], required: true },
    labCategory: { 
        type: String, 
        enum: ["Networking", "Linux", "IoT", "Software", "Hardware", "MAC", 
               "Database", "AI/ML", "Cloud Computing", "Cybersecurity", 
               "Mobile Development", "General Purpose", "None"],
        default: "None" 
    },
    capacity: { type: Number, required: true },
    assignedSubjects: { type: [String], default: [] },
    primaryYear: { type: String, enum: ["1st", "2nd", "3rd", "4th", "All"], default: "All" },
    primaryDivision: { type: Number, default: null },
    department: { type: String, default: "Software Engineering" },
    isShared: { type: Boolean, default: true },
    equipment: { type: [String], default: [] },
    notes: { type: String, default: "" }
}, { timestamps: true });

// Pre-save hook with async/await
roomSchema.pre('save', async function() {
    if (this.type === 'Lab' && this.labCategory === 'None') {
        this.labCategory = 'General Purpose';
    }
    if (this.type === 'Classroom') {
        this.isShared = true;
        this.assignedSubjects = [];
        this.labCategory = 'None';
    }
});

async function testRoomCreation() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log(" Connected to MongoDB");

        const RoomModel = mongoose.model("room", roomSchema);

        // Test 1: Create a simple classroom
        console.log("\n📝 Test 1: Creating a classroom...");
        const classroom = new RoomModel({
            name: "TEST_ROOM_1",
            type: "Classroom",
            capacity: 60
        });
        
        const savedClassroom = await classroom.save();
        console.log(" Classroom created:", savedClassroom.name);

        // Test 2: Create a lab with category
        console.log("\n📝 Test 2: Creating a lab...");
        const lab = new RoomModel({
            name: "TEST_LAB_1",
            type: "Lab",
            capacity: 30,
            labCategory: "Software",
            assignedSubjects: ["CS101", "CS102"],
            primaryYear: "2nd",
            primaryDivision: 1,
            isShared: false
        });
        
        const savedLab = await lab.save();
        console.log(" Lab created:", savedLab.name);

        // Verify rooms were created
        console.log("\n📊 Fetching all rooms...");
        const allRooms = await RoomModel.find({});
        console.log(` Total rooms in database: ${allRooms.length}`);
        
        allRooms.forEach(room => {
            console.log(`  - ${room.name} (${room.type})`);
        });

        // Cleanup test rooms
        console.log("\n🧹 Cleaning up test rooms...");
        await RoomModel.deleteMany({ name: { $in: ["TEST_ROOM_1", "TEST_LAB_1"] } });
        console.log(" Test rooms deleted");

        console.log("\n All tests passed! Your room model is working correctly.");
        
    } catch (error) {
        console.error("\n Error during test:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Disconnected from MongoDB");
        process.exit(0);
    }
}

testRoomCreation();