import json
import os
import random

BASE_TEMPLATES = {
    "Roads and Potholes": [
        ("Huge pothole near {loc} crossing", "There is a massive and dangerous pothole near {loc} crossing. Two-wheelers are struggling to pass, and vehicles are swerving dangerously."),
        ("Broken asphalt and deep road crater in {loc}", "The main road in {loc} has completely degraded with broken asphalt and deep craters after rains. Commuters are facing heavy delays and accidents."),
        ("Unpaved road causing severe dust and skidding near {loc}", "Road repair work was left unfinished near {loc}. Loose stones and uneven gravel are causing bikes to skid daily."),
        ("Speed breaker broken with exposed iron rebar at {loc}", "The speed breaker near {loc} school has broken into sharp chunks with metal rebar exposed. Severe hazard to cars and bikes."),
        ("Sunken road depression causing vehicle undercarriage damage at {loc}", "A large section of the tarmac has caved in near {loc} market. Cars are scraping their bottom and traffic is gridlocked.")
    ],
    "Garbage and Waste": [
        ("Garbage dump overflowing onto main street in {loc}", "Municipal waste container at {loc} has not been cleared for days. Garbage is spilling across the road and stray cattle are scattering plastic."),
        ("Rotting vegetable waste dumped near {loc} market", "Vendors have dumped piles of rotting organic waste near {loc}. Intense foul smell and breeding ground for flies and mosquitoes."),
        ("Dead stray animal lying uncollected in {loc}", "A dead animal carcass has been lying on the sidewalk near {loc} for over 24 hours. Urgent sanitation pickup required."),
        ("Illegal commercial trash dumping behind {loc} complex", "Commercial establishments are dumping packing material and toxic waste on open plots in {loc}. Fire hazard and health risk."),
        ("Broken community dustbin spilling trash in {loc}", "The green community garbage bin at {loc} corner is cracked and broken. All waste spills directly into the open lane.")
    ],
    "Water Supply": [
        ("Major underground water pipeline burst at {loc}", "Drinking water pipe has burst underground near {loc}. High pressure water is flooding the street while neighborhood has no tap water."),
        ("Muddy contaminated tap water supply in {loc}", "Municipal tap water delivered to households in {loc} this morning is murky, yellowish, and has a foul chemical odor."),
        ("Zero water pressure for 3 days in {loc} locality", "No water supply reaching 1st and 2nd floors in {loc}. Residents have to rely on private water tankers at high cost."),
        ("Leaking public water standpost wasting water in {loc}", "The public municipal drinking tap at {loc} has a broken valve and has been running continuously for a week."),
        ("Air locks and dry taps in {loc} ward", "Pipeline in {loc} has no water flow despite booster pumps running. Immediate valve inspection needed.")
    ],
    "Drainage and Sewage": [
        ("Sewage overflowing from open manhole in {loc}", "Raw sewage and black wastewater is bubbling out from an uncovered manhole near {loc}. Filthy water entering residential doorways."),
        ("Stormwater drain choked with plastic in {loc}", "The main roadside drainage nullah near {loc} is completely clogged with solid waste. Stagnant water is spilling over during rains."),
        ("Foul toxic sewer gas and blockage in {loc}", "Underground sewage line in {loc} lane is blocked. Toxic sewer odor is filling homes and toilets are backing up."),
        ("Missing manhole cover on busy road near {loc}", "A deep drainage manhole cover is missing near {loc}. Extremely hazardous for night pedestrians and cycles."),
        ("Waterlogging knee-deep after rain in {loc}", "Absence of stormwater runoff channels causes knee-deep stagnant water for days in {loc} after any shower.")
    ],
    "Streetlights": [
        ("Continuous dark stretch: 5 streetlights not working in {loc}", "Five consecutive LED street lights along the road near {loc} are completely unlit. Street is pitch black at night."),
        ("Flickering street lamp keeping residents awake in {loc}", "Streetlight pole opposite residential apartments in {loc} is constantly flickering and buzzing. Needs ballast replacement."),
        ("Damaged bent streetlight pole after collision in {loc}", "A pole near {loc} intersection was struck by a truck and is now tilted at a 45 degree angle towards power cables."),
        ("Streetlights on during daytime wasting electricity in {loc}", "The timer for municipal streetlights in {loc} is broken; lights remain on all afternoon but shut off at night."),
        ("Broken glass lantern and dangling bulb at {loc}", "The luminaire fixture at {loc} has shattered and the bulb is hanging by exposed wires.")
    ],
    "Public Sanitation": [
        ("Unclean and choked public toilet facility in {loc}", "The municipal public toilet complex at {loc} is in a disgusting state. Toilets are clogged, no water in cisterns, and no cleaner assigned."),
        ("Open urination and lack of public urinal facility in {loc}", "Pedestrians are constantly urinating against the boundary wall at {loc} due to absence of any municipal urinal."),
        ("Sanitary waste disposed improperly near {loc}", "Bio-medical and sanitary waste discarded on the pavement near {loc} health dispensary. Biohazard inspection required."),
        ("Stinking stagnant puddle outside public washroom in {loc}", "Wastewater from the community toilet at {loc} is leaking onto the public footpath creating unhygienic slush."),
        ("Broken door and missing taps in {loc} public restroom", "All door latches are broken and taps have been stolen in {loc} public toilet. Completely unusable for women.")
    ],
    "Traffic and Road Safety": [
        ("Traffic signal non-functional causing near-collisions at {loc}", "The traffic light controller at {loc} four-way crossing is completely dead. Vehicles approaching from all 4 sides causing chaos."),
        ("Blind curve lacking mirror and warning sign at {loc}", "Sharp blind turn near {loc} has had multiple two-wheeler accidents this month. Need convex mirror and speed bumps."),
        ("Illegal roadside parking obstructing bus lane in {loc}", "Private buses and transport vans are double-parked near {loc}, reducing a 4-lane avenue down to a single bottleneck."),
        ("Faded zebra crossing and missing pedestrian signal at {loc}", "Pedestrian crossing markings near {loc} school are completely erased. Children unable to cross safely."),
        ("Absence of divider reflectors causing head-on risk at {loc}", "The concrete road median at {loc} has no reflective markers or warning lights; vehicles regularly hit the curb at night.")
    ],
    "Public Infrastructure": [
        ("Broken and missing concrete pavers on {loc} sidewalk", "Footpath pavement tiles are dislodged, cracked, and missing near {loc}. Senior citizens cannot walk without tripping."),
        ("Collapsed boundary railing at public park in {loc}", "Iron safety railing around the municipal children's park in {loc} has collapsed, allowing stray dogs inside."),
        ("Damaged passenger waiting shed at {loc} bus stop", "The roof of the bus shelter at {loc} is rusted through with huge holes. No protection from rain or harsh sun."),
        ("Broken public benches and broken tiles in {loc} square", "Stone benches in the civic square near {loc} are vandalized and broken. Need replacement by municipal works."),
        ("Cracked pedestrian overbridge steps near {loc}", "Concrete stairs of the foot overbridge near {loc} have cracked corners with exposed reinforcing mesh.")
    ],
    "Electricity": [
        ("High voltage electric transformer sparking violently near {loc}", "The distribution transformer at {loc} is sparking with loud electrical arcs. Smoke is visible and neighborhood faces blackout."),
        ("Dangling live electrical cable touching tree branches in {loc}", "An overhead high-tension wire has detached from the crossarm near {loc} and is brushing against trees over the road."),
        ("Exposed live electrical fuse box at pedestrian height in {loc}", "The municipal street lighting power feeder pillar at {loc} has its doors broken open with live 415V busbars exposed."),
        ("Frequent low voltage and voltage fluctuations in {loc}", "Voltage dropping to 140V in {loc} causing appliances and municipal water pumps to trip repeatedly."),
        ("Electric pole root eroded and threatening to fall in {loc}", "Soil around the concrete base of the utility pole in {loc} has eroded completely; pole is swaying in moderate wind.")
    ],
    "Other": [
        ("Unresponsive municipal grievance office at {loc} ward", "Civic service desk at {loc} ward office is perpetually unattended during working hours. Need administrative review."),
        ("Noise pollution from unauthorized commercial loudspeakers in {loc}", "Industrial generator and loudspeakers operating beyond permissible decibel limits past 11 PM in {loc} residential zone."),
        ("Tree branches overgrown and obstructing view of signage in {loc}", "Large boughs of roadside banyan tree near {loc} are completely concealing directional street signs."),
        ("Inquiry regarding birth and death certificate portal delay in {loc}", "Online civic portal has been showing pending verification for 4 weeks for {loc} ward application."),
        ("Encroachment of public walkway by temporary sheds in {loc}", "Temporary unauthorized tin sheds erected on municipal road margin near {loc} restricting pedestrian pathway.")
    ]
}

