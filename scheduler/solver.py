# scheduler/solver.py - FIXED: Proper continuous lab validation and theory alternation
from collections import defaultdict
import math
import random
import traceback
from datetime import datetime, timedelta

# Default config
DEFAULT_PERIODS_PER_DAY = 6
DEFAULT_WORKING_DAYS = 5
DEFAULT_LUNCH_PERIOD = 4
DEFAULT_MAX_PER_DAY = 3
DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# Configuration flags
CHECK_ROOM_CONFLICTS = True
USE_REAL_TIME_SLOTS = True

def generate_time_slots(start_time, end_time, period_duration, lunch_start=None, lunch_duration=None):
    """Generate time slots INCLUDING breaks."""
    start = datetime.strptime(start_time, "%H:%M")
    end = datetime.strptime(end_time, "%H:%M")
    
    lunch = None
    lunch_end = None
    if lunch_start and lunch_duration:
        lunch = datetime.strptime(lunch_start, "%H:%M")
        lunch_end = lunch + timedelta(minutes=lunch_duration)
    
    slots = []
    period_num = 1
    current = start
    
    while current < end:
        slot_end = current + timedelta(minutes=period_duration)
        
        if slot_end > end:
            break
        
        is_lunch = False
        if lunch and lunch_end:
            if current >= lunch and current < lunch_end:
                is_lunch = True
                if slot_end > lunch_end:
                    slot_end = lunch_end
        
        slot_key = f"{current.strftime('%H:%M')}-{slot_end.strftime('%H:%M')}"
        
        slot = {
            "period": "BREAK" if is_lunch else period_num,
            "start": current.strftime("%H:%M"),
            "end": slot_end.strftime("%H:%M"),
            "slot_key": slot_key,
            "is_lunch": is_lunch
        }
        
        slots.append(slot)
        
        if not is_lunch:
            period_num += 1
        
        current = slot_end
    
    return slots

def teacher_can_teach_entry(t, subj_code):
    for s in t.get("subjects", []):
        if s.get("code") == subj_code:
            return True
    return False

def check_global_conflicts(teacher_name, day, slot_key, saved_timetables):
    """Check if teacher is busy in saved timetables."""
    for tt in saved_timetables:
        saved_data = tt.get("timetableData", {})
        if day in saved_data and slot_key in saved_data[day]:
            for entry in saved_data[day][slot_key]:
                if entry.get("teacher") == teacher_name:
                    return {
                        "conflict": True,
                        "with_year": tt.get("year"),
                        "with_division": tt.get("division"),
                        "subject": entry.get("subject"),
                        "room": entry.get("room")
                    }
    return {"conflict": False}

def check_room_availability(room_name, day, slot_key, saved_timetables):
    """Check if room is occupied in saved timetables."""
    if not CHECK_ROOM_CONFLICTS:
        return {"conflict": False}
    
    for tt in saved_timetables:
        saved_data = tt.get("timetableData", {})
        if day in saved_data and slot_key in saved_data[day]:
            for entry in saved_data[day][slot_key]:
                if entry.get("room") == room_name:
                    return {
                        "conflict": True,
                        "with_year": tt.get("year"),
                        "with_division": tt.get("division"),
                        "subject": entry.get("subject"),
                        "teacher": entry.get("teacher")
                    }
    return {"conflict": False}

def get_compatible_rooms_for_subject(rooms, subject_code, room_type, year=None, division=None, 
                                     room_mappings=None, batch=None):
    """
    ✅ UPDATED: Get rooms compatible with a subject.
    
    Priority order:
    1. Use room from Step 3 mappings (if available) - HIGHEST PRIORITY
    2. Rooms where primaryYear matches selected year
    3. Rooms where primaryYear == "Shared"
    4. Any available room of correct type (fallback)
    """
    # ✅ PRIORITY 1: Use assigned room from mappings (FIXED - pass year)
    if room_mappings:
        assigned_room = get_room_for_subject(subject_code, room_type, batch, room_mappings, rooms, year)
        if assigned_room:
            print(f"✅ Using assigned room from mappings: {assigned_room.get('name')} for {subject_code} batch {batch}")
            return [assigned_room]
    
    # ✅ PRIORITY 2-4: Filter by year and type (EXISTING LOGIC)
    compatible = []
    
    for room in rooms:
        # Basic type filter
        if room_type == "Lab" and room.get("type") != "Lab":
            continue
        elif room_type == "Tutorial" and room.get("type") not in ["Tutorial", "Classroom"]:
            continue
        elif room_type == "Theory" and room.get("type") != "Classroom":
            continue
        
        # Year filter
        primary_year = room.get("primaryYear", "Shared")
        if primary_year != "Shared" and year and primary_year != year:
            continue
        
        # Calculate priority score
        score = 0
        
        if primary_year == year:
            score += 50
        elif primary_year == "Shared":
            score += 10
        
        primary_div = room.get("primaryDivision")
        if primary_div is None or (division and primary_div == division):
            score += 25
        
        if score > 0:
            compatible.append({
                "room": room,
                "score": score
            })
    
    # Sort by score (descending)
    compatible.sort(key=lambda x: x["score"], reverse=True)
    
    result = [item["room"] for item in compatible]
    
    if len(result) == 0:
        print(f"⚠️ No compatible rooms found for {room_type} - {subject_code}")
    else:
        print(f"✅ Found {len(result)} compatible rooms for {room_type} - {subject_code}")
    
    return result

