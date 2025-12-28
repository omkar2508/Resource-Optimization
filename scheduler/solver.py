# scheduler/solver.py
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
    """
    Generate time slots INCLUDING breaks.
    All slots (classes AND breaks) are returned.
    """
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
        
        # Check if this slot overlaps with lunch
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
    """
    CRITICAL: Check if room is occupied in saved timetables.
    """
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

def generate_smart_recommendations(unallocated_sessions, class_tt, years, teachers, rooms):
    """Generate intelligent recommendations."""
    recommendations = []
    
    for session in unallocated_sessions:
        suggestions = []
        year_data = years.get(session['year'], {})
        
        qualified_teachers = [
            t for t in teachers 
            if any(s.get("code") == session['subject'] for s in t.get("subjects", []))
        ]
        
        if len(qualified_teachers) == 0:
            suggestions.append(f"⚠️ CRITICAL: No teachers qualified to teach {session['subject']}. Add qualified teacher immediately.")
        elif len(qualified_teachers) == 1:
            suggestions.append(f"⚠️ Only 1 teacher available for {session['subject']}. Consider adding another qualified teacher.")
        
        subject_type = session['type']
        if subject_type == "Lab":
            available_rooms = [r for r in rooms if r.get("type") == "Lab"]
            if len(available_rooms) < 2:
                suggestions.append(f"⚠️ Limited lab rooms ({len(available_rooms)} available). Consider adding more lab rooms.")
        elif subject_type == "Tutorial":
            available_rooms = [r for r in rooms if r.get("type") in ["Tutorial", "Classroom"]]
            if len(available_rooms) < 3:
                suggestions.append(f"⚠️ Limited tutorial rooms. Consider designating more rooms.")
        
        if len(suggestions) == 0:
            suggestions.append(f"💡 Review resource allocation for {session['subject']}.")
        
        recommendations.append({
            "session": session,
            "suggestions": suggestions[:3]
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
        
        # Find alternative rooms
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

def validate_requirements(years, teachers, rooms):
    """Validate basic requirements."""
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
        
        labs = [s for s in subjects if s.get("type") == "Lab"]
        lab_rooms = [r for r in rooms if r.get("type") == "Lab"]
        if len(labs) > 0 and len(lab_rooms) == 0:
            issues.append(f"WARNING: {year_name} has lab subjects but no lab rooms defined.")
    
    return issues

def allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, teachers, rooms, saved_timetables=None):
    """
    Allocate a time slot with conflict checking.
    MAINTAINS v1.1 LOGIC: Theory-first, parallel batches, quota-based distribution.
    """
    yname, div, code, stype, batch = req["year"], req["div"], req["code"], req["type"], req["batch"]
    slot_key = slot_info["slot_key"]
    
    # Don't allocate during breaks
    if slot_info.get("is_lunch"):
        return False
    
    current_occupants = class_tt[yname][div][day].get(slot_key, [])
    
    # RULE 1: Theory cannot coexist with anything (v1.1 logic)
    if any(occ["type"] == "Theory" for occ in current_occupants):
        return False
    if stype == "Theory" and len(current_occupants) > 0:
        return False
    
    # Find eligible teacher
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    available_t = None
    
    for t in eligible:
        if not teacher_tt[t["name"]][day].get(slot_key, []):
            # Check global teacher conflicts
            if saved_timetables:
                global_check = check_global_conflicts(t["name"], day, slot_key, saved_timetables)
                if global_check["conflict"]:
                    continue
            available_t = t["name"]
            break
    
    if not available_t:
        return False
    
    # Find available room with GLOBAL ROOM CONFLICT CHECK
    available_r = None
    
    if stype == "Lab":
        candidate_rooms = [r for r in rooms if r["type"] == "Lab"]
    elif stype == "Tutorial":
        candidate_rooms = [r for r in rooms if r["type"] in ["Tutorial", "Classroom"]]
    else:
        candidate_rooms = [r for r in rooms if r["type"] == "Classroom"]
    
    for room in candidate_rooms:
        # Check if room is free in current timetable
        if room_tt[room["name"]][day].get(slot_key, []):
            continue
        
        # CRITICAL: Check if room is free in saved timetables
        if saved_timetables and CHECK_ROOM_CONFLICTS:
            room_check = check_room_availability(room["name"], day, slot_key, saved_timetables)
            if room_check["conflict"]:
                continue
        
        available_r = room["name"]
        break
    
    if not available_r:
        return False
    
    # Allocate the slot
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
    
    return True

def initialize_complete_structure(years, teachers, rooms, year_time_slots):
    """
    Initialize COMPLETE timetable structures with ALL time slots.
    This ensures breaks appear as empty slots, not missing rows.
    """
    class_tt = {}
    teacher_tt = {}
    room_tt = {}
    
    # Initialize class timetables
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        class_tt[yname] = {}
        
        for div in range(1, divs + 1):
            class_tt[yname][div] = {}
            for day in DAY_NAMES:
                class_tt[yname][div][day] = {}
                for slot in year_time_slots[yname]:
                    class_tt[yname][div][day][slot["slot_key"]] = []
    
    # Initialize teacher timetables with ALL time slots
    for t in teachers:
        teacher_tt[t["name"]] = {}
        for day in DAY_NAMES:
            teacher_tt[t["name"]][day] = {}
            first_year = list(years.keys())[0]
            for slot in year_time_slots[first_year]:
                teacher_tt[t["name"]][day][slot["slot_key"]] = []
    
    # Initialize room timetables with ALL time slots
    for r in rooms:
        room_tt[r["name"]] = {}
        for day in DAY_NAMES:
            room_tt[r["name"]][day] = {}
            first_year = list(years.keys())[0]
            for slot in year_time_slots[first_year]:
                room_tt[r["name"]][day][slot["slot_key"]] = []
    
    return class_tt, teacher_tt, room_tt

def solver_greedy_distribute(payload):
    years = payload.get("years", {})
    teachers = payload.get("teachers", [])
    rooms = payload.get("rooms", [])
    saved_timetables = payload.get("saved_timetables", [])
    
    # STEP 1: Pre-validation
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
            "warnings": critical_issues
        }
    
    theory_pool = []
    practical_pool = []
    daily_quotas = {}  # MAINTAINED from v1.1
    conflict_report = []
    room_conflict_report = []
    
    # Generate time slots for each year
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
            # Fallback to period-based slots
            periods_per_day = int(ydata.get("periodsPerDay", 6))
            year_time_slots[yname] = [
                {"period": i, "start": None, "end": None, "slot_key": str(i), "is_lunch": (i == int(ydata.get("lunchBreak", 4)))} 
                for i in range(1, periods_per_day + 1)
            ]
    
    # STEP 2: Build requirement pools WITH QUOTA SYSTEM (v1.1 logic)
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        working_days_count = int(ydata.get("daysPerWeek", 5))
        
        for div in range(1, divs + 1):
            class_key = f"{yname}_{div}"
            total_theory_hours = 0
            total_practical_hours = 0
            
            for subj in ydata.get("subjects", []):
                stype = subj.get("type", "Theory")
                hours = int(subj.get("hours", 1))
                batches = int(subj.get("batches", 1)) if stype != "Theory" else 1
                
                for b_idx in range(1, batches + 1):
                    req = {
                        "year": yname,
                        "div": div,
                        "code": subj["code"],
                        "type": stype,
                        "batch": b_idx if stype != "Theory" else None,
                        "remaining": hours,
                        "count_today": 0,  # CRITICAL: Track daily count (v1.1)
                        "max_per_day": math.ceil(hours / working_days_count)  # Subject-specific limit (v1.1)
                    }
                    
                    if stype == "Theory":
                        theory_pool.append(req)
                        total_theory_hours += hours
                    else:
                        practical_pool.append(req)
                        total_practical_hours += hours
            
            # MAINTAINED: Daily quotas from v1.1
            daily_quotas[class_key] = {
                "Theory": math.ceil(total_theory_hours / working_days_count),
                "Practical": math.ceil(total_practical_hours / working_days_count)
            }
    
    # Initialize COMPLETE structures
    class_tt, teacher_tt, room_tt = initialize_complete_structure(
        years, teachers, rooms, year_time_slots
    )
    
    # STEP 3: Main scheduling loop WITH QUOTA-BASED DISTRIBUTION (v1.1 logic)
    for day in DAY_NAMES:
        # CRITICAL: Reset daily counters (v1.1)
        for r in theory_pool + practical_pool:
            r["count_today"] = 0
        
        # MAINTAINED: Daily progress tracking (v1.1)
        daily_progress = {k: {"Theory": 0, "Practical": 0} for k in daily_quotas.keys()}
        
        for yname, slots in year_time_slots.items():
            ydata = years[yname]
            
            if day in ydata.get("holidays", []):
                continue
            
            for slot_info in slots:
                if slot_info["is_lunch"]:
                    continue  # Skip breaks during allocation
                
                # MAINTAINED: Randomize for fairness (v1.1)
                random.shuffle(theory_pool)
                random.shuffle(practical_pool)
                
                divs = int(ydata.get("divisions", 1))
                for div in range(1, divs + 1):
                    class_key = f"{yname}_{div}"
                    quota = daily_quotas.get(class_key, {"Theory": 0, "Practical": 0})
                    progress = daily_progress.get(class_key, {"Theory": 0, "Practical": 0})
                    
                    scheduled_in_this_slot = False
                    
                    # RULE 2: Theory first (v1.1 logic - LECTURE-FIRST SCHEDULING)
                    if progress["Theory"] < quota["Theory"]:
                        for req in theory_pool:
                            if (req["year"] == yname and req["div"] == div and 
                                req["remaining"] > 0 and req["count_today"] < req["max_per_day"]):
                                
                                if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                               teachers, rooms, saved_timetables):
                                    req["remaining"] -= 1
                                    req["count_today"] += 1
                                    progress["Theory"] += 1
                                    scheduled_in_this_slot = True
                                    break
                    
                    # RULE 3: Practicals with parallel batch support (v1.1 logic - PARALLEL BATCHES)
                    if not scheduled_in_this_slot and progress["Practical"] < quota["Practical"]:
                        for req in practical_pool:
                            if (req["year"] == yname and req["div"] == div and 
                                req["remaining"] > 0 and req["count_today"] < req["max_per_day"]):
                                
                                # CRITICAL: Check if batch already scheduled in this slot (prevents duplicates)
                                if any(occ["batch"] == req["batch"] for occ in class_tt[yname][div][day][slot_info["slot_key"]]):
                                    continue
                                
                                if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                               teachers, rooms, saved_timetables):
                                    req["remaining"] -= 1
                                    req["count_today"] += 1
                                    # Only count towards quota if not overlapping with other practicals
                                    if not any(entry["type"] != "Theory" for entry in class_tt[yname][div][day][slot_info["slot_key"]][:-1]):
                                        progress["Practical"] += 1
    
    # STEP 4: Final fallback pass (v1.1 logic - ensures 6th hour gets placed)
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
                    
                    # Check if batch busy
                    if any(occ["batch"] == req["batch"] for occ in class_tt[req["year"]][req["div"]][day][slot_info["slot_key"]]):
                        continue
                    
                    if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                   teachers, rooms, saved_timetables):
                        req["remaining"] -= 1
    
    # STEP 5: Collect unallocated
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
                "required": req["remaining"] + req["count_today"],
                "assigned": req["count_today"],
                "missing": req["remaining"]
            })
    
    # STEP 6: Generate recommendations
    recommendations = generate_smart_recommendations(unallocated_sessions, class_tt, years, teachers, rooms)
    
    # STEP 7: Check for room conflicts in generated timetable
    if CHECK_ROOM_CONFLICTS:
        for yname in class_tt:
            for div in class_tt[yname]:
                for day in DAY_NAMES:
                    for slot_key in class_tt[yname][div][day]:
                        entries = class_tt[yname][div][day][slot_key]
                        for entry in entries:
                            room_name = entry.get("room")
                            if room_name:
                                room_check = check_room_availability(room_name, day, slot_key, saved_timetables)
                                if room_check["conflict"]:
                                    room_conflict_report.append({
                                        "room": room_name,
                                        "day": day,
                                        "time_slot": slot_key,
                                        "current_class": f"{yname} Div {div}",
                                        "current_subject": entry.get("subject"),
                                        "current_teacher": entry.get("teacher"),
                                        "occupied_by": f"{room_check['with_year']} Div {room_check['with_division']}",
                                        "occupied_subject": room_check["subject"],
                                        "occupied_teacher": room_check["teacher"],
                                        "required_type": entry.get("type", "Theory")
                                    })
    
    # STEP 8: Check for teacher conflicts
    for teacher_name in teacher_tt:
        for day in DAY_NAMES:
            for slot_key in teacher_tt[teacher_name][day]:
                if teacher_tt[teacher_name][day][slot_key]:
                    global_check = check_global_conflicts(teacher_name, day, slot_key, saved_timetables)
                    if global_check["conflict"]:
                        conflict_report.append({
                            "teacher": teacher_name,
                            "day": day,
                            "time_slot": slot_key,
                            "assigned_to": f"{global_check['with_year']} Div {global_check['with_division']}",
                            "subject": global_check["subject"],
                            "room": global_check["room"]
                        })
    
    # STEP 9: Generate room conflict recommendations
    room_recommendations = generate_room_conflict_recommendations(room_conflict_report, rooms, saved_timetables)
    
    return {
        "status": "success" if (not unallocated_sessions and not conflict_report and not room_conflict_report) else "partial",
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "conflicts": conflict_report,
        "room_conflicts": room_conflict_report,
        "unallocated": unallocated_sessions,
        "recommendations": recommendations,
        "room_recommendations": room_recommendations,
        "warnings": [f"{r['year']} Div {r['div']} {r['code']} missing {r['remaining']} hrs" 
                    for r in theory_pool + practical_pool if r["remaining"] > 0]
    }

def solve_timetable(payload):
    """Primary entry point."""
    try:
        print("=== SOLVER START ===")
        print(f"Years: {list(payload.get('years', {}).keys())}")
        print(f"Teachers: {len(payload.get('teachers', []))}")
        print(f"Rooms: {len(payload.get('rooms', []))}")
        print(f"Saved Timetables: {len(payload.get('saved_timetables', []))}")
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
            "critical_issues": [f"System error: {str(e)}"]
        }