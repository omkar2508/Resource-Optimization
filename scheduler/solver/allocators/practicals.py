# ============================================
# FILE 11: solver/allocators/practical_allocator.py
# ============================================

import random
from ..config import DAY_NAMES
from .base import allocate_slot

def allocate_practicals(practical_pool, years, year_time_slots, class_tt, teacher_tt, 
                        room_tt, teachers, rooms, saved_timetables, teacher_limits, room_mappings):
    """Allocate single-hour practicals/tutorials."""
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
                    
                    if allocate_slot(req, day, slot_info, class_tt, teacher_tt, room_tt, 
                                teachers, rooms, saved_timetables, teacher_limits, None, room_mappings):
                        req["remaining"] -= 1
                        req["count_today"] += 1