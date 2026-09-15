# VitaVision production build roadmap

Legend: [x] done  [ ] open

## Stage 1 — Python ML backend (FastAPI + OpenCV + YOLOv11)
- [x] backend/ package: main.py, CORS, config, error handlers
- [x] api/routes: health, analyze, nutrition, recommendations, history
- [x] services: detector (YOLOv11, single load), image_processor (OpenCV), weight_estimator (4 modes), nutrition_service, allergy_service, recommendation_service
- [x] schemas (Pydantic), utils (image, validation), Supabase JWT auth dependency
- [x] backend tests (pytest)
- [x] models/ + data/ + docs/ + .env.example
- [x] requirements.txt, run instructions

## Stage 2 — Frontend API layer
- [x] src/api/{client,analysis,nutrition,recommendations,history}.ts with VITE_API_BASE_URL
- [x] Analyze page calls FastAPI; graceful fallback to existing detection when backend offline
- [x] Staged, non-fake progress messages

## Stage 3 — Data
- [ ] Expand nutrition database (Indian foods, packaged, sourced values + source field)
- [ ] user_corrections table + RLS
- [ ] weight_confidence / estimation_method columns on detected_foods

## Stage 4 — UI
- [x] Replace the text brand mark with the supplied VitaVision logo across shared page headers
- [x] Straighten the landing page introduction panel
- [x] Refine the homepage scan preview as a precision inspection panel
- [ ] Result page: confidence levels, corrections (correct/remove/quantity/serving), recalculation, model info panel
- [ ] Dashboard: today's overview incl. water, 7-day charts (Recharts), insights
- [ ] History: date/meal/calorie/logged filters + food search
- [ ] Settings: full JSON + CSV export, safe delete-all incl. stored images

## Stage 5 — Quality
- [ ] Frontend tests (correction, recalculation, allergy warning, targets)
- [ ] README + docs/{architecture,model,api,database}.md
- [ ] lint/typecheck/build clean

## Known constraints
- The hosted preview/published site runs only the web app; the Python backend must be run by the user locally (or on their own host) and reached through VITE_API_BASE_URL.
- No food-trained YOLOv11 weights are shipped; models/README.md documents where to place them.
