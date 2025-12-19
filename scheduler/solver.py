# scheduler/solver.py
from collections import defaultdict
import math
import random
import traceback

# Default config
DEFAULT_PERIODS_PER_DAY = 6
DEFAULT_WORKING_DAYS = 5
DEFAULT_LUNCH_PERIOD = 4  # 1-indexed, e.g. period 4 is lunch
DEFAULT_MAX_PER_DAY = 3   # reasonable non-overload per teacher per day
DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

def teacher_can_teach_entry(t, subj_code):
    for s in t.get("subjects", []):
        if s.get("code") == subj_code:
            return True
    return False

def init_empty_struct(years, periods_per_day, working_days, teachers):
    class_tt = {}
    teacher_tt = {}

    for yname, ydata in years.items():
        divisions = int(ydata.get("divisions", 1))
        class_tt[yname] = {}
        for div in range(1, divisions + 1):
            class_tt[yname][div] = {
                DAY_NAMES[d]: {p: [] for p in range(1, periods_per_day + 1)}
                for d in range(working_days)
            }

    for t in teachers:
        tname = t.get("name")
        teacher_tt[tname] = {
            DAY_NAMES[d]: {p: [] for p in range(1, periods_per_day + 1)}
            for d in range(working_days)
        }

    return class_tt, teacher_tt

def choose_days_for_hours(hours, working_days):
    """
    Deterministic choice:
    - hours == 3 -> Mon, Wed, Fri (0,2,4) if working_days >=5
    - hours == 2 -> Tue, Thu (1,3) or Mon, Wed if 2 days
    - hours == 1 -> put on Mon (0) or spread later
    - else spread evenly across available days
    Returns list of day indices (0-based).
    """
    if hours <= 0:
        return []
    if hours == 3 and working_days >= 5:
        return [0, 2, 4]
    if hours == 2 and working_days >= 4:
        return [1, 3]
    # General spread: choose days equally spaced
    step = working_days / hours
    chosen = []
    for i in range(hours):
        idx = int(round(i * step))
        if idx >= working_days:
            idx = working_days - 1
        # avoid duplicates
        if idx in chosen:
            # try forward/backwards
            j = idx
            while j in chosen and j+1 < working_days:
                j += 1
            if j in chosen:
                j = idx
                while j in chosen and j-1 >= 0:
                    j -= 1
            idx = j
        chosen.append(idx)
    # trim/pad
    chosen = list(dict.fromkeys(chosen))
    while len(chosen) < hours:
        for d in range(working_days):
            if d not in chosen:
                chosen.append(d)
            if len(chosen) == hours:
                break
    return chosen[:hours]

def find_period_for_slot(class_tt, teacher_tt, yname, div, day_idx, block_size,
                         periods_per_day, lunch_period, teacher_names, max_per_day, subject_code, teachers_map):
    """
    Try to find a period p (1..periods_per_day) where:
    - class slot is free
    - teacher exists who can teach subject and is free for block_size consecutive periods starting at p
    - teacher daily load < max_per_day
    Returns tuple (period, teacher_name) or (None, None)
    """
    day_name = DAY_NAMES[day_idx]
    # Try each period in order (deterministic)
    for p in range(1, periods_per_day + 1):
        # skip lunch
        if p == lunch_period:
            continue
        # ensure block fits in day
        if block_size > 1 and (p + block_size - 1) > periods_per_day:
            continue

        # Check class free for whole block
        class_free = True
        for bp in range(p, p + block_size):
            if len(class_tt[yname][div][day_name][bp]) > 0:
                class_free = False
                break
            if bp == lunch_period:
                class_free = False
                break
        if not class_free:
            continue

        # Try to find a teacher who can teach and is free for whole block and not overloaded
        for tname in teacher_names:
            t_entry = teachers_map.get(tname, {})
            if not teacher_can_teach_entry(t_entry, subject_code):
                continue

            # teacher daily load check
            teacher_daily_load = sum(
                1 for per, cell in teacher_tt[tname][day_name].items() if len(cell) > 0
            )
            if teacher_daily_load >= max_per_day:
                continue

            # check teacher free for block
            teacher_free = True
            for bp in range(p, p + block_size):
                if len(teacher_tt[tname][day_name][bp]) > 0:
                    teacher_free = False
                    break
                if bp == lunch_period:
                    teacher_free = False
                    break
            if not teacher_free:
                continue

            # OK slot & teacher found
            return p, tname

    return None, None

