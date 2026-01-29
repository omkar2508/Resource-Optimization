# ============================================
# FILE 13: solver/recommendations/conflict_recommender.py
# ============================================

from ..core.conflict_checker import check_room_availability

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
            suggestions.append(f" Use alternative room: {', '.join(alternative_rooms[:3])}")
        else:
            suggestions.append(f"💡 No free rooms available. Consider shifting to another time slot or day.")
        
        suggestions.append(f"💡 Try scheduling in a different time slot on {day}")
        suggestions.append(f"💡 Move this session to another day with available rooms")
        
        recommendations.append({
            "conflict": conflict,
            "suggestions": suggestions[:3]
        })
    
    return recommendations
