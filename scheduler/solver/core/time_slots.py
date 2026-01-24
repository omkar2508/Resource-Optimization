# ============================================
# FILE 2: solver/core/time_slots.py
# ============================================

from datetime import datetime, timedelta

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