def solver_greedy_distribute(payload):
    years = payload.get("years", {})
    teachers = payload.get("teachers", [])
    rooms = payload.get("rooms", [])
    
    # 1. ORCHESTRATE REQUIREMENTS & CALCULATE DAILY QUOTAS
    theory_pool = []
    practical_pool = []
    daily_quotas = {} # Format: { "Year_Div": { "Theory": N, "Practical": M } }

    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        working_days_count = int(ydata.get("daysPerWeek", 5))
        
        for div in range(1, divs + 1):
            class_key = f"{yname}_{div}"
            total_theory_hours = 0
            total_practical_hours = 0
            
            for subj in ydata.get("subjects", []):
                stype = subj.get("type", "Theory")
                hours = int(subj.get("hours", 1))
                batches = int(subj.get("batches", 1)) if stype != "Theory" else 1
                
                for b_idx in range(1, batches + 1):
                    req = {
                        "year": yname, "div": div, "code": subj["code"],
                        "type": stype, "batch": b_idx if stype != "Theory" else None,
                        "remaining": hours, "scheduled_today": False 
                    }
                    if stype == "Theory":
                        theory_pool.append(req)
                        total_theory_hours += hours
                    else:
                        practical_pool.append(req)
                        total_practical_hours += hours

            # Balanced Daily Load Calculation
            daily_quotas[class_key] = {
                "Theory": math.ceil(total_theory_hours / working_days_count),
                "Practical": math.ceil(total_practical_hours / working_days_count)
            }

    # 2. INITIALIZE TRACKERS
    max_p = max([int(y.get("periodsPerDay", 6)) for y in years.values()])
    class_tt = {}
    teacher_tt = {t["name"]: {d: {p: [] for p in range(1, max_p + 1)} for d in DAY_NAMES} for t in teachers}
    room_tt = {r["name"]: {d: {p: [] for p in range(1, max_p + 1)} for d in DAY_NAMES} for r in rooms}
    
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        class_tt[yname] = {d: {day: {p: [] for p in range(1, max_p + 1)} for day in DAY_NAMES} for d in range(1, divs + 1)}

    # 3. SCHEDULING ENGINE
    for day in DAY_NAMES:
        # Reset daily tracking
        for r in theory_pool + practical_pool: 
            r["scheduled_today"] = False
        
        # Track what we've actually scheduled today per class
        daily_progress = {k: {"Theory": 0, "Practical": 0} for k in daily_quotas.keys()}

        for p in range(1, max_p + 1):
            random.shuffle(theory_pool)
            random.shuffle(practical_pool)

            for yname, ydata in years.items():
                if day in ydata.get("holidays", []): continue
                if p > int(ydata.get("periodsPerDay", 6)): continue
                if p == int(ydata.get("lunchBreak", 4)): continue

                divs = int(ydata.get("divisions", 1))
                for div in range(1, divs + 1):
                    class_key = f"{yname}_{div}"
                    quota = daily_quotas[class_key]
                    progress = daily_progress[class_key]

                    # --- ATTEMPT THEORY FIRST (Respecting Quota) ---
                    # Generally lectures are in the morning, so we bias this for P1-P3
                    scheduled_in_this_slot = False
                    if progress["Theory"] < quota["Theory"]:
                        for req in theory_pool:
                            if (req["year"] == yname and req["div"] == div and 
                                req["remaining"] > 0 and not req["scheduled_today"]):
                                if allocate_slot(req, day, p, class_tt, teacher_tt, room_tt, teachers, rooms):
                                    req["remaining"] -= 1
                                    req["scheduled_today"] = True
                                    progress["Theory"] += 1
                                    scheduled_in_this_slot = True
                                    break
                    
                    # --- ATTEMPT PRACTICAL (Parallel Batches) ---
                    # If quota for theory is done OR if no theory could be scheduled
                    if not scheduled_in_this_slot and progress["Practical"] < quota["Practical"]:
                        for req in practical_pool:
                            if (req["year"] == yname and req["div"] == div and 
                                req["remaining"] > 0 and not req["scheduled_today"]):
                                
                                # Parallel Check: Batch must be free
                                if any(occ["batch"] == req["batch"] for occ in class_tt[yname][div][day][p]):
                                    continue
                                    
                                if allocate_slot(req, day, p, class_tt, teacher_tt, room_tt, teachers, rooms):
                                    req["remaining"] -= 1
                                    req["scheduled_today"] = True
                                    # Increment only once per slot even if multiple batches run
                                    if not any(entry["type"] != "Theory" for entry in class_tt[yname][div][day][p][:-1]):
                                        progress["Practical"] += 1

    return {
        "status": "success" if not any(r['remaining'] > 0 for r in theory_pool + practical_pool) else "partial",
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "warnings": [f"{r['year']} Div {r['div']} {r['code']} missing {r['remaining']} hrs" for r in theory_pool + practical_pool if r["remaining"] > 0]
    }

def allocate_slot(req, day, p, class_tt, teacher_tt, room_tt, teachers, rooms):
    yname, div, code, stype, batch = req["year"], req["div"], req["code"], req["type"], req["batch"]
    current_occupants = class_tt[yname][div][day][p]
    
    if any(occ["type"] == "Theory" for occ in current_occupants): return False
    if stype == "Theory" and len(current_occupants) > 0: return False
    
    eligible = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
    available_t = next((t["name"] for t in eligible if not teacher_tt[t["name"]][day][p]), None)
    if not available_t: return False

    available_r = None
    if stype == "Lab":
        available_r = next((r["name"] for r in rooms if r["type"] == "Lab" and not room_tt[r["name"]][day][p]), None)
    elif stype == "Tutorial":
        available_r = next((r["name"] for r in rooms if r["type"] == "Tutorial" and not room_tt[r["name"]][day][p]), None) or \
                      next((r["name"] for r in rooms if r["type"] == "Classroom" and not room_tt[r["name"]][day][p]), None)
    else:
        available_r = next((r["name"] for r in rooms if r["type"] == "Classroom" and not room_tt[r["name"]][day][p]), None)

    if not available_r: return False

    entry = {"subject": code, "teacher": available_t, "room": available_r, "batch": batch, "type": stype}
    class_tt[yname][div][day][p].append(entry)
    teacher_tt[available_t][day][p].append({"subject": code, "year": yname, "division": div, "room": available_r, "batch": batch})
    room_tt[available_r][day][p].append({"subject": code, "year": yname, "division": div})
    return True

def solve_timetable(payload):
    """
    Primary entry used by Flask. We use a deterministic greedy distributor that
    produces a readable timetable and respects lunch and teacher overlaps.
    """
    try:
        print("=== SOLVER START ===")
        print(payload)
        print("====================")
        return solver_greedy_distribute(payload)
    except Exception as e:
        print("Exception in solver:", e)
        traceback.print_exc()
        # return empty but not crash
        return {
            "class_timetable": {},
            "teacher_timetable": {},
            "status": "error",
            "error": str(e)
        }
