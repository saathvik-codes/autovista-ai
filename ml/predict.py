"""
Inference helper for the trained price model - loads the artifact once and
exposes a plain function the FastAPI backend calls. Replaces the old
hardcoded brand/fuel/transmission multiplier formula entirely.
"""
import json
from pathlib import Path

import joblib
import pandas as pd

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
LATEST_POINTER = ARTIFACTS_DIR / "latest.json"
INITIAL_METADATA = ARTIFACTS_DIR / "metadata.json"
INITIAL_MODEL = ARTIFACTS_DIR / "price_model.joblib"

_model = None
_metadata = None


def reload_model() -> None:
    """Drops the cached model so the next prediction call re-reads whatever
    artifact is currently pointed at - this is what makes a pipeline.py
    retrain() actually visible to a running server without a restart."""
    global _model, _metadata
    _model = None
    _metadata = None


def _load():
    global _model, _metadata
    if _model is not None:
        return _model, _metadata

    if LATEST_POINTER.exists():
        # A pipeline.py retrain() has run at least once - use its versioned artifact.
        _metadata = json.loads(LATEST_POINTER.read_text())
        _model = joblib.load(ARTIFACTS_DIR / _metadata["artifact_file"])
    else:
        # Fall back to the original train.py output (first run, before any pipeline retrain).
        _model = joblib.load(INITIAL_MODEL)
        _metadata = json.loads(INITIAL_METADATA.read_text())
    return _model, _metadata


def predict_price_at_age(brand: str, fuel: str, transmission: str, seller_type: str, owner: str, car_age: int, km_driven: int) -> float:
    model, metadata = _load()
    # Unrecognized categories (a brand absent from training data, etc.) are
    # one-hot encoded to all-zero by the fitted encoder (handle_unknown=
    # "ignore"), which the model treats as "no signal from this feature"
    # rather than erroring - a graceful degradation, not a crash.
    row = pd.DataFrame([{
        "brand": brand,
        "fuel": fuel,
        "seller_type": seller_type,
        "transmission": transmission,
        "owner": owner,
        "car_age": max(car_age, 0),
        "km_driven": max(km_driven, 0),
    }])
    prediction = model.predict(row)[0]
    return max(float(prediction), 0.0)


def predict_price(brand: str, fuel: str, transmission: str, seller_type: str, owner: str, year: int, km_driven: int) -> float:
    _, metadata = _load()
    return predict_price_at_age(brand, fuel, transmission, seller_type, owner, metadata["reference_year"] - year, km_driven)


AVG_ANNUAL_KM = 12_000  # typical Indian annual usage, used only to project mileage forward


def predict_future_prices(brand: str, fuel: str, transmission: str, year: int, km_driven: int, years_ahead: int = 5) -> list[float]:
    """Projects this exact car's price N years from now: same model, with
    age and mileage both advanced - not a fixed depreciation-rate formula,
    the model's own learned price-vs-age-vs-mileage relationship does the
    extrapolation."""
    _, metadata = _load()
    current_age = metadata["reference_year"] - year
    return [
        predict_price_at_age(brand, fuel, transmission, "Individual", "First Owner", current_age + i, km_driven + AVG_ANNUAL_KM * i)
        for i in range(1, years_ahead + 1)
    ]


def model_metadata() -> dict:
    _, metadata = _load()
    return metadata


if __name__ == "__main__":
    price = predict_price("Maruti", "Petrol", "Manual", "Individual", "First Owner", 2018, 45000)
    print(f"Predicted price: Rs {price:,.0f}")