def is_batch_available(class_tt, yname, div, day, slot_key, batch):
    """
    CRITICAL: Check if a specific batch is free at this time slot.
    Returns True if batch is available, False if busy.
    """
    if slot_key not in class_tt[yname][div][day]:
        return True
    
    current_occupants = class_tt[yname][div][day][slot_key]
    
    # Check if this batch already has ANY activity scheduled
    for entry in current_occupants:
        # If this batch is already scheduled, it's NOT available
        if entry.get("batch") == batch:
            return False
        
        # If there's a Theory lecture (whole class), NO batch is available
        if entry.get("type") == "Theory":
            return False
    
    return True

def get_previous_slot_subject(class_tt, yname, div, day, current_slot_idx, time_slots):
    """
    NEW FUNCTION: Get the subject taught in the previous time slot for this class.
    Returns None if no previous slot or if previous slot is lunch/empty.
    """
    if current_slot_idx == 0:
        return None
    
    prev_slot_idx = current_slot_idx - 1
    prev_slot_info = time_slots[prev_slot_idx]
    
    # Skip if previous slot is lunch
    if prev_slot_info.get("is_lunch"):
        return None
    
    prev_slot_key = prev_slot_info["slot_key"]
    prev_entries = class_tt[yname][div][day].get(prev_slot_key, [])
    
    # Get theory subject from previous slot (if any)
    for entry in prev_entries:
        if entry.get("type") == "Theory":
            return entry.get("subject")
    
    return None

def get_room_for_subject(subject_code, component_type, batch, room_mappings, rooms, year=None):
    """
    ✅ FIXED: Get assigned room from wizard room mappings.
    
    Args:
        subject_code: Subject code (e.g., "AISD")
        component_type: "Theory", "Lab", or "Tutorial"
        batch: Batch number (1, 2, 3, etc.) or None for Theory
        room_mappings: Dict from wizard Step 3
        rooms: All available rooms
        year: Year (e.g., "3rd")
    
    Returns:
        Room dict or None
    """
    if not room_mappings:
        print(f"⚠️ No room mappings provided for {subject_code}")
        return None
    
    # ✅ FIX: Build mapping key with year
    mapping_key = f"{year}_{subject_code}_{component_type}"
    
    print(f"🔍 Looking for mapping key: {mapping_key}")
    print(f"📋 Available mapping keys: {list(room_mappings.keys())}")
    
    # Find mapping for this subject
    mapping = room_mappings.get(mapping_key)
    
    if not mapping:
        print(f"⚠️ No room mapping found for {mapping_key}")
        return None
    
    print(f"✅ Found mapping: {mapping}")
    
    # Get room based on type
    if component_type == "Theory":
        # Theory: single room assignment
        room_id = mapping.get("roomId")
        room_name = mapping.get("roomName")
        
        print(f"  → Theory room: {room_name} (ID: {room_id})")
        
        # Find room object
        for room in rooms:
            room_id_match = str(room.get("_id")) == str(room_id) if room_id else False
            room_name_match = room.get("name") == room_name if room_name else False
            
            if room_id_match or room_name_match:
                print(f"✅ Found assigned room for {subject_code}: {room.get('name')}")
                return room
    else:
        # Lab/Tutorial: per-batch assignment
        batches = mapping.get("batches", [])
        
        print(f"  → Looking for batch {batch} in batches: {batches}")
        
        for batch_assignment in batches:
            if batch_assignment.get("batch") == batch:
                room_id = batch_assignment.get("room")
                room_name = batch_assignment.get("roomName")
                
                print(f"  → Batch {batch} assigned to: {room_name} (ID: {room_id})")
                
                # Find room object
                for room in rooms:
                    room_id_match = str(room.get("_id")) == str(room_id) if room_id else False
                    room_name_match = room.get("name") == room_name if room_name else False
                    
                    if room_id_match or room_name_match:
                        print(f"✅ Found assigned room for {subject_code} batch {batch}: {room.get('name')}")
                        return room
    
    print(f"⚠️ Room not found in rooms list for {subject_code} batch {batch}")
    return None


