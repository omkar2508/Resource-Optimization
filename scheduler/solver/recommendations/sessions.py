# ============================================
# FILE 12: solver/recommendations/session_recommender.py
# ============================================

def generate_enhanced_recommendations(unallocated_sessions, lab_conflicts, class_tt, years, teachers, rooms):
    """Generate intelligent recommendations including break conflict detection."""
    recommendations = []
    
    for session in unallocated_sessions:
        suggestions = []
        year_data = years.get(session['year'], {})
        
        # Check if this session has a break conflict
        break_conflict = None
        if session['type'] == 'Lab' and lab_conflicts:
            for conflict in lab_conflicts:
                if (conflict.get('subject') == session['subject'] and 
                    conflict.get('year') == session['year'] and
                    conflict.get('batch') == session.get('batch_num')):
                    break_conflict = conflict
                    break
        
        # PRIORITY 1: Break interruption for continuous labs
        if break_conflict and break_conflict.get('reason') == 'break_interruption':
            suggestions.append(
                f"🚨 BREAK CONFLICT: {session['subject']} requires {break_conflict['total_duration']}-hour "
                f"continuous slot but break at {break_conflict['break_slot']} interrupts it. "
                f"SOLUTION: Move break to before or after this time window on {break_conflict['day']}."
            )
            suggestions.append(
                f"💡 Alternative: Schedule this lab on a different day where {break_conflict['total_duration']} "
                f"continuous slots are available without break interruption."
            )
        
        # Check teacher availability
        qualified_teachers = [
            t for t in teachers 
            if any(s.get("code") == session['subject'] for s in t.get("subjects", []))
        ]
        
        if len(qualified_teachers) == 0:
            suggestions.append(
                f"⚠️ CRITICAL: No teachers qualified to teach {session['subject']}. "
                f"Add qualified teacher immediately."
            )
        elif len(qualified_teachers) == 1:
            suggestions.append(
                f"⚠️ Only 1 teacher available for {session['subject']}. "
                f"Consider adding another qualified teacher for flexibility."
            )
        
        # Lab-specific recommendations
        if session['type'] == 'Lab':
            available_rooms = [r for r in rooms if r.get("type") == "Lab"]
            
            if len(available_rooms) < 2:
                suggestions.append(
                    f"⚠️ Limited lab rooms ({len(available_rooms)} available). "
                    f"Consider adding more lab rooms."
                )
            
            if session.get('lab_duration', 1) > 1 and not break_conflict:
                suggestions.append(
                    f"💡 This is a {session.get('lab_duration')}-hour continuous lab. "
                    f"Ensure sufficient consecutive free slots without break interruption."
                )
        
        # Generic fallback
        if len(suggestions) == 0:
            suggestions.append(f"💡 Review resource allocation for {session['subject']}.")
        
        recommendations.append({
            "session": session,
            "suggestions": suggestions[:4],
            "has_break_conflict": break_conflict is not None,
            "conflict_details": break_conflict
        })
    
    return recommendations

