# ============================================
# FILE 5: solver/core/room_manager.py
# ============================================

def get_room_for_subject(subject_code, component_type, batch, room_mappings, rooms, year=None):
    """Get assigned room from wizard room mappings."""
    if not room_mappings:
        print(f"⚠️ No room mappings provided for {subject_code}")
        return None
    
    mapping_key = f"{year}_{subject_code}_{component_type}"
    
    print(f"🔍 Looking for mapping key: {mapping_key}")
    print(f"📋 Available mapping keys: {list(room_mappings.keys())}")
    
    mapping = room_mappings.get(mapping_key)
    
    if not mapping:
        print(f"⚠️ No room mapping found for {mapping_key}")
        return None
    
    print(f" Found mapping: {mapping}")
    
    if component_type == "Theory":
        room_id = mapping.get("roomId")
        room_name = mapping.get("roomName")
        
        print(f"  → Theory room: {room_name} (ID: {room_id})")
        
        for room in rooms:
            room_id_match = str(room.get("_id")) == str(room_id) if room_id else False
            room_name_match = room.get("name") == room_name if room_name else False
            
            if room_id_match or room_name_match:
                print(f" Found assigned room for {subject_code}: {room.get('name')}")
                return room
    else:
        batches = mapping.get("batches", [])
        
        print(f"  → Looking for batch {batch} in batches: {batches}")
        
        for batch_assignment in batches:
            if batch_assignment.get("batch") == batch:
                room_id = batch_assignment.get("room")
                room_name = batch_assignment.get("roomName")
                
                print(f"  → Batch {batch} assigned to: {room_name} (ID: {room_id})")
                
                for room in rooms:
                    room_id_match = str(room.get("_id")) == str(room_id) if room_id else False
                    room_name_match = room.get("name") == room_name if room_name else False
                    
                    if room_id_match or room_name_match:
                        print(f" Found assigned room for {subject_code} batch {batch}: {room.get('name')}")
                        return room
    
    print(f"⚠️ Room not found in rooms list for {subject_code} batch {batch}")
    return None


def get_compatible_rooms_for_subject(rooms, subject_code, room_type, year=None, division=None, 
                                     room_mappings=None, batch=None):
    """
    Get rooms compatible with a subject.
    
    Priority order:
    1. Use room from Step 3 mappings (if available)
    2. Rooms where primaryYear matches selected year
    3. Rooms where primaryYear == "Shared"
    4. Any available room of correct type (fallback)
    """
    # Priority 1: Use assigned room from mappings
    if room_mappings:
        assigned_room = get_room_for_subject(subject_code, room_type, batch, room_mappings, rooms, year)
        if assigned_room:
            print(f" Using assigned room from mappings: {assigned_room.get('name')} for {subject_code} batch {batch}")
            return [assigned_room]
    
    # Priority 2-4: Filter by year and type
    compatible = []
    
    for room in rooms:
        # Basic type filter
        if room_type == "Lab" and room.get("type") != "Lab":
            continue
        elif room_type == "Tutorial" and room.get("type") not in ["Tutorial", "Classroom"]:
            continue
        elif room_type == "Theory" and room.get("type") != "Classroom":
            continue
        
        # Year filter
        primary_year = room.get("primaryYear", "Shared")
        if primary_year != "Shared" and year and primary_year != year:
            continue
        
        # Calculate priority score
        score = 0
        
        if primary_year == year:
            score += 50
        elif primary_year == "Shared":
            score += 10
        
        primary_div = room.get("primaryDivision")
        if primary_div is None or (division and primary_div == division):
            score += 25
        
        if score > 0:
            compatible.append({
                "room": room,
                "score": score
            })
    
    compatible.sort(key=lambda x: x["score"], reverse=True)
    
    result = [item["room"] for item in compatible]
    
    if len(result) == 0:
        print(f"⚠️ No compatible rooms found for {room_type} - {subject_code}")
    else:
        print(f" Found {len(result)} compatible rooms for {room_type} - {subject_code}")
    
    return result