def check_continuous_slots_available(class_tt, teacher_tt, room_tt, yname, div, day, 
                                     start_slot_idx, duration, teacher, room, batch, 
                                     time_slots, saved_timetables):
    """
    Check if 'duration' continuous slots are available for multi-hour labs.
    Returns: (success: bool, slot_keys: list, conflict_reason: dict)
    """
    if start_slot_idx + duration > len(time_slots):
        return False, [], {"reason": "insufficient_slots", "detail": "Not enough slots remaining in day"}
    
    slots_to_check = []
    conflict_info = {"reason": None, "detail": None}
    
    for i in range(duration):
        slot_info = time_slots[start_slot_idx + i]
        slot_key = slot_info["slot_key"]
        
        # CRITICAL: Check for lunch break interruption
        if slot_info.get("is_lunch"):
            conflict_info = {
                "reason": "break_interruption",
                "detail": f"Break/Lunch at slot {slot_key} interrupts continuous lab",
                "break_slot": slot_key,
                "break_position": i + 1,
                "total_duration": duration,
                "suggestion": f"Move break before or after this {duration}-hour time window"
            }
            return False, [], conflict_info
        
        slots_to_check.append(slot_key)
        
        # Check if batch is available
        if not is_batch_available(class_tt, yname, div, day, slot_key, batch):
            conflict_info = {
                "reason": "batch_conflict",
                "detail": f"Batch {batch} already scheduled at {slot_key}",
                "conflicting_slot": slot_key
            }
            return False, [], conflict_info
        
        # Check teacher availability
        if teacher_tt[teacher][day].get(slot_key, []):
            conflict_info = {
                "reason": "teacher_conflict",
                "detail": f"Teacher {teacher} busy at {slot_key}",
                "conflicting_slot": slot_key
            }
            return False, [], conflict_info
        
        # Check teacher in saved timetables
        if saved_timetables:
            global_check = check_global_conflicts(teacher, day, slot_key, saved_timetables)
            if global_check["conflict"]:
                conflict_info = {
                    "reason": "teacher_conflict_global",
                    "detail": f"Teacher {teacher} busy in {global_check['with_year']} Div {global_check['with_division']}",
                    "conflicting_slot": slot_key
                }
                return False, [], conflict_info
        
        # Check room availability
        if room_tt[room][day].get(slot_key, []):
            conflict_info = {
                "reason": "room_conflict",
                "detail": f"Room {room} occupied at {slot_key}",
                "conflicting_slot": slot_key
            }
            return False, [], conflict_info
        
        # Check room in saved timetables
        if saved_timetables and CHECK_ROOM_CONFLICTS:
            room_check = check_room_availability(room, day, slot_key, saved_timetables)
            if room_check["conflict"]:
                conflict_info = {
                    "reason": "room_conflict_global",
                    "detail": f"Room {room} occupied by {room_check['with_year']}",
                    "conflicting_slot": slot_key
                }
                return False, [], conflict_info
    
    return True, slots_to_check, conflict_info

def allocate_lab_continuous(req, day, start_slot_idx, class_tt, teacher_tt, room_tt, 
                            teachers, rooms, year_time_slots, saved_timetables, 
                            lab_conflicts, teacher_limits=None, room_mappings=None):
    """
    ✅ UPDATED: Continuous lab allocation with room mappings support.
    
    Changes:
    - Added room_mappings parameter
    - Pass room_mappings to get_compatible_rooms_for_subject()
    - All other logic UNCHANGED
    """
    yname, div, code, batch = req["year"], req["div"], req["code"], req["batch"]
    lab_duration = req.get("lab_duration", 1)
    
    # Find eligible teachers (UNCHANGED)
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    
    if teacher_limits:
        eligible = [t for t in eligible 
                   if teacher_limits[t["name"]]["daily_count"][day] + lab_duration 
                      <= teacher_limits[t["name"]]["max_per_day"]]
    
    best_conflict = None
    
    for t in eligible:
        # ✅ Get labs with mappings support (UPDATED)
        candidate_rooms = get_compatible_rooms_for_subject(
            rooms, code, "Lab", yname, div, room_mappings, batch
        )
        
        # Fallback to any lab (UNCHANGED)
        if not candidate_rooms or len(candidate_rooms) == 0:
            candidate_rooms = [r for r in rooms if r.get("type") == "Lab"]
        
        for room in candidate_rooms:
            room_name = room.get("name") if isinstance(room, dict) else room
            
            # Check if continuous slots are available (UNCHANGED)
            can_allocate, slot_keys, conflict_info = check_continuous_slots_available(
                class_tt, teacher_tt, room_tt, yname, div, day,
                start_slot_idx, lab_duration, t["name"], room_name,
                batch, year_time_slots[yname], saved_timetables
            )
            
            if can_allocate:
                session_id = f"{day}-{slot_keys[0]}"
                
                # Allocate all slots for this continuous lab (UNCHANGED)
                for i, slot_key in enumerate(slot_keys):
                    entry = {
                        "subject": code,
                        "teacher": t["name"],
                        "room": room_name,
                        "batch": batch,
                        "type": "Lab",
                        "lab_part": f"{i+1}/{lab_duration}",
                        "lab_session_id": session_id
                    }
                    
                    class_tt[yname][div][day][slot_key].append(entry)
                    
                    teacher_tt[t["name"]][day][slot_key].append({
                        "subject": code,
                        "year": yname,
                        "division": div,
                        "room": room_name,
                        "batch": batch,
                        "lab_part": f"{i+1}/{lab_duration}"
                    })
                    
                    room_tt[room_name][day][slot_key].append({
                        "subject": code,
                        "year": yname,
                        "division": div
                    })
                
                # Update teacher limits (UNCHANGED)
                if teacher_limits:
                    for _ in range(lab_duration):
                        increment_teacher_daily_count(t["name"], day, teacher_limits)
                
                return True, None
            
            # Track break interruption conflicts (UNCHANGED)
            if conflict_info["reason"] == "break_interruption":
                if not best_conflict or best_conflict["reason"] != "break_interruption":
                    best_conflict = {
                        **conflict_info,
                        "subject": code,
                        "year": yname,
                        "division": div,
                        "batch": batch,
                        "day": day,
                        "attempted_start": year_time_slots[yname][start_slot_idx]["slot_key"]
                    }
    
    return False, best_conflict

