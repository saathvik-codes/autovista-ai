# AutoVista AI — Used Car Price Intelligence

A car marketplace backend (FastAPI + MongoDB) with a real, trained price
prediction model and a deterministic recommendation engine — replacing
what used to be a hardcoded multiplier formula and an LLM-text wrapper
around a database filter.

## Why this exists

The previous version of this repo had `scikit-learn` and `xgboost` in
`requirements.txt` but never imported them — the "price prediction" was
`base_price * brand_multiplier * fuel_multiplier * (1 - 0.12) ** age`,
invented numbers with no data behind them, and "recommendations" were a
MongoDB filter query dressed up by an LLM call. Neither one used real
data, and the LLM dependency meant the feature couldn't run without a
paid API key. This rebuild fixes the actual ML, not just the surface.

## What's real now

### Price prediction — `ml/`
Trained on 4,340 real used-car listings from CarDekho (India's largest
used-car marketplace) — name, year, selling price, km driven, fuel type,
seller type, transmission, ownership history. [Source](https://github.com/chandanverma07/DataSets)
(the well-known "CAR DETAILS FROM CAR DEKHO" dataset, originally from Kaggle).

Three candidate models were compared with 5-fold cross-validation and a
held-out test set:

| Model | Test MAE | Test R² | CV R² (mean) |
|---|---|---|---|
| Linear Regression (baseline) | ₹189,910 | 0.515 | 0.465 |
| Random Forest | ₹141,380 | 0.697 | 0.599 |
| **Gradient Boosting (selected)** | **₹142,895** | **0.707** | **0.699** |

A naive "always predict the median price" baseline has MAE ₹267,045 — the
selected model cuts that error by **~46%**. That's the number that's
actually defensible in an interview, not an asserted accuracy percentage.

### Recommendation engine — `ml/recommend.py`
A weighted multi-criteria match score (budget fit, fuel/body/transmission
match, safety rating as a tie-breaker) against the catalog — fully
deterministic and explainable (every recommendation comes with its score
breakdown), and doesn't depend on any external LLM API key to run.

### End-to-end retraining pipeline — `ml/pipeline.py`
New listings can be ingested and the model retrained without redeploying:
`POST /api/admin/ml/retrain` appends new rows (same schema as the source
data), retrains, writes a versioned artifact, and hot-swaps the model the
live `/predict-price` endpoint uses — in the same process, no restart.
`GET /api/admin/ml/status` reports the currently active model version,
when it was last retrained, and its real held-out accuracy.

```bash
cd ml
pip install -r ../backend/requirements.txt
python train.py        # trains the baseline model, prints comparison table
python pipeline.py      # demonstrates a retrain -> new versioned artifact
```

## Tech stack

- **Backend**: FastAPI, MongoDB (Motor), JWT auth
- **ML**: scikit-learn (Gradient Boosting / Random Forest), pandas
- **Frontend**: React, Tailwind, shadcn/ui

## Project structure

```
ml/
  data/cardekho_used_cars.csv   Real CarDekho used-car listings (4,340 rows)
  train.py                       Model comparison + training (run once for the baseline)
  predict.py                     Inference helper the backend imports
  recommend.py                   Deterministic multi-criteria recommendation scoring
  pipeline.py                    Ingest new data -> retrain -> versioned hot-swap
  artifacts/                     Trained model + metadata (baseline committed)
backend/
  server.py                      FastAPI app — auth, car CRUD, admin, ML endpoints
frontend/
  src/                            React app
```

## Data source

"CAR DETAILS FROM CAR DEKHO" dataset, originally published on Kaggle,
sourced from CarDekho.com listings.
