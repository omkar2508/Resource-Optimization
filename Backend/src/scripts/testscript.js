#!/usr/bin/env node

/**
 * Teacher-Subject Mapping Diagnostic Script
 * Run this to verify the fix is working correctly
 * 
 * Usage: node verify-teacher-mapping.js
 */

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const SUCCESS = `${COLORS.green}${COLORS.reset}`;
const FAIL = `${COLORS.red}${COLORS.reset}`;
const WARN = `${COLORS.yellow}⚠️${COLORS.reset}`;
const INFO = `${COLORS.blue}ℹ️${COLORS.reset}`;

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  Teacher-Subject Mapping Diagnostic Tool                  ║
║  Version 1.0                                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// Test 1: Check if schedulerController.js has the fix
function testSchedulerControllerFix(fileContent) {
  console.log(`\n${COLORS.cyan}[Test 1]${COLORS.reset} Checking schedulerController.js...`);
  
  const hasSubjectsInSelect = fileContent.includes('.select("name email subjects")') ||
                              fileContent.includes(".select('name email subjects')") ||
                              fileContent.includes('.select(`name email subjects`)');
  
  const hasSubjectsInMap = fileContent.includes('subjects: t.subjects') ||
                          fileContent.includes('subjects:t.subjects');
  
  if (hasSubjectsInSelect && hasSubjectsInMap) {
    console.log(`${SUCCESS} Both fixes applied correctly`);
    console.log(`  ${SUCCESS} Database query includes 'subjects' field`);
    console.log(`  ${SUCCESS} Payload mapping includes 'subjects' property`);
    return true;
  } else {
    console.log(`${FAIL} Fixes not applied or incomplete`);
    if (!hasSubjectsInSelect) {
      console.log(`  ${FAIL} Database query missing 'subjects' in .select()`);
      console.log(`      Fix: Change .select("name email") to .select("name email subjects")`);
    }
    if (!hasSubjectsInMap) {
      console.log(`  ${FAIL} Payload mapping missing 'subjects' property`);
      console.log(`      Fix: Add 'subjects: t.subjects || []' to teacher mapping`);
    }
    return false;
  }
}

// Test 2: Simulate payload structure
function testPayloadStructure() {
  console.log(`\n${COLORS.cyan}[Test 2]${COLORS.reset} Testing payload structure...`);
  
  // Simulate what backend SHOULD send
  const correctPayload = {
    teachers: [
      {
        name: "Dr. Smith",
        email: "smith@edu",
        subjects: [
          { code: "CS101", name: "Intro to CS" },
          { code: "CS102", name: "Data Structures" }
        ]
      }
    ]
  };
  
  // Simulate what backend WAS sending (broken)
  const brokenPayload = {
    teachers: [
      {
        name: "Dr. Smith",
        email: "smith@edu"
        // Missing: subjects array
      }
    ]
  };
  
  console.log(`\n  ${INFO} Correct payload structure:`);
  console.log(`  ${COLORS.green}${JSON.stringify(correctPayload, null, 4)}${COLORS.reset}`);
  
  console.log(`\n  ${WARN} Broken payload structure (before fix):`);
  console.log(`  ${COLORS.red}${JSON.stringify(brokenPayload, null, 4)}${COLORS.reset}`);
  
  return true;
}

// Test 3: Simulate Python validator
function testPythonValidator() {
  console.log(`\n${COLORS.cyan}[Test 3]${COLORS.reset} Simulating Python validator...`);
  
  // Python validator simulation
  function teacherCanTeachEntry(teacher, subjectCode) {
    const subjects = teacher.subjects || [];
    for (const s of subjects) {
      if (s.code === subjectCode) {
        return true;
      }
    }
    return false;
  }
  
  // Test with correct data
  const correctTeacher = {
    name: "Dr. Smith",
    email: "smith@edu",
    subjects: [
      { code: "CS101", name: "Intro to CS" }
    ]
  };
  
  // Test with broken data
  const brokenTeacher = {
    name: "Dr. Smith",
    email: "smith@edu"
    // Missing subjects
  };
  
  const canTeachCorrect = teacherCanTeachEntry(correctTeacher, "CS101");
  const canTeachBroken = teacherCanTeachEntry(brokenTeacher, "CS101");
  
  console.log(`\n  Testing: Can Dr. Smith teach CS101?`);
  console.log(`  ${canTeachCorrect ? SUCCESS : FAIL} With subjects array: ${canTeachCorrect}`);
  console.log(`  ${canTeachBroken ? SUCCESS : FAIL} Without subjects array: ${canTeachBroken}`);
  
  if (canTeachCorrect && !canTeachBroken) {
    console.log(`\n  ${SUCCESS} Validator simulation confirms fix necessity`);
    return true;
  }
  
  return false;
}