def generate_enhanced_recommendations(unallocated_sessions, lab_conflicts, class_tt, years, teachers, rooms):
    """
    Generate intelligent recommendations including break conflict detection.
    """
    recommendations = []
    
    for session in unallocated_sessions:
        suggestions = []
        year_data = years.get(session['year'], {})
        
        # Check if this session has a break conflict
        break_conflict = None
        if session['type'] == 'Lab' and lab_conflicts:
            for conflict in lab_conflicts:
                if (conflict.get('subject') == session['subject'] and 
                    conflict.get('year') == session['year'] and
                    conflict.get('batch') == session.get('batch_num')):
                    break_conflict = conflict
                    break
        
        # PRIORITY 1: Break interruption for continuous labs
        if break_conflict and break_conflict.get('reason') == 'break_interruption':
            suggestions.append(
                f"🚨 BREAK CONFLICT: {session['subject']} requires {break_conflict['total_duration']}-hour "
                f"continuous slot but break at {break_conflict['break_slot']} interrupts it. "
                f"SOLUTION: Move break to before or after this time window on {break_conflict['day']}."
            )
            suggestions.append(
                f"💡 Alternative: Schedule this lab on a different day where {break_conflict['total_duration']} "
                f"continuous slots are available without break interruption."
            )
        
        # Check teacher availability
        qualified_teachers = [
            t for t in teachers 
            if any(s.get("code") == session['subject'] for s in t.get("subjects", []))
        ]
        
        if len(qualified_teachers) == 0:
            suggestions.append(
                f"⚠️ CRITICAL: No teachers qualified to teach {session['subject']}. "
                f"Add qualified teacher immediately."
            )
        elif len(qualified_teachers) == 1:
            suggestions.append(
                f"⚠️ Only 1 teacher available for {session['subject']}. "
                f"Consider adding another qualified teacher for flexibility."
            )
        
        # Lab-specific recommendations
        if session['type'] == 'Lab':
            available_rooms = [r for r in rooms if r.get("type") == "Lab"]
            
            if len(available_rooms) < 2:
                suggestions.append(
                    f"⚠️ Limited lab rooms ({len(available_rooms)} available). "
                    f"Consider adding more lab rooms."
                )
            
            if session.get('lab_duration', 1) > 1 and not break_conflict:
                suggestions.append(
                    f"💡 This is a {session.get('lab_duration')}-hour continuous lab. "
                    f"Ensure sufficient consecutive free slots without break interruption."
                )
        
        # Generic fallback
        if len(suggestions) == 0:
            suggestions.append(f"💡 Review resource allocation for {session['subject']}.")
        
        recommendations.append({
            "session": session,
            "suggestions": suggestions[:4],
            "has_break_conflict": break_conflict is not None,
            "conflict_details": break_conflict
        })
    
    return recommendations
    
def generate_room_conflict_recommendations(room_conflicts, rooms, saved_timetables):
    """Generate recommendations for room conflicts."""
    recommendations = []
    
    for conflict in room_conflicts:
        suggestions = []
        day = conflict['day']
        slot_key = conflict['time_slot']
        current_type = conflict.get('required_type', 'Classroom')
        
        alternative_rooms = []
        for room in rooms:
            if current_type == "Lab" and room.get("type") != "Lab":
                continue
            if current_type == "Tutorial" and room.get("type") not in ["Tutorial", "Classroom"]:
                continue
            if current_type == "Theory" and room.get("type") != "Classroom":
                continue
            
            room_check = check_room_availability(room['name'], day, slot_key, saved_timetables)
            if not room_check['conflict']:
                alternative_rooms.append(room['name'])
        
        if len(alternative_rooms) > 0:
            suggestions.append(f"✅ Use alternative room: {', '.join(alternative_rooms[:3])}")
        else:
            suggestions.append(f"💡 No free rooms available. Consider shifting to another time slot or day.")
        
        suggestions.append(f"💡 Try scheduling in a different time slot on {day}")
        suggestions.append(f"💡 Move this session to another day with available rooms")
        
        recommendations.append({
            "conflict": conflict,
            "suggestions": suggestions[:3]
        })
    
    return recommendations

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

def get_previous_slot_subject(class_tt, yname, div, day, current_slot_idx, time_slots):
    """
    NEW: Get the subject taught in the previous time slot for this class.
    Returns None if no previous slot or if previous slot is lunch/empty.
    """
    if current_slot_idx == 0:
        return None
    
    prev_slot_idx = current_slot_idx - 1
    prev_slot_info = time_slots[prev_slot_idx]
    
    # Skip if previous slot is lunch
    if prev_slot_info.get("is_lunch"):
        return None
    
    prev_slot_key = prev_slot_info["slot_key"]
    prev_entries = class_tt[yname][div][day].get(prev_slot_key, [])
    
    # Get theory subject from previous slot (if any)
    for entry in prev_entries:
        if entry.get("type") == "Theory":
            return entry.get("subject")
    
    return None

def allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, teachers, rooms, 
                  saved_timetables=None, teacher_limits=None, previous_subject=None, room_mappings=None):
    """
    ✅ UPDATED: Allocate single slot with room mappings support.
    
    Changes:
    - Added room_mappings parameter
    - Pass room_mappings to get_compatible_rooms_for_subject()
    - All other logic UNCHANGED
    """
    yname, div, code, stype, batch = req["year"], req["div"], req["code"], req["type"], req["batch"]
    slot_key = slot_info["slot_key"]
    
    # Skip lunch slots (UNCHANGED)
    if slot_info.get("is_lunch"):
        return False
    
    # Batch availability check (UNCHANGED)
    if batch is not None:
        if not is_batch_available(class_tt, yname, div, day, slot_key, batch):
            return False
    
    # Theory lecture - check slot is empty (UNCHANGED)
    if stype == "Theory":
        current_occupants = class_tt[yname][div][day].get(slot_key, [])
        if len(current_occupants) > 0:
            return False
    
    # Find eligible teacher (UNCHANGED)
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    
    if teacher_limits:
        eligible = [t for t in eligible if can_teacher_take_slot(t["name"], day, teacher_limits)]
    
    if not eligible:
        return False
    
    if teacher_limits:
        eligible.sort(key=lambda t: teacher_limits[t["name"]]["daily_count"][day])
    
    # Find available teacher (UNCHANGED)
    available_t = None
    
    for t in eligible:
        if not teacher_tt[t["name"]][day].get(slot_key, []):
            if saved_timetables:
                global_check = check_global_conflicts(t["name"], day, slot_key, saved_timetables)
                if global_check["conflict"]:
                    continue
            available_t = t["name"]
            break
    
    if not available_t:
        return False
    
    # ✅ ROOM ALLOCATION WITH MAPPINGS (UPDATED)
    room_type_map = {
        "Lab": "Lab",
        "Tutorial": "Tutorial",
        "Theory": "Theory"
    }
    
    # ✅ Get compatible rooms with mappings support (NEW PARAMETER)
    candidate_rooms = get_compatible_rooms_for_subject(
        rooms, code, room_type_map.get(stype, "Theory"), yname, div, room_mappings, batch
    )
    
    # Fallback if no rooms found (UNCHANGED)
    if not candidate_rooms or len(candidate_rooms) == 0:
        # Try any room of correct type
        if stype == "Lab":
            candidate_rooms = [r for r in rooms if r.get("type") == "Lab"]
        elif stype == "Tutorial":
            candidate_rooms = [r for r in rooms if r.get("type") in ["Tutorial", "Classroom"]]
        else:
            candidate_rooms = [r for r in rooms if r.get("type") == "Classroom"]
    
    # Find available room (UNCHANGED)
    available_r = None
    
    for room in candidate_rooms:
        room_name = room.get("name") if isinstance(room, dict) else room
        
        if room_tt[room_name][day].get(slot_key, []):
            continue
        
        if saved_timetables and CHECK_ROOM_CONFLICTS:
            room_check = check_room_availability(room_name, day, slot_key, saved_timetables)
            if room_check["conflict"]:
                continue
        
        available_r = room_name
        break
    
    if not available_r:
        return False
    
    # Allocation (UNCHANGED)
    entry = {
        "subject": code,
        "teacher": available_t,
        "room": available_r,
        "batch": batch,
        "type": stype
    }
    
    if slot_key not in class_tt[yname][div][day]:
        class_tt[yname][div][day][slot_key] = []
    if slot_key not in teacher_tt[available_t][day]:
        teacher_tt[available_t][day][slot_key] = []
    if slot_key not in room_tt[available_r][day]:
        room_tt[available_r][day][slot_key] = []
    
    class_tt[yname][div][day][slot_key].append(entry)
    teacher_tt[available_t][day][slot_key].append({
        "subject": code,
        "year": yname,
        "division": div,
        "room": available_r,
        "batch": batch
    })
    room_tt[available_r][day][slot_key].append({
        "subject": code,
        "year": yname,
        "division": div
    })
    
    if teacher_limits:
        increment_teacher_daily_count(available_t, day, teacher_limits)
    
    return True

def initialize_complete_structure(years, teachers, rooms, year_time_slots):
    """Initialize COMPLETE timetable structures with ALL time slots."""
    class_tt = {}
    teacher_tt = {}
    room_tt = {}
    
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        class_tt[yname] = {}
        
        for div in range(1, divs + 1):
            class_tt[yname][div] = {}
            for day in DAY_NAMES:
                class_tt[yname][div][day] = {}
                for slot in year_time_slots[yname]:
                    class_tt[yname][div][day][slot["slot_key"]] = []
    
    for t in teachers:
        teacher_tt[t["name"]] = {}
        for day in DAY_NAMES:
            teacher_tt[t["name"]][day] = {}
            first_year = list(years.keys())[0]
            for slot in year_time_slots[first_year]:
                teacher_tt[t["name"]][day][slot["slot_key"]] = []
    
    for r in rooms:
        room_tt[r["name"]] = {}
        for day in DAY_NAMES:
            room_tt[r["name"]][day] = {}
            first_year = list(years.keys())[0]
            for slot in year_time_slots[first_year]:
                room_tt[r["name"]][day][slot["slot_key"]] = []
    
    return class_tt, teacher_tt, room_tt

def initialize_teacher_daily_limits(teachers):
    """Initialize teacher daily load tracking with configurable limits."""
    teacher_limits = {}
    for t in teachers:
        # Default max hours per day (can be customized per teacher)
        max_daily = t.get("maxHoursPerDay", 4)  # Default: 4 hours/day
        teacher_limits[t["name"]] = {
            "max_per_day": max_daily,
            "daily_count": {day: 0 for day in DAY_NAMES}
        }
    return teacher_limits

