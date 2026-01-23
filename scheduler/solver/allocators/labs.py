# ============================================
# FILE 9: solver/allocators/lab_allocator.py
# ============================================

from ..core.validators import teacher_can_teach_entry
from ..core.conflict_checker import check_continuous_slots_available
from ..core.room_manager import get_compatible_rooms_for_subject
from ..helpers.teachers import increment_teacher_daily_count

def allocate_lab_continuous(req, day, start_slot_idx, class_tt, teacher_tt, room_tt, 
                            teachers, rooms, year_time_slots, saved_timetables, 
                            lab_conflicts, teacher_limits=None, room_mappings=None):
    """Continuous lab allocation with room mappings support."""
    yname, div, code, batch = req["year"], req["div"], req["code"], req["batch"]
    lab_duration = req.get("lab_duration", 1)
    
    # Find eligible teachers
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    
    if teacher_limits:
        eligible = [t for t in eligible 
                   if teacher_limits[t["name"]]["daily_count"][day] + lab_duration 
                      <= teacher_limits[t["name"]]["max_per_day"]]
    
    best_conflict = None
    
    for t in eligible:
        # Get labs with mappings support
        candidate_rooms = get_compatible_rooms_for_subject(
            rooms, code, "Lab", yname, div, room_mappings, batch
        )
        
        # Fallback to any lab
        if not candidate_rooms or len(candidate_rooms) == 0:
            candidate_rooms = [r for r in rooms if r.get("type") == "Lab"]
        
        for room in candidate_rooms:
            room_name = room.get("name") if isinstance(room, dict) else room
            
            # Check if continuous slots are available
            can_allocate, slot_keys, conflict_info = check_continuous_slots_available(
                class_tt, teacher_tt, room_tt, yname, div, day,
                start_slot_idx, lab_duration, t["name"], room_name,
                batch, year_time_slots[yname], saved_timetables
            )
            
            if can_allocate:
                session_id = f"{day}-{slot_keys[0]}"
                
                # Allocate all slots for this continuous lab
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
                
                # Update teacher limits
                if teacher_limits:
                    for _ in range(lab_duration):
                        increment_teacher_daily_count(t["name"], day, teacher_limits)
                
                return True, None
            
            # Track break interruption conflicts
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
