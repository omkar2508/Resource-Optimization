# ============================================
# FILE 6: solver/helpers/teacher_utils.py
# ============================================

from ..config import DAY_NAMES

def initialize_teacher_daily_limits(teachers):
    """Initialize teacher daily load tracking with configurable limits."""
    teacher_limits = {}
    for t in teachers:
        max_daily = t.get("maxHoursPerDay", 4)
        teacher_limits[t["name"]] = {
            "max_per_day": max_daily,
            "daily_count": {day: 0 for day in DAY_NAMES}
        }
    return teacher_limits


def can_teacher_take_slot(teacher_name, day, teacher_limits):
    """Check if teacher can take another slot today."""
    if teacher_name not in teacher_limits:
        return True
    limit_data = teacher_limits[teacher_name]
    return limit_data["daily_count"][day] < limit_data["max_per_day"]


def increment_teacher_daily_count(teacher_name, day, teacher_limits):
    """Increment teacher's daily hour count."""
    if teacher_name in teacher_limits:
        teacher_limits[teacher_name]["daily_count"][day] += 1

