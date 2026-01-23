# ============================================
# FILE 4: solver/core/conflict_checker.py
# ============================================

from ..config import CHECK_ROOM_CONFLICTS

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


def is_batch_available(class_tt, yname, div, day, slot_key, batch):
    """
    Check if a specific batch is free at this time slot.
    Returns True if batch is available, False if busy.
    """
    if slot_key not in class_tt[yname][div][day]:
        return True
    
    current_occupants = class_tt[yname][div][day][slot_key]
    
    for entry in current_occupants:
        if entry.get("batch") == batch:
            return False
        if entry.get("type") == "Theory":
            return False
    
    return True


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
        
        # Check for lunch break interruption
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
        
        # Check batch availability
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