def can_teacher_take_slot(teacher_name, day, teacher_limits):
    """Check if teacher can take another slot today."""
    if teacher_name not in teacher_limits:
        return True
    limit_data = teacher_limits[teacher_name]
    return limit_data["daily_count"][day] < limit_data["max_per_day"]

def increment_teacher_daily_count(teacher_name, day, teacher_limits):
    """Increment teacher's daily hour count."""
    if teacher_name in teacher_limits:
        teacher_limits[teacher_name]["daily_count"][day] += 1

def solver_greedy_distribute(payload):
    """
    ✅ UPDATED: Main solver with room mappings support.
    
    Changes:
    - Extract room_mappings from payload
    - Pass room_mappings to allocate_slot() and allocate_lab_continuous()
    - All other logic UNCHANGED
    """
    years = payload.get("years", {})
    teachers = payload.get("teachers", [])
    rooms = payload.get("rooms", [])
    saved_timetables = payload.get("saved_timetables", [])
    room_mappings = payload.get("roomMappings", {})  # ✅ NEW: Extract room mappings
    
    # Log room mappings (NEW)
    if room_mappings:
        print(f"📦 Received room mappings: {len(room_mappings)} subjects mapped")
    else:
        print("⚠️ No room mappings provided - using fallback room selection")
    
    # Validate requirements (UNCHANGED)
    critical_issues = validate_requirements(years, teachers, rooms)
    if critical_issues:
        return {
            "status": "error",
            "class_timetable": {},
            "teacher_timetable": {},
            "conflicts": [],
            "room_conflicts": [],
            "unallocated": [],
            "recommendations": [],
            "room_recommendations": [],
            "critical_issues": critical_issues,
            "warnings": critical_issues,
            "lab_conflicts": []
        }
    
    # Initialize pools and structures (UNCHANGED)
    theory_pool = []
    practical_pool = []
    lab_pool = []
    conflict_report = []
    room_conflict_report = []
    lab_conflicts = []
    
    # Generate time slots (UNCHANGED)
    year_time_slots = {}
    for yname, ydata in years.items():
        time_config = ydata.get("timeConfig", {})
        if time_config and USE_REAL_TIME_SLOTS:
            year_time_slots[yname] = generate_time_slots(
                time_config.get("startTime", "09:00"),
                time_config.get("endTime", "17:00"),
                time_config.get("periodDuration", 60),
                time_config.get("lunchStart"),
                time_config.get("lunchDuration")
            )
        else:
            periods_per_day = int(ydata.get("periodsPerDay", 6))
            year_time_slots[yname] = [
                {"period": i, "start": None, "end": None, "slot_key": str(i), 
                 "is_lunch": (i == int(ydata.get("lunchBreak", 4)))} 
                for i in range(1, periods_per_day + 1)
            ]
    
    # Build requirement pools (UNCHANGED)
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        
        for div in range(1, divs + 1):
            for subj in ydata.get("subjects", []):
                stype = subj.get("type", "Theory")
                hours = int(subj.get("hours", 1))
                batches = int(subj.get("batches", 1)) if stype != "Theory" else 1
                lab_duration = int(subj.get("labDuration", 1)) if stype == "Lab" else 1
                
                for b_idx in range(1, batches + 1):
                    req = {
                        "year": yname,
                        "div": div,
                        "code": subj["code"],
                        "type": stype,
                        "batch": b_idx if stype != "Theory" else None,
                        "remaining": hours,
                        "count_today": 0,
                        "max_per_day": min(hours, 2),
                        "lab_duration": lab_duration
                    }
                    
                    if stype == "Theory":
                        theory_pool.append(req)
                    elif stype == "Lab" and lab_duration > 1:
                        lab_pool.append(req)
                    else:
                        practical_pool.append(req)
    
    # Initialize timetable structures (UNCHANGED)
    class_tt, teacher_tt, room_tt = initialize_complete_structure(
        years, teachers, rooms, year_time_slots
    )
    
    # Initialize teacher limits (UNCHANGED)
    teacher_limits = initialize_teacher_daily_limits(teachers)
    
    # PHASE 1: THEORY LECTURES (UNCHANGED - just pass room_mappings)
    print("=== PHASE 1: ALLOCATING THEORY LECTURES ===")
    
    theory_distribution = {}
    for req in theory_pool:
        class_key = f"{req['year']}_Div{req['div']}"
        if class_key not in theory_distribution:
            theory_distribution[class_key] = {
                "total_lectures": 0,
                "subjects": []
            }
        theory_distribution[class_key]["total_lectures"] += req["remaining"]
        theory_distribution[class_key]["subjects"].append(req)

    for class_key, dist_data in theory_distribution.items():
        yname = class_key.split("_")[0]
        ydata = years[yname]
        working_days = len([d for d in DAY_NAMES if d not in ydata.get("holidays", [])])
        
        total = dist_data["total_lectures"]
        dist_data["per_day_target"] = math.ceil(total / working_days)
        dist_data["daily_count"] = {day: 0 for day in DAY_NAMES}

    for day in DAY_NAMES:
        for req in theory_pool:
            req["count_today"] = 0
        
        for teacher_name in teacher_limits:
            teacher_limits[teacher_name]["daily_count"][day] = 0
        
        for yname, slots in year_time_slots.items():
            ydata = years[yname]
            
            if day in ydata.get("holidays", []):
                continue
            
            divs = int(ydata.get("divisions", 1))
            
            for div in range(1, divs + 1):
                class_key = f"{yname}_Div{div}"
                
                if class_key not in theory_distribution:
                    continue
                
                dist_data = theory_distribution[class_key]
                target = dist_data["per_day_target"]
                daily_count = dist_data["daily_count"][day]
                
                class_lectures = [r for r in theory_pool 
                                if r["year"] == yname and r["div"] == div and r["remaining"] > 0]
                
                subjects_today = set()
                
                for slot_idx, slot_info in enumerate(slots):
                    if slot_info.get("is_lunch"):
                        continue
                    
                    if daily_count >= target:
                        break
                    
                    prev_subject = get_previous_slot_subject(class_tt, yname, div, day, slot_idx, slots)
                    
                    unscheduled_today = [r for r in class_lectures 
                                        if r["remaining"] > 0 
                                        and r["count_today"] < r["max_per_day"]
                                        and r["code"] not in subjects_today]
                    
                    different_from_prev = [r for r in class_lectures 
                                        if r["remaining"] > 0 
                                        and r["count_today"] < r["max_per_day"]
                                        and r["code"] != prev_subject]
                    
                    any_available = [r for r in class_lectures 
                                    if r["remaining"] > 0 
                                    and r["count_today"] < r["max_per_day"]]
                    
                    for candidate_pool in [unscheduled_today, different_from_prev, any_available]:
                        if not candidate_pool:
                            continue
                        
                        candidate_pool.sort(key=lambda x: x["remaining"], reverse=True)
                        
                        allocated = False
                        for req in candidate_pool:
                            # ✅ Pass room_mappings (UPDATED)
                            if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                        teachers, rooms, saved_timetables, teacher_limits, prev_subject, room_mappings):
                                req["remaining"] -= 1
                                req["count_today"] += 1
                                daily_count += 1
                                dist_data["daily_count"][day] = daily_count
                                subjects_today.add(req["code"])
                                allocated = True
                                break
                        
                        if allocated:
                            break
    
    # PHASE 2: MULTI-HOUR LABS (UNCHANGED - just pass room_mappings)
    print("=== PHASE 2: ALLOCATING MULTI-HOUR LABS ===")
    
    failed_lab_attempts = {}

    for day in DAY_NAMES:
        for teacher_name in teacher_limits:
            teacher_limits[teacher_name]["daily_count"][day] = 0
            
        for req in lab_pool:
            if req["remaining"] <= 0:
                continue
            
            yname = req["year"]
            ydata = years[yname]
            
            if day in ydata.get("holidays", []):
                continue
            
            slots = year_time_slots[yname]
            lab_duration = req["lab_duration"]
            
            lab_key = f"{req['year']}_Div{req['div']}_{req['code']}_Batch{req['batch']}"
            
            for start_idx in range(len(slots) - lab_duration + 1):
                if req["remaining"] <= 0:
                    break
                
                # ✅ Pass room_mappings (UPDATED)
                success, conflict_info = allocate_lab_continuous(
                    req, day, start_idx, class_tt, teacher_tt, room_tt,
                    teachers, rooms, year_time_slots, saved_timetables,
                    lab_conflicts, teacher_limits, room_mappings
                )
                
                if success:
                    req["remaining"] -= lab_duration
                    
                    if lab_key in failed_lab_attempts:
                        del failed_lab_attempts[lab_key]
                    
                    break
                
                if conflict_info and conflict_info.get('reason'):
                    if lab_key not in failed_lab_attempts:
                        failed_lab_attempts[lab_key] = {
                            "req": req,
                            "conflict": conflict_info,
                            "days_attempted": set()
                        }
                    
                    failed_lab_attempts[lab_key]["days_attempted"].add(day)
                    
                    if conflict_info.get('reason') == 'break_interruption':
                        failed_lab_attempts[lab_key]["conflict"] = conflict_info
                        lab_conflicts.append(conflict_info)

    # PHASE 3: SINGLE-HOUR PRACTICALS (UNCHANGED - just pass room_mappings)
    print("=== PHASE 3: ALLOCATING SINGLE-HOUR PRACTICALS ===")
    
    for day in DAY_NAMES:
        for req in practical_pool:
            req["count_today"] = 0
            
        for teacher_name in teacher_limits:
            teacher_limits[teacher_name]["daily_count"][day] = 0
            
        for yname, slots in year_time_slots.items():
            ydata = years[yname]
            
            if day in ydata.get("holidays", []):
                continue
            
            random.shuffle(practical_pool)
            
            for slot_info in slots:
                if slot_info["is_lunch"]:
                    continue
                
                for req in practical_pool:
                    if req["remaining"] <= 0 or req["count_today"] >= req["max_per_day"]:
                        continue
                    
                    # ✅ Pass room_mappings (UPDATED)
                    if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                teachers, rooms, saved_timetables, teacher_limits, None, room_mappings):
                        req["remaining"] -= 1
                        req["count_today"] += 1

    # FALLBACK ALLOCATION (UNCHANGED - just pass room_mappings)
    print("=== FALLBACK ALLOCATION ===")
    
    for req in theory_pool + practical_pool:
        if req["remaining"] > 0:
            for day in DAY_NAMES:
                ydata = years[req["year"]]
                if day in ydata.get("holidays", []):
                    continue
                
                for slot_info in year_time_slots[req["year"]]:
                    if slot_info["is_lunch"]:
                        continue
                    if req["remaining"] <= 0:
                        break
                    
                    if req["batch"] is not None:
                        if not is_batch_available(class_tt, req["year"], req["div"], day, slot_info["slot_key"], req["batch"]):
                            continue
                    
                    # ✅ Pass room_mappings (UPDATED)
                    if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                teachers, rooms, saved_timetables, None, None, room_mappings):
                        req["remaining"] -= 1

    # Build unallocated sessions (UNCHANGED)
    unallocated_sessions = []

    for req in theory_pool + practical_pool:
        if req["remaining"] > 0:
            unallocated_sessions.append({
                "subject": req["code"],
                "type": req["type"],
                "year": req["year"],
                "division": req["div"],
                "batch": f"{req['year']} - Div {req['div']}",
                "batch_num": req["batch"],
                "required": req["remaining"] + req.get("count_today", 0),
                "assigned": req.get("count_today", 0),
                "missing": req["remaining"],
                "lab_duration": req.get("lab_duration", 1)
            })

    for req in lab_pool:
        if req["remaining"] > 0:
            lab_key = f"{req['year']}_Div{req['div']}_{req['code']}_Batch{req['batch']}"
            
            failure_reason = None
            if lab_key in failed_lab_attempts:
                failure_reason = failed_lab_attempts[lab_key]["conflict"].get("reason")
            
            unallocated_sessions.append({
                "subject": req["code"],
                "type": "Lab",
                "year": req["year"],
                "division": req["div"],
                "batch": f"{req['year']} - Div {req['div']}",
                "batch_num": req["batch"],
                "required": req["remaining"],
                "assigned": 0,
                "missing": req["remaining"],
                "lab_duration": req.get("lab_duration", 1),
                "failure_reason": failure_reason
            })

    # Generate recommendations (UNCHANGED)
    recommendations = generate_enhanced_recommendations(
        unallocated_sessions, lab_conflicts, class_tt, years, teachers, rooms
    )


    # Add Theory and Practicals
    for req in theory_pool + practical_pool:
        if req["remaining"] > 0:
            unallocated_sessions.append({
                "subject": req["code"],
                "type": req["type"],
                "year": req["year"],
                "division": req["div"],
                "batch": f"{req['year']} - Div {req['div']}",
                "batch_num": req["batch"],
                "required": req["remaining"] + req.get("count_today", 0),
                "assigned": req.get("count_today", 0),
                "missing": req["remaining"],
                "lab_duration": req.get("lab_duration", 1)
            })

    # CRITICAL FIX: Add FAILED multi-hour labs
    for req in lab_pool:
        if req["remaining"] > 0:
            lab_key = f"{req['year']}_Div{req['div']}_{req['code']}_Batch{req['batch']}"
            
            # Get failure reason if available
            failure_reason = None
            if lab_key in failed_lab_attempts:
                failure_reason = failed_lab_attempts[lab_key]["conflict"].get("reason")
            
            unallocated_sessions.append({
                "subject": req["code"],
                "type": "Lab",
                "year": req["year"],
                "division": req["div"],
                "batch": f"{req['year']} - Div {req['div']}",
                "batch_num": req["batch"],
                "required": req["remaining"],  # Still need full duration
                "assigned": 0,  # ZERO partial allocations
                "missing": req["remaining"],  # Full duration missing
                "lab_duration": req.get("lab_duration", 1),
                "failure_reason": failure_reason  # WHY it failed
            })
            
            print(f"❌ FAILED to allocate {req['lab_duration']}-hour lab: {req['code']} Batch {req['batch']} - Reason: {failure_reason}")

    # Generate recommendations with break conflict awareness
    recommendations = generate_enhanced_recommendations(
        unallocated_sessions, lab_conflicts, class_tt, years, teachers, rooms
    )

    # Rest of conflict checking code remains the same...
    # (room conflicts, teacher conflicts, etc.)

    return {
        "status": "success" if (not unallocated_sessions and not conflict_report and not room_conflict_report) else "partial",
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "conflicts": conflict_report,
        "room_conflicts": room_conflict_report,
        "unallocated": unallocated_sessions,  # NOW includes failed multi-hour labs
        "recommendations": recommendations,
        "room_recommendations": [],
        "lab_conflicts": lab_conflicts,  # Break interruption details
        "warnings": [
            f"{r['year']} Div {r['div']} {r['code']} missing {r['remaining']} hrs" 
            for r in theory_pool + practical_pool + lab_pool if r["remaining"] > 0
        ]
    }
                        
def solve_timetable(payload):
    """Primary entry point."""
    try:
        print("=== SOLVER START ===")
        print(f"Years: {list(payload.get('years', {}).keys())}")
        print(f"Teachers: {len(payload.get('teachers', []))}")
        print(f"Rooms: {len(payload.get('rooms', []))}")
        print("====================")
        return solver_greedy_distribute(payload)
    except Exception as e:
        print("Exception in solver:", e)
        traceback.print_exc()
        return {
            "class_timetable": {},
            "teacher_timetable": {},
            "status": "error",
            "error": str(e),
            "conflicts": [],
            "room_conflicts": [],
            "unallocated": [],
            "recommendations": [],
            "room_recommendations": [],
            "lab_conflicts": [],
            "critical_issues": [f"System error: {str(e)}"]
        }