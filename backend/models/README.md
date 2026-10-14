# YOLOv11 weights

Place your food-trained YOLOv11 weights here as `food_yolov11.pt`
(or set `YOLO_MODEL_PATH` in `backend/.env`).

The weights are not shipped. Without them, `/api/health` reports the detector as
unavailable and `/api/analyze` returns a clear error instead of fake results.
For a quick smoke test you can use the generic COCO model (`yolo11n.pt`, which knows
banana, apple, orange, broccoli, carrot, pizza, sandwich, hot dog, donut, cake).