LOCALITIES = [
    ("Lanka", "Ward 12", 25.2798, 82.9996),
    ("Godowlia", "Ward 22", 25.3094, 83.0069),
    ("Assi", "Ward 14", 25.2905, 83.0065),
    ("Sigra", "Ward 28", 25.3168, 82.9863),
    ("Cantonment", "Ward 35", 25.3267, 82.9863),
    ("Pandeypur", "Ward 45", 25.3472, 82.9984),
    ("Bhelupur", "Ward 18", 25.2974, 82.9926),
    ("Mahmoorganj", "Ward 30", 25.3061, 82.9785),
    ("Orderly Bazar", "Ward 40", 25.3411, 82.9882),
    ("Shivpur", "Ward 50", 25.3621, 82.9554),
    ("Sarnath", "Ward 60", 25.3716, 83.0253),
    ("Dashashwamedh", "Ward 24", 25.3075, 83.0105),
    ("Durgakund", "Ward 15", 25.2891, 82.9981),
    ("Lahurabir", "Ward 25", 25.3195, 82.9942),
    ("Maidagin", "Ward 23", 25.3182, 83.0118)
]

STATUSES = ["submitted", "under_review", "assigned", "in_progress", "resolved", "closed"]
STATUS_WEIGHTS = [0.25, 0.20, 0.20, 0.15, 0.15, 0.05]

