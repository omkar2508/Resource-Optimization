"""
Main timetable solver orchestrator.
This file now only handles the high-level flow.
"""
import traceback
from .config import DAY_NAMES, USE_REAL_TIME_SLOTS
from .core.time_slots import generate_time_slots
from .core.validators import validate_requirements
from .helpers.timetable import initialize_complete_structure
from .helpers.teachers import initialize_teacher_daily_limits
from .allocators.theory import allocate_theory_lectures
from .allocators.labs import allocate_lab_continuous
from .allocators.practicals import allocate_practicals
from .allocators.base import allocate_slot
from .recommendations.sessions import generate_enhanced_recommendations

def solver_greedy_distribute(payload):
    """Main solver orchestrator."""
    # Extract data
    years = payload.get("years", {})
    teachers = payload.get("teachers", [])
    rooms = payload.get("rooms", [])
    saved_timetables = payload.get("saved_timetables", [])
    room_mappings = payload.get("roomMappings", {})
    
    # Validate
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
    
    # Initialize pools
    theory_pool = []
    practical_pool = []
    lab_pool = []
    lab_conflicts = []
    
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
            periods_per_day = int(ydata.get("periodsPerDay", 6))
            year_time_slots[yname] = [
                {
                    "period": i,
                    "start": None,
                    "end": None,
                    "slot_key": str(i),
                    "is_lunch": (i == int(ydata.get("lunchBreak", 4)))
                }
                for i in range(1, periods_per_day + 1)
            ]
    
    # Build requirement pools
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
    
    # Initialize structures
    class_tt, teacher_tt, room_tt = initialize_complete_structure(
        years, teachers, rooms, year_time_slots
    )
    teacher_limits = initialize_teacher_daily_limits(teachers)
    
    # PHASE 1: Theory Lectures
    allocate_theory_lectures(
        theory_pool, years, year_time_slots, class_tt,
        teacher_tt, room_tt, teachers, rooms,
        saved_timetables, teacher_limits, room_mappings
    )
    
    # PHASE 2: Multi-hour Labs
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

    
    # PHASE 3: Practicals
    allocate_practicals(
        practical_pool, years, year_time_slots, class_tt,
        teacher_tt, room_tt, teachers, rooms,
        saved_timetables, teacher_limits, room_mappings
    )
    
    # FALLBACK ALLOCATION
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
                    
                    if allocate_slot(req, day, slot_info, class_tt, teacher_tt,
                                   room_tt, teachers, rooms, saved_timetables,
                                   None, None, room_mappings):
                        req["remaining"] -= 1
    
    # Build unallocated sessions
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
            if lab_key in failed_lab_attempts:
                conflict = failed_lab_attempts[lab_key]["conflict"]
                if conflict.get("reason") == "break_interruption":
                    lab_conflicts.append(conflict)

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
    
    # Generate recommendations
    recommendations = generate_enhanced_recommendations(
        unallocated_sessions, lab_conflicts, class_tt, years, teachers, rooms
    )
    
    return {
        "status": "success" if (not unallocated_sessions) else "partial",
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "conflicts": [],
        "room_conflicts": [],
        "unallocated": unallocated_sessions,
        "recommendations": recommendations,
        "room_recommendations": [],
        "lab_conflicts": lab_conflicts,
        "warnings": [
            f"{r['year']} Div {r['div']} {r['code']} missing {r['remaining']} hrs"
            for r in theory_pool + practical_pool + lab_pool if r["remaining"] > 0
        ]
    }

def solve_timetable(payload):
    """Public entry point."""
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