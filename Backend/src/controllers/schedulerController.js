import { callPythonScheduler } from "../utils/callPython.js";
import userModel from "../models/userModel.js";
import roomModel from "../models/roomModel.js";
import subjectModel from "../models/subjectModel.js";
import timetableModel from "../models/timetableModel.js";

export const generateTimetable = async (req, res) => {
  try {
    const { years, roomMappings, teachers: wizardTeachers } = req.body;
    
    // Get admin's department from middleware
    const department = req.adminDepartment;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department not found for admin"
      });
    }

    console.log(`🎯 Generating timetable for department: ${department}`);

    // STEP 1: Fetch department-filtered resources
    
    // Fetch rooms for this department
    const departmentRooms = await roomModel.find({ 
      department 
    }).select("name type capacity labCategory primaryYear");

    if (departmentRooms.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No rooms found for ${department}. Please add rooms first.`
      });
    }

    console.log(`🏛️ Found ${departmentRooms.length} rooms for ${department}`);

    let departmentTeachers = wizardTeachers || [];

    if (!departmentTeachers || departmentTeachers.length === 0) {
      console.log("⚠️ No teachers in wizard payload, fetching from database...");
      departmentTeachers = await userModel.find({
        role: "teacher",
        department
      }).select("name email subjects");
    } else {
      console.log(` Using ${departmentTeachers.length} teachers from wizard payload`);
    }

    if (departmentTeachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No teachers found for ${department}. Please add teachers first.`
      });
    }

    console.log(`👥 Found ${departmentTeachers.length} teachers for ${department}`);
    
    // Log teacher-subject assignments for debugging
    departmentTeachers.forEach(t => {
      const subjectCount = (t.subjects || []).length;
      console.log(`   - ${t.name}: ${subjectCount} subject(s) assigned`);
      if (subjectCount > 0 && process.env.NODE_ENV !== "production") {
        const codes = (t.subjects || []).map(s => s.code || s).join(", ");
        console.log(`     Subjects: ${codes}`);
      }
    });

    // STEP 2: Enrich years with full subject details from database
    const enrichedYears = {};
    
    for (const [yearName, yearData] of Object.entries(years)) {
      const subjectCodes = yearData.subjects.map(s => s.code);
      
      const fullSubjects = await subjectModel.find({
        code: { $in: subjectCodes },
        department  
      });

      if (fullSubjects.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No subjects found for ${yearName} in ${department}. Please add subjects first.`
        });
      }

      console.log(`📚 Year ${yearName}: Found ${fullSubjects.length} subjects`);

      // STEP 3: Flatten components into individual entries
      const mappedSubjects = fullSubjects.flatMap(subject => {
        return subject.components.map(comp => ({
          code: subject.code,
          name: subject.name,
          type: comp.type,
          hours: comp.hours,
          batches: comp.batches || 1,
          labDuration: comp.labDuration || 2
        }));
      });

      enrichedYears[yearName] = {
        ...yearData,
        subjects: mappedSubjects
      };
    }

    // STEP 4: Fetch saved timetables for this department
    const savedTimetables = await timetableModel.find({ 
      department 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    //  STEP 5: Use teachers from wizard (already in correct format)
    const payload = {
      years: enrichedYears,
      rooms: departmentRooms.map(r => ({
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        labCategory: r.labCategory || "None",
        primaryYear: r.primaryYear || "Shared"
      })),
      teachers: departmentTeachers,  // Use directly - already has subjects
      saved_timetables: savedTimetables.map(tt => ({
        year: tt.year,
        division: tt.division,
        timetableData: tt.timetableData
      })),
      roomMappings: roomMappings || {}
    };

    console.log("Sending payload to Python scheduler...");
    console.log(`Years: ${Object.keys(enrichedYears).length}`);
    console.log(`Total subjects: ${Object.values(enrichedYears).reduce((sum, y) => sum + y.subjects.length, 0)}`);
    console.log(`Rooms: ${departmentRooms.length}`);
    console.log(`Teachers: ${departmentTeachers.length}`);
    console.log(`Teachers with subjects: ${departmentTeachers.filter(t => (t.subjects || []).length > 0).length}`);

    // STEP 6: Call Python scheduler
    const result = await callPythonScheduler(payload);

    console.log(` Scheduler completed with status: ${result.status}`);

    // STEP 7: Return structured response
    return res.json({
      success: true,
      status: result.status || "success",
      message: `Timetable generated for ${department}`,
      department,
      class_timetable: result.class_timetable || {},
      teacher_timetable: result.teacher_timetable || {},
      conflicts: result.conflicts || [],
      room_conflicts: result.room_conflicts || [],
      unallocated: result.unallocated || [],
      recommendations: result.recommendations || [],
      warnings: result.warnings || [],
      critical_issues: result.critical_issues || [],
      lab_conflicts: result.lab_conflicts || []
    });

  } catch (error) {
    console.error(" Scheduler error:", error);
    
    if (error.response) {
      return res.status(500).json({
        success: false,
        status: "error",
        message: "Python scheduler error: " + (error.response.data?.error || error.message),
        error: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      status: "error",
      message: error.message || "Failed to generate timetable",
      error: error.toString()
    });
  }
};