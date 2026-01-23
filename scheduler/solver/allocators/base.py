# ============================================
# FILE 8: solver/allocators/base_allocator.py
# ============================================

from ..core.validators import teacher_can_teach_entry
from ..core.conflict_checker import check_global_conflicts, check_room_availability, is_batch_available
from ..core.room_manager import get_compatible_rooms_for_subject
from ..helpers.teachers import can_teacher_take_slot, increment_teacher_daily_count
from ..config import CHECK_ROOM_CONFLICTS

def allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, teachers, rooms, 
                  saved_timetables=None, teacher_limits=None, previous_subject=None, room_mappings=None):
    """Allocate single slot with room mappings support."""
    yname, div, code, stype, batch = req["year"], req["div"], req["code"], req["type"], req["batch"]
    slot_key = slot_info["slot_key"]
    
    # Skip lunch slots
    if slot_info.get("is_lunch"):
        return False
    
    # Batch availability check
    if batch is not None:
        if not is_batch_available(class_tt, yname, div, day, slot_key, batch):
            return False
    
    # Theory lecture - check slot is empty
    if stype == "Theory":
        current_occupants = class_tt[yname][div][day].get(slot_key, [])
        if len(current_occupants) > 0:
            return False
    
    # Find eligible teacher
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    
    if teacher_limits:
        eligible = [t for t in eligible if can_teacher_take_slot(t["name"], day, teacher_limits)]
    
    if not eligible:
        return False
    
    if teacher_limits:
        eligible.sort(key=lambda t: teacher_limits[t["name"]]["daily_count"][day])
    
    # Find available teacher
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
    
    # Room allocation with mappings
    room_type_map = {
        "Lab": "Lab",
        "Tutorial": "Tutorial",
        "Theory": "Theory"
    }
    
    candidate_rooms = get_compatible_rooms_for_subject(
        rooms, code, room_type_map.get(stype, "Theory"), yname, div, room_mappings, batch
    )
    
    # Fallback if no rooms found
    if not candidate_rooms or len(candidate_rooms) == 0:
        if stype == "Lab":
            candidate_rooms = [r for r in rooms if r.get("type") == "Lab"]
        elif stype == "Tutorial":
            candidate_rooms = [r for r in rooms if r.get("type") in ["Tutorial", "Classroom"]]
        else:
            candidate_rooms = [r for r in rooms if r.get("type") == "Classroom"]
    
    # Find available room
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
    
    # Allocation
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