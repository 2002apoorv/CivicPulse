# CivicPulse Dataset Documentation

## 1. Overview
The CivicPulse platform uses a curated dataset of public infrastructure and municipal grievances designed to train, evaluate, and demonstrate:
1. Multi-class NLP classification across 10 civic categories.
2. Semantic similarity matching using dense sentence embeddings.
3. Named-entity recognition (NER) and gazetteer-based location extraction.
4. Spatio-temporal and semantic clustering for candidate recurring issue detection.

## 2. Dataset Origin & Synthetic Notice
- **Origin:** Curated synthetic and semi-synthetic civic grievances modeled after actual municipal municipal corporation grievance redressal schemas (such as Varanasi Smart City / Swachhata / CPGRAMS).
- **Notice:** All personal names, phone numbers, and citizen identifiers are strictly synthetic and fictional. Example street coordinates and landmark names reflect real geographic points of interest in Varanasi (e.g., Lanka Crossing, Godowlia Chowk, Assi Ghat, Sigra) to allow realistic geospatial analytics and distance calculations without exposing private citizen data.
- **License & Usage:** Synthetic dataset created for the CivicPulse open portfolio implementation under MIT License.

## 3. Supported Civic Categories
1. **Roads and Potholes** (potholes, damaged tarmac, broken dividers, road sinkholes)
2. **Garbage and Waste** (uncollected dumpsters, roadside trash, animal carcass)
3. **Water Supply** (pipeline leaks, low pressure, contaminated water, dry taps)
4. **Drainage and Sewage** (clogged sewers, overflowing manholes, urban waterlogging)
5. **Streetlights** (defective lamps, broken poles, dark streets)
6. **Public Sanitation** (unclean public urinals, hygiene violations, community toilets)
7. **Traffic and Road Safety** (traffic signals malfunction, dangerous intersections, illegal parking)
8. **Public Infrastructure** (broken pavements, damaged parks, bus shelter damages)
9. **Electricity** (hanging high-voltage wires, transformer sparking, power fluctuations)
10. **Other** (miscellaneous municipal administrative grievances)

## 4. Labeling Assumptions & Limitations
- **Ground Truth:** Labels in the seed training dataset represent canonical expert-assigned categories.
- **Ambiguity:** Some grievances contain multi-category complaints (e.g., "water pipe leak causing a huge pothole"). By convention, the primary root cause or highest public hazard takes precedence in single-label classification.
- **Evaluation Disclaimer:** Synthetic datasets provide reproducible functional benchmarks but do not replace field trials on high-variance historical municipal archives.

## 5. Adding Real-World Municipal Data
To introduce an external real-world dataset (e.g., from Open Government Data portal):
1. Format complaints into JSON or CSV with headers: `title`, `description`, `category`, `locality`, `latitude`, `longitude`, `created_at`.
2. Place the file in `data/samples/real_world_complaints.csv`.
3. Run `python scripts/train_and_evaluate.py --data-source data/samples/real_world_complaints.csv`.

## 6. Execution Commands
- **Seed Database:** `python scripts/seed_data.py`
- **Train Classifier Baseline:** `python scripts/train_and_evaluate.py`
- **Run Evaluation Suite:** `pytest server/tests`
