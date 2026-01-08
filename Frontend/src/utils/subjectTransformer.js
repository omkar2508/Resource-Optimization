// src/utils/subjectTransformer.js
// Transforms component-based subjects to flat structure for timetable generation

/**
 * Converts subjects with components to flat subject list
 * @param {Array} subjects - Array of subjects with components
 * @returns {Array} - Flattened array of subjects (one per component)
 */
export function flattenSubjects(subjects) {
  const flattened = [];
  
  subjects.forEach((subject) => {
    subject.components.forEach((component) => {
      flattened.push({
        _id: `${subject._id}_${component.type}`,
        code: subject.code,
        name: subject.name,
        type: component.type,
        hours: component.hours,
        batches: component.batches,
        labDuration: component.labDuration,
        year: subject.year,
        semester: subject.semester,
        department: subject.department,
        // Keep reference to parent subject
        parentSubjectId: subject._id
      });
    });
  });
  
  return flattened;
}

/**
 * Groups flattened subjects back into component-based structure
 * @param {Array} flatSubjects - Flattened subject array
 * @returns {Array} - Subjects with components
 */
export function groupSubjects(flatSubjects) {
  const grouped = new Map();
  
  flatSubjects.forEach((subject) => {
    const key = `${subject.code}_${subject.year}_${subject.semester}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        _id: subject.parentSubjectId || subject._id,
        code: subject.code,
        name: subject.name,
        year: subject.year,
        semester: subject.semester,
        department: subject.department,
        components: []
      });
    }
    
    grouped.get(key).components.push({
      type: subject.type,
      hours: subject.hours,
      batches: subject.batches,
      labDuration: subject.labDuration
    });
  });
  
  return Array.from(grouped.values());
}

export default {
  flattenSubjects,
  groupSubjects
};