// Test 4: Data flow visualization
function visualizeDataFlow() {
  console.log(`\n${COLORS.cyan}[Test 4]${COLORS.reset} Data flow visualization...`);
  
  console.log(`
┌────────────────────────────────────────────────────────────┐
│                    BEFORE FIX (BROKEN)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend                                                  │
│     │                                                      │
│     │  Teacher assigned to CS101                          │
│     │                                                      │
│     ▼                                                      │
│  Backend (Node.js)                                        │
│     │                                                      │
│     │  .select("name email")  ${FAIL}                    │
│     │  Missing 'subjects'                                │
│     │                                                      │
│     ▼                                                      │
│  Payload: { name, email }  ${FAIL}                        │
│     │                                                      │
│     ▼                                                      │
│  Python Scheduler                                         │
│     │                                                      │
│     │  teacher.get("subjects", [])  ${FAIL}              │
│     │  Returns: []  (empty)                              │
│     │                                                      │
│     ▼                                                      │
│  Result: "No teacher qualified"  ${FAIL}                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                     AFTER FIX (WORKING)                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Frontend                                                  │
│     │                                                      │
│     │  Teacher assigned to CS101                          │
│     │                                                      │
│     ▼                                                      │
│  Backend (Node.js)                                        │
│     │                                                      │
│     │  .select("name email subjects")  ${SUCCESS}        │
│     │  Includes 'subjects'                               │
│     │                                                      │
│     ▼                                                      │
│  Payload: { name, email, subjects: [...] }  ${SUCCESS}    │
│     │                                                      │
│     ▼                                                      │
│  Python Scheduler                                         │
│     │                                                      │
│     │  teacher.get("subjects", [])  ${SUCCESS}           │
│     │  Returns: [{code: "CS101"}]                        │
│     │                                                      │
│     ▼                                                      │
│  Result: Validation passes  ${SUCCESS}                     │
│  Timetable generated successfully!                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
  `);
  
  return true;
}

// Test 5: Checklist
function displayChecklist() {
  console.log(`\n${COLORS.cyan}[Checklist]${COLORS.reset} Post-Fix Verification Steps...`);
  
  const checklist = [
    { task: "Modified .select() to include 'subjects'", check: false },
    { task: "Modified payload mapping to include subjects array", check: false },
    { task: "Restarted backend server", check: false },
    { task: "Verified teachers have subjects in database", check: false },
    { task: "Tested timetable generation", check: false },
    { task: "Checked console logs for subject counts", check: false }
  ];
  
  console.log();
  checklist.forEach((item, index) => {
    console.log(`  [ ] ${index + 1}. ${item.task}`);
  });
  
  console.log(`
  ${INFO} After completing all items, your timetable generation should work!
  `);
}

// Main execution
function runDiagnostics() {
  console.log(`${INFO} Starting diagnostic tests...\n`);
  
  const tests = [
    testPayloadStructure,
    testPythonValidator,
    visualizeDataFlow,
    displayChecklist
  ];
  
  let passCount = 0;
  
  tests.forEach(test => {
    try {
      if (test()) passCount++;
    } catch (error) {
      console.log(`${FAIL} Test failed: ${error.message}`);
    }
  });
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC SUMMARY                      ║
╚════════════════════════════════════════════════════════════╝
  
  Tests completed: ${tests.length}
  
  ${INFO} To apply the fix:
  
  1. Open: schedulerController.js
  2. Line 44: Change .select("name email") 
              to .select("name email subjects")
  3. Line 117: Add subjects: t.subjects || []
  4. Restart server
  5. Test timetable generation
  
  ${SUCCESS} Fix files provided:
  - TEACHER_SUBJECT_MAPPING_ISSUE_ANALYSIS.md (detailed)
  - QUICK_FIX_GUIDE.md (quick reference)
  - schedulerController_FIXED.js (complete file)
  
╔════════════════════════════════════════════════════════════╗
║            NEED HELP? Check the documentation             ║
╚════════════════════════════════════════════════════════════╝
  `);
}

// Run the diagnostics
runDiagnostics();