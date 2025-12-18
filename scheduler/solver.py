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
    
    # 1. ORCHESTRATE REQUIREMENTS
    req_pool = []
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        for div in range(1, divs + 1):
            for subj in ydata.get("subjects", []):
                stype = subj.get("type", "Theory")
                hours = int(subj.get("hours", 1))
                batches = int(subj.get("batches", 1)) if stype != "Theory" else 1
                
                for b_idx in range(1, batches + 1):
                    req_pool.append({
                        "year": yname, "div": div, "code": subj["code"],
                        "type": stype, "batch": b_idx if stype != "Theory" else None,
                        "remaining": hours, "periods_today": 0 
                    })

    # 2. INITIALIZE TRACKERS
    max_p = max([int(y.get("periodsPerDay", 6)) for y in years.values()])
    class_tt = {}
    teacher_tt = {t["name"]: {d: {p: [] for p in range(1, max_p + 1)} for d in DAY_NAMES} for t in teachers}
    room_tt = {r["name"]: {d: {p: [] for p in range(1, max_p + 1)} for d in DAY_NAMES} for r in rooms}
    
    daily_theory_count = {} 
    for yname, ydata in years.items():
        divs = int(ydata.get("divisions", 1))
        class_tt[yname] = {d: {day: {p: [] for p in range(1, max_p + 1)} for day in DAY_NAMES} for d in range(1, divs + 1)}
        for d in range(1, divs + 1):
            daily_theory_count[f"{yname}_{d}"] = {day: 0 for day in DAY_NAMES}

    # 3. SCHEDULING ENGINE
    for day in DAY_NAMES:
        for req in req_pool: req["periods_today"] = 0

        for p in range(1, max_p + 1):
            # Sort requirements based on the time of day:
            # Morning (P1-P3): Theory First
            # Afternoon (P4+): Lab/Tutorial First
            if p <= 3:
                # Priority: Theory (1) > Tutorial (2) > Lab (3)
                sorted_reqs = sorted(req_pool, key=lambda x: (0 if x["type"] == "Theory" else 1))
            else:
                # Priority: Lab/Tutorial (0) > Theory (1)
                sorted_reqs = sorted(req_pool, key=lambda x: (1 if x["type"] == "Theory" else 0))
            
            random.shuffle(sorted_reqs) # Add some variety within priority groups

            for req in sorted_reqs:
                if req["remaining"] <= 0: continue
                
                yname, div = req["year"], req["div"]
                ydata = years[yname]
                class_key = f"{yname}_{div}"
                
                if day in ydata.get("holidays", []): continue
                if p > int(ydata.get("periodsPerDay", 6)) or p == int(ydata.get("lunchBreak", 4)): continue
                
                # Constraint: Max 3 theory lectures per day (Ensures distribution)
                if req["type"] == "Theory" and daily_theory_count[class_key][day] >= 3: continue
                
                # Constraint: Max 1hr per specific subject per day
                if req["periods_today"] >= int(ydata.get("maxDailyPerSubject", 1)): continue

                code, stype, batch = req["code"], req["type"], req["batch"]
                current_occupants = class_tt[yname][div][day][p]
                
                # --- EXCLUSION LOGIC ---
                # 1. If a Theory lecture is already there, slot is full.
                if any(occ["type"] == "Theory" for occ in current_occupants): continue
                # 2. If we are placing Theory, the slot must be empty (no parallel labs during a lecture).
                if stype == "Theory" and len(current_occupants) > 0: continue
                # 3. If we are placing a Batch, that specific batch must be free.
                if batch and any(occ["batch"] == batch for occ in current_occupants): continue
                
                # --- TEACHER AVAILABILITY ---
                eligible_teachers = [t for t in teachers if any(s["code"] == code for s in t.get("subjects", []))]
                available_teacher = next((t["name"] for t in eligible_teachers if not teacher_tt[t["name"]][day][p]), None)
                if not available_teacher: continue

                # --- ROOM ALLOCATION (With Fallback) ---
                available_room = None
                if stype == "Lab":
                    available_room = next((r["name"] for r in rooms if r["type"] == "Lab" and not room_tt[r["name"]][day][p]), None)
                elif stype == "Tutorial":
                    # Priority: Tutorial Room -> Classroom
                    available_room = next((r["name"] for r in rooms if r["type"] == "Tutorial" and not room_tt[r["name"]][day][p]), None)
                    if not available_room:
                        available_room = next((r["name"] for r in rooms if r["type"] == "Classroom" and not room_tt[r["name"]][day][p]), None)
                else: # Theory
                    available_room = next((r["name"] for r in rooms if r["type"] == "Classroom" and not room_tt[r["name"]][day][p]), None)

                if not available_room: continue

                # --- ALLOCATE ---
                entry = {"subject": code, "teacher": available_teacher, "room": available_room, "batch": batch, "type": stype}
                class_tt[yname][div][day][p].append(entry)
                teacher_tt[available_teacher][day][p].append({"subject": code, "year": yname, "division": div, "room": available_room, "batch": batch})
                room_tt[available_room][day][p].append({"subject": code, "year": yname, "division": div})
                
                req["remaining"] -= 1
                req["periods_today"] += 1
                if stype == "Theory":
                    daily_theory_count[class_key][day] += 1

    return {
        "status": "success" if not any(r['remaining'] > 0 for r in req_pool) else "partial",
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "warnings": [f"{r['year']} Div {r['div']} {r['code']} B{r['batch']} missing {r['remaining']} hrs" for r in req_pool if r["remaining"] > 0]
    }

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