def generate_full_dataset():
    random.seed(42)
    complaints = []

    # First load the initial core samples
    script_dir = os.path.dirname(__file__)
    seed_file = os.path.join(script_dir, "complaints_seed.json")
    if os.path.exists(seed_file):
        with open(seed_file, "r", encoding="utf-8") as f:
            complaints = json.load(f)

    # Generate additional rich samples across all templates and localities
    for category, templates in BASE_TEMPLATES.items():
        for title_tmpl, desc_tmpl in templates:
            # Pick 2-3 localities for each template
            selected_locs = random.sample(LOCALITIES, k=2)
            for loc_name, ward, lat, lon in selected_locs:
                # Add small spatial jitter so coordinates are realistic nearby points
                lat_jitter = lat + random.uniform(-0.002, 0.002)
                lon_jitter = lon + random.uniform(-0.002, 0.002)

                # 15% chance coordinates are missing to test unlocated complaint handling
                has_coords = random.random() > 0.15
                title = title_tmpl.format(loc=loc_name)
                desc = desc_tmpl.format(loc=loc_name)
                days_ago = random.randint(1, 28)
                status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]

                complaints.append({
                    "title": title,
                    "description": desc,
                    "category": category,
                    "locality": loc_name,
                    "ward": ward,
                    "latitude": round(lat_jitter, 6) if has_coords else None,
                    "longitude": round(lon_jitter, 6) if has_coords else None,
                    "status": status,
                    "days_ago": days_ago,
                    "hazard_level": "critical" if category in ("Electricity", "Drainage and Sewage") and "burst" in desc else "medium"
                })

    out_file = os.path.join(script_dir, "complaints_dataset.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(complaints, f, indent=2)

    # Also save as CSV for easy inspection and external tools
    csv_file = os.path.join(script_dir, "complaints_dataset.csv")
    with open(csv_file, "w", encoding="utf-8") as f:
        f.write("title,description,category,locality,ward,latitude,longitude,status,days_ago\n")
        for c in complaints:
            safe_title = c['title'].replace('"', '""')
            safe_desc = c['description'].replace('"', '""')
            f.write(f'"{safe_title}","{safe_desc}","{c["category"]}","{c.get("locality","")}","{c.get("ward","")}",{c.get("latitude","")},{c.get("longitude","")},"{c["status"]}",{c["days_ago"]}\n')

    print(f"Dataset successfully compiled: {len(complaints)} total complaints saved to {out_file} and {csv_file}")

if __name__ == "__main__":
    generate_full_dataset()
