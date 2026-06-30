"""
Trains a real used-car price prediction model on real transaction data,
replacing the hardcoded brand/fuel/transmission multiplier formula that
used to sit behind the /predict-price endpoint.

Data: 4,340 real used-car listings from CarDekho (India's largest used-car
marketplace), name/year/price/km_driven/fuel/seller_type/transmission/owner.
Source: the classic "CAR DETAILS FROM CAR DEKHO" dataset, originally
published on Kaggle, mirrored at
https://github.com/chandanverma07/DataSets (no auth required).

Run: python train.py
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

DATA_PATH = Path(__file__).parent / "data" / "cardekho_used_cars.csv"
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
REFERENCE_YEAR = 2024  # dataset's most recent listings are from 2020

NUMERIC_FEATURES = ["car_age", "km_driven"]
CATEGORICAL_FEATURES = ["brand", "fuel", "seller_type", "transmission", "owner"]


def load_and_clean() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df = df.drop_duplicates()
    df["brand"] = df["name"].str.split().str[0]
    # Drop brands with too few listings to learn a meaningful price effect from
    brand_counts = df["brand"].value_counts()
    df = df[df["brand"].isin(brand_counts[brand_counts >= 5].index)]
    df["car_age"] = REFERENCE_YEAR - df["year"]
    return df


def build_pipeline(model) -> Pipeline:
    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ], remainder="passthrough")
    return Pipeline([("preprocess", preprocessor), ("model", model)])


def evaluate(pipeline: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    pred = pipeline.predict(X_test)
    return {
        "mae": round(float(mean_absolute_error(y_test, pred)), 0),
        "rmse": round(float(root_mean_squared_error(y_test, pred)), 0),
        "r2": round(float(r2_score(y_test, pred)), 4),
    }


def main() -> None:
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    df = load_and_clean()
    feature_cols = CATEGORICAL_FEATURES + NUMERIC_FEATURES
    X, y = df[feature_cols], df["selling_price"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    candidates = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(n_estimators=300, max_depth=12, min_samples_leaf=2, random_state=42),
        "gradient_boosting": GradientBoostingRegressor(n_estimators=300, max_depth=3, learning_rate=0.05, random_state=42),
    }

    results = {}
    fitted = {}
    for name, model in candidates.items():
        pipeline = build_pipeline(model)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="r2")
        pipeline.fit(X_train, y_train)
        metrics = evaluate(pipeline, X_test, y_test)
        metrics["cv_r2_mean"] = round(float(cv_scores.mean()), 4)
        metrics["cv_r2_std"] = round(float(cv_scores.std()), 4)
        results[name] = metrics
        fitted[name] = pipeline
        print(f"{name}: {metrics}")

    best_name = max(results, key=lambda n: results[n]["cv_r2_mean"])
    best_pipeline = fitted[best_name]
    print(f"\nBest model (by 5-fold CV R^2): {best_name}")

    # Naive baseline for comparison: predict the median price for every car,
    # the floor any real model needs to beat to be worth shipping.
    median_baseline_mae = float(mean_absolute_error(y_test, [y_train.median()] * len(y_test)))

    joblib.dump(best_pipeline, ARTIFACTS_DIR / "price_model.joblib")
    metadata = {
        "best_model": best_name,
        "results": results,
        "median_baseline_mae": round(median_baseline_mae, 0),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "brands": sorted(df["brand"].unique().tolist()),
        "fuel_types": sorted(df["fuel"].unique().tolist()),
        "feature_cols": feature_cols,
        "reference_year": REFERENCE_YEAR,
    }
    (ARTIFACTS_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
    print(f"\nSaved model + metadata to {ARTIFACTS_DIR}")
    print(f"Median-price baseline MAE: Rs {median_baseline_mae:,.0f} (the floor a real model needs to beat)")
    print(f"Best model MAE:            Rs {results[best_name]['mae']:,.0f}")


if __name__ == "__main__":
    main()
