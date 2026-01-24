# ============================================
# FILE 3: solver/core/validators.py
# ============================================

def teacher_can_teach_entry(teacher, subject_code):
    """Check if teacher is qualified to teach a subject."""
    for s in teacher.get("subjects", []):
        if s.get("code") == subject_code:
            return True
    return False


def validate_requirements(years, teachers, rooms):
    """Validate basic requirements including lab duration."""
    issues = []
    
    if len(teachers) == 0:
        issues.append("CRITICAL: No teachers defined. Add teachers before generating timetable.")
        return issues
    
    if len(rooms) == 0:
        issues.append("CRITICAL: No rooms defined. Add rooms before generating timetable.")
        return issues
    
    for year_name, year_data in years.items():
        subjects = year_data.get("subjects", [])
        for subject in subjects:
            subject_code = subject.get("code")
            qualified = [t for t in teachers if teacher_can_teach_entry(t, subject_code)]
            if len(qualified) == 0:
                issues.append(f"CRITICAL: No teacher qualified for {subject_code} in {year_name}. Assign at least one teacher.")
            
            # Validate lab duration
            if subject.get("type") == "Lab":
                lab_duration = subject.get("labDuration", 1)
                if lab_duration not in [1, 2, 3]:
                    issues.append(f"CRITICAL: {subject_code} has invalid lab duration {lab_duration}. Must be 1, 2, or 3 hours.")
                
                periods_per_day = year_data.get("periodsPerDay", 6)
                if lab_duration > periods_per_day:
                    issues.append(f"CRITICAL: {subject_code} requires {lab_duration}-hour continuous slot but day only has {periods_per_day} periods.")
        
        labs = [s for s in subjects if s.get("type") == "Lab"]
        lab_rooms = [r for r in rooms if r.get("type") == "Lab"]
        if len(labs) > 0 and len(lab_rooms) == 0:
            issues.append(f"WARNING: {year_name} has lab subjects but no lab rooms defined.")
    
    return issues


def validate_room_assignments(years, rooms):
    """Validate that lab subjects have compatible rooms assigned"""
    issues = []
    
    for year_name, year_data in years.items():
        subjects = year_data.get("subjects", [])
        lab_subjects = [s for s in subjects if s.get("type") == "Lab"]
        
        for lab_subject in lab_subjects:
            code = lab_subject.get("code")
            
            # Check if ANY lab room is assigned to this subject
            assigned_rooms = [r for r in rooms 
                            if r.get("type") == "Lab" 
                            and code in r.get("assignedSubjects", [])]
            
            if len(assigned_rooms) == 0:
                # No dedicated lab - check for general purpose
                general_labs = [r for r in rooms 
                              if r.get("type") == "Lab" 
                              and r.get("labCategory") == "General Purpose"]
                
                if len(general_labs) == 0:
                    issues.append(
                        f"WARNING: Lab subject {code} ({year_name}) has no assigned "
                        f"lab room and no general purpose labs available"
                    )
    
    return issues