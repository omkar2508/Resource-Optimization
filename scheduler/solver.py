# scheduler/solver.py
from collections import defaultdict
import math
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
    """
    Deterministic greedy scheduler that distributes subjects sensibly across days
    and respects lunch & teacher non-overlap & daily limits.
    """
    years = payload.get("years", {})
    teachers = payload.get("teachers", [])

    # dynamic config (per-year may override; we pick first year settings or defaults)
    periods_per_day = DEFAULT_PERIODS_PER_DAY
    working_days = DEFAULT_WORKING_DAYS
    lunch_period = DEFAULT_LUNCH_PERIOD
    max_per_day = DEFAULT_MAX_PER_DAY

    # try to read from payload global/per-year
    for ydata in years.values():
        if ydata.get("periodsPerDay"):
            periods_per_day = int(ydata.get("periodsPerDay", periods_per_day))
        if ydata.get("daysPerWeek"):
            working_days = int(ydata.get("daysPerWeek", working_days))
        if ydata.get("lunchBreak"):
            lunch_period = int(ydata.get("lunchBreak", lunch_period))
    # allow payload override top-level (optional)
    if isinstance(payload.get("config"), dict):
        cfg = payload["config"]
        periods_per_day = int(cfg.get("periodsPerDay", periods_per_day))
        working_days = int(cfg.get("daysPerWeek", working_days))
        lunch_period = int(cfg.get("lunchBreak", lunch_period))
        max_per_day = int(cfg.get("maxPerDay", max_per_day))

    # build maps
    teachers_map = {t.get("name"): t for t in teachers}
    teacher_names = [t.get("name") for t in teachers]

    class_tt, teacher_tt = init_empty_struct(years, periods_per_day, working_days, teachers)

    warnings = []
    # For each year/div and subject, decide days to place and place them
    for yname, ydata in years.items():
        divisions = int(ydata.get("divisions", 1))
        subjects = ydata.get("subjects", [])

        for div in range(1, divisions + 1):
            for subj in subjects:
                code = subj.get("code")
                typ = subj.get("type", "Theory")
                hours = int(subj.get("hours", 0))

                # determine block size (labs)
                if typ and typ.lower() == "lab":
                    block_size = 2
                    blocks_required = max(1, hours // block_size)
                else:
                    block_size = 1
                    blocks_required = hours

                # choose days deterministically
                chosen_day_idxs = choose_days_for_hours(blocks_required, working_days)

                placed = 0
                for day_idx in chosen_day_idxs:
                    if placed >= blocks_required:
                        break

                    # Try to find a period & teacher
                    p, teacher_name = find_period_for_slot(
                        class_tt, teacher_tt, yname, div, day_idx, block_size,
                        periods_per_day, lunch_period, teacher_names, max_per_day, code, teachers_map
                    )

                    # If not found, try relaxing max_per_day for this teacher temporarily
                    if p is None:
                        # try allowing teachers to exceed daily load by 1, by scanning again
                        for tname in teacher_names:
                            if not teacher_can_teach_entry(teachers_map.get(tname, {}), code):
                                continue
                            # check teacher free for block ignoring daily load
                            day_name = DAY_NAMES[day_idx]
                            for p_try in range(1, periods_per_day + 1):
                                if p_try == lunch_period:
                                    continue
                                if block_size > 1 and (p_try + block_size - 1) > periods_per_day:
                                    continue
                                class_free = all(len(class_tt[yname][div][day_name][bp]) == 0 and bp != lunch_period for bp in range(p_try, p_try+block_size))
                                teacher_free = all(len(teacher_tt[tname][day_name][bp]) == 0 and bp != lunch_period for bp in range(p_try, p_try+block_size))
                                if class_free and teacher_free:
                                    p = p_try
                                    teacher_name = tname
                                    break
                            if p is not None:
                                break

                    if p is None:
                        warnings.append(f"Could not place subject {code} for {yname} div{div} on day {DAY_NAMES[day_idx]}")
                        continue

                    # place the block
                    day_name = DAY_NAMES[day_idx]
                    for bp in range(p, p + block_size):
                        # class cell
                        class_tt[yname][div][day_name][bp].append({
                            "subject": code,
                            "teacher": teacher_name
                        })
                        # teacher cell
                        teacher_tt[teacher_name][day_name][bp].append({
                            "subject": code,
                            "year": yname,
                            "division": div
                        })
                    placed += 1

                if placed < blocks_required:
                    warnings.append(f"Subject {code} for {yname} div{div} required {blocks_required} blocks but only placed {placed}")

    status = "success" if not warnings else "partial"
    result = {
        "class_timetable": class_tt,
        "teacher_timetable": teacher_tt,
        "status": status
    }
    if warnings:
        result["warnings"] = warnings
    return result

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
