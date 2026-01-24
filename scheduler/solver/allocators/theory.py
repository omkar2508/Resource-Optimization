# ============================================
# FILE 10: solver/allocators/theory_allocator.py
# ============================================

import math
from ..config import DAY_NAMES
from ..helpers.timetable import get_previous_slot_subject
from .base import allocate_slot

def allocate_theory_lectures(theory_pool, years, year_time_slots, class_tt, teacher_tt, 
                             room_tt, teachers, rooms, saved_timetables, teacher_limits, room_mappings):
    """Allocate all theory lectures across the week."""
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

