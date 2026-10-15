# Model Lab

New AI-assisted personal learning project, October 2026. A small end-to-end ML experiment and serverless inference demo, built with Codex assistance. Not professional production experience.

## Run and verify
Python 3.12+ and Node.js 24. No third-party model-training dependencies.

```sh
python projects/model-lab/train.py
python -m unittest discover -s projects/model-lab -p 'test_*.py'
node --test projects/model-lab/test_api.mjs
node projects/model-lab/server.mjs
```

Visit http://127.0.0.1:8765/model-lab/. GET /api/model-lab returns the version, parameters, held-out metrics and limitations; POST accepts `{"features":[1,-1,0.5,0]}`. Feature order is temperature, vibration, load, pressure; all are synthetic normalized units in [-3,3].

## Experiment
Seeded generators create 600 training and 200 held-out independent synthetic observations. The generating label rule is deliberately learnable, with Gaussian noise. A logistic classifier is fitted using gradient descent, train-only standardization and L2 regularization. Fixed seeds and model JSON support reproducibility; the version is a content-derived SHA-256 prefix. Holdout metrics and a training-majority baseline are exported. The holdout is used to report this fixed demonstration, not to tune hyperparameters.

## CI and deployment
GitHub Actions checks artifact reproducibility, train-only scaling, evaluation and API behavior, and uploads the artifact. Vercel's connected GitHub deployment serves the static page and `api/model-lab.mjs`. CI and hosting are separate: Vercel does not wait for this workflow, so this is not a gated production release pipeline. Revert a commit to roll back source/artifact; the displayed version identifies the model being served. No credentials are embedded. No inference requests are persisted by project code; hosting-provider logs may retain request metadata. Bounded input validation is not abuse protection or a production monitoring system.

## Limits
Synthetic data only. No real sensor efficacy, time-series leakage validation, calibrated-risk guarantee, drift monitoring, trading use or safety-critical use is claimed. A public demo is not evidence of enterprise MLOps experience. Training is Python; exported inference is JavaScript, not a PyTorch deployment. Learn the implementation before describing it in an interview.
