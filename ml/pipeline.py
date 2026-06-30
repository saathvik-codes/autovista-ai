"""
End-to-end retraining pipeline: new data in -> retrain -> versioned
artifact -> live backend picks it up without a redeploy or restart.

This is what makes the price model a real pipeline instead of a one-off
training script: `retrain()` can be called with newly arrived listings
(e.g. from an admin bulk-upload, or a refreshed source export), and it
appends them to the training set, retrains, evaluates, and writes a new
versioned model artifact. The backend's predict.py lazily loads whichever
artifact `latest.json` currently points at, and `reload_model()` clears
that cache - so calling retrain() and then reload_model() is the entire
"update flows through to the live platform" loop, with no deploy step.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd

from train import (
    CATEGORICAL_FEATURES,
    DATA_PATH,
    NUMERIC_FEATURES,
    REFERENCE_YEAR,
    build_pipeline,
    evaluate,
    load_and_clean,
)
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, train_test_split

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
LATEST_POINTER = ARTIFACTS_DIR / "latest.json"


def ingest_new_listings(new_rows: list[dict]) -> int:
    """Appends newly arrived listings (same schema as the source CSV) to
    the training data on disk. Returns the new total row count."""
    if not new_rows:
        return sum(1 for _ in open(DATA_PATH)) - 1
    df = pd.read_csv(DATA_PATH)
    new_df = pd.DataFrame(new_rows)
    combined = pd.concat([df, new_df], ignore_index=True)
    combined.to_csv(DATA_PATH, index=False)
    return len(combined)


def retrain(new_rows: list[dict] | None = None) -> dict:
    """Retrains on the current (optionally just-extended) dataset and
    writes a new versioned artifact. Does not touch whatever the backend
    is currently serving until the caller also calls reload_model()."""
    row_count = ingest_new_listings(new_rows or [])

    df = load_and_clean()
    feature_cols = CATEGORICAL_FEATURES + NUMERIC_FEATURES
    X, y = df[feature_cols], df["selling_price"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = build_pipeline(GradientBoostingRegressor(n_estimators=300, max_depth=3, learning_rate=0.05, random_state=42))
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="r2")
    pipeline.fit(X_train, y_train)
    metrics = evaluate(pipeline, X_test, y_test)
    metrics["cv_r2_mean"] = round(float(cv_scores.mean()), 4)

    version = _next_version()
    artifact_path = ARTIFACTS_DIR / f"price_model_v{version}.joblib"
    joblib.dump(pipeline, artifact_path)

    metadata = {
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model": "gradient_boosting",
        "metrics": metrics,
        "n_rows": row_count,
        "brands": sorted(df["brand"].unique().tolist()),
        "fuel_types": sorted(df["fuel"].unique().tolist()),
        "feature_cols": feature_cols,
        "reference_year": REFERENCE_YEAR,
        "artifact_file": artifact_path.name,
    }
    LATEST_POINTER.write_text(json.dumps(metadata, indent=2))
    return metadata


def _next_version() -> int:
    if not LATEST_POINTER.exists():
        return 1
    return json.loads(LATEST_POINTER.read_text()).get("version", 0) + 1


def current_status() -> dict:
    if not LATEST_POINTER.exists():
        return {"version": 0, "status": "no model trained via pipeline yet - using initial train.py artifact"}
    return json.loads(LATEST_POINTER.read_text())


if __name__ == "__main__":
    result = retrain()
    print(json.dumps(result, indent=2))
