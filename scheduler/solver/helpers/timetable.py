# ============================================
# FILE 7: solver/utils/timetable_utils.py
# ============================================

from ..config import DAY_NAMES

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


def get_previous_slot_subject(class_tt, yname, div, day, current_slot_idx, time_slots):
    """Get the subject taught in the previous time slot for this class."""
    if current_slot_idx == 0:
        return None
    
    prev_slot_idx = current_slot_idx - 1
    prev_slot_info = time_slots[prev_slot_idx]
    
    if prev_slot_info.get("is_lunch"):
        return None
    
    prev_slot_key = prev_slot_info["slot_key"]
    prev_entries = class_tt[yname][div][day].get(prev_slot_key, [])
    
    for entry in prev_entries:
        if entry.get("type") == "Theory":
            return entry.get("subject")
    
    return None
