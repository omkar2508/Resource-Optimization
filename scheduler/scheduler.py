# scheduler.py - Key changes for lab duration support

def check_continuous_slots_available(timetable, day, start_slot_idx, duration, teacher, room, batch_identifier):
    """
    Check if 'duration' continuous slots are available starting from start_slot_idx
    
    Args:
        timetable: Current timetable state
        day: Day of week (Mon, Tue, etc.)
        start_slot_idx: Starting slot index
        duration: Number of continuous hours needed (1, 2, or 3)
        teacher: Teacher name to check
        room: Room name to check
        batch_identifier: Batch identifier (year-division-batch)
    
    Returns:
        bool: True if all slots are free, False otherwise
    """
    time_slots = sorted(timetable[day].keys())
    
    # Check if we have enough slots remaining
    if start_slot_idx + duration > len(time_slots):
        return False
    
    # Check each continuous slot
    for i in range(duration):
        slot = time_slots[start_slot_idx + i]
        
        # Check teacher availability
        if is_teacher_busy(timetable, day, slot, teacher):
            return False
        
        # Check room availability
        if is_room_busy(timetable, day, slot, room):
            return False
        
        # Check batch availability
        if is_batch_busy(timetable, day, slot, batch_identifier):
            return False
    
    return True


def allocate_lab_session(timetable, year, division, subject, batch_num, teacher, room, lab_duration):
    """
    Allocate a lab session that occupies 'lab_duration' continuous slots
    
    Args:
        timetable: Timetable to update
        year: Academic year
        division: Division number
        subject: Subject details (includes labDuration)
        batch_num: Batch number
        teacher: Teacher name
        room: Lab room
        lab_duration: Number of continuous hours (1, 2, or 3)
    
    Returns:
        bool: True if successfully allocated, False otherwise
    """
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]  # Adjust based on config
    batch_identifier = f"{year}-Div{division}-B{batch_num}"
    
    for day in days:
        time_slots = sorted(timetable[day].keys())
        
        # Try each starting position
        for start_idx in range(len(time_slots)):
            # Check if continuous slots are available
            if check_continuous_slots_available(
                timetable, day, start_idx, lab_duration, 
                teacher, room, batch_identifier
            ):
                # Allocate all continuous slots
                for i in range(lab_duration):
                    slot = time_slots[start_idx + i]
                    
                    # Create entry
                    entry = {
                        "subject": subject["name"],
                        "code": subject["code"],
                        "type": "Lab",
                        "teacher": teacher,
                        "room": room,
                        "year": year,
                        "division": division,
                        "batch": f"B{batch_num}",
                        "time_slot": slot,
                        "lab_part": f"{i+1}/{lab_duration}",  # Track which part of lab
                        "lab_session_id": f"{day}-{time_slots[start_idx]}"  # Group identifier
                    }
                    
                    # Add to timetable
                    if day not in timetable:
                        timetable[day] = {}
                    if slot not in timetable[day]:
                        timetable[day][slot] = []
                    
                    timetable[day][slot].append(entry)
                
                return True  # Successfully allocated
    
    return False  # Could not find continuous slots


def generate_timetable(config):
    """
    Main timetable generation with lab duration support
    """
    years = config["years"]
    teachers = config["teachers"]
    rooms = config["rooms"]
    
    timetable = {
        "class_timetable": {},
        "teacher_timetable": {},
        "conflicts": [],
        "unallocated": [],
        "room_conflicts": [],
        "critical_issues": []
    }
    
    for year, year_config in years.items():
        for div in range(1, year_config["divisions"] + 1):
            class_key = f"{year}-Div{div}"
            
            for subject in year_config["subjects"]:
                if subject["type"] == "Lab":
                    # Get lab duration (default to 2 if not specified)
                    lab_duration = subject.get("labDuration", 2)
                    
                    # Validate lab duration
                    if lab_duration not in [1, 2, 3]:
                        timetable["critical_issues"].append(
                            f"{year} - {subject['code']}: Invalid lab duration {lab_duration}. Must be 1, 2, or 3 hours."
                        )
                        continue
                    
                    # Find teacher for this subject
                    teacher = find_teacher_for_subject(teachers, subject["code"], year)
                    if not teacher:
                        timetable["critical_issues"].append(
                            f"{year} - {subject['code']}: No teacher assigned"
                        )
                        continue
                    
                    # Find lab room
                    lab_room = find_lab_room(rooms, subject.get("room_preference"))
                    if not lab_room:
                        timetable["critical_issues"].append(
                            f"{year} - {subject['code']}: No lab room available"
                        )
                        continue
                    
                    # Allocate for each batch
                    batches = subject.get("batches", 1)
                    for batch_num in range(1, batches + 1):
                        success = allocate_lab_session(
                            timetable["class_timetable"],
                            year, div, subject, batch_num,
                            teacher, lab_room, lab_duration
                        )
                        
                        if not success:
                            timetable["unallocated"].append({
                                "subject": subject["name"],
                                "type": "Lab",
                                "year": year,
                                "division": div,
                                "batch": f"B{batch_num}",
                                "required": lab_duration,
                                "missing": lab_duration,
                                "reason": f"Could not find {lab_duration} continuous free slots"
                            })
                
                elif subject["type"] == "Theory":
                    # Handle theory subjects (1 hour each)
                    pass
                
                elif subject["type"] == "Tutorial":
                    # Handle tutorials (1 hour each)
                    pass
    
    return timetable


def is_teacher_busy(timetable, day, slot, teacher):
    """Check if teacher is already assigned at this time"""
    if day not in timetable or slot not in timetable[day]:
        return False
    
    for entry in timetable[day][slot]:
        if entry.get("teacher") == teacher:
            return True
    return False


def is_room_busy(timetable, day, slot, room):
    """Check if room is already occupied at this time"""
    if day not in timetable or slot not in timetable[day]:
        return False
    
    for entry in timetable[day][slot]:
        if entry.get("room") == room:
            return True
    return False


def is_batch_busy(timetable, day, slot, batch_identifier):
    """Check if batch already has a class at this time"""
    if day not in timetable or slot not in timetable[day]:
        return False
    
    for entry in timetable[day][slot]:
        entry_batch = f"{entry.get('year')}-Div{entry.get('division')}-{entry.get('batch')}"
        if entry_batch == batch_identifier:
            return True
    return False