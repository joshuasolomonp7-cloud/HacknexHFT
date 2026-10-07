# Bug Stress Test Project

This is a deliberately flawed, multi-module Python shop application for testing an automated bug-finding and repair system.

## Run
```bash
python main.py
```

## Run tests
```bash
python -m unittest -v test_stress.py
```

The project intentionally contains syntax/runtime/logic/state/edge-case defects. Do not use it for real transactions or production data.
