"""
Content-based car recommendation scoring - replaces the old /recommend
endpoint, which just ran a MongoDB filter and asked an LLM (gpt-5.2 via a
paid proxy key) to write recommendation text. That's not a recommendation
engine, it's a chat completion wrapped around a database query - and it
made the whole feature depend on a third-party API key the deployed app
would need indefinitely.

This is a real (if simple) multi-criteria nearest-neighbor scorer: each
catalog car gets a 0-1 match score against the user's stated budget and
preferences, weighted by how much each criterion was actually specified.
No external API call, fully deterministic, and the score is explainable -
you can show exactly why a car ranked where it did.
"""
from dataclasses import dataclass


@dataclass
class UserPreferences:
    budget: float
    fuel_type: str | None = None
    body_type: str | None = None
    transmission: str | None = None


def _budget_fit(car: dict, budget: float) -> float:
    price_min, price_max = car["price_min"], car["price_max"]
    if price_min > budget:
        # Over budget: score decays the further the cheapest trim is above budget
        overshoot = (price_min - budget) / budget
        return max(0.0, 1.0 - overshoot * 2)
    if price_max <= budget:
        return 1.0
    # Budget falls inside the car's price range
    return 1.0


def score_car(car: dict, prefs: UserPreferences) -> dict:
    weights = {"budget": 0.5, "fuel_type": 0.2, "body_type": 0.2, "transmission": 0.1}
    components = {"budget": _budget_fit(car, prefs.budget)}

    if prefs.fuel_type:
        components["fuel_type"] = 1.0 if car["fuel_type"] == prefs.fuel_type else 0.0
    if prefs.body_type:
        components["body_type"] = 1.0 if car["body_type"] == prefs.body_type else 0.0
    if prefs.transmission:
        components["transmission"] = 1.0 if car["transmission"] == prefs.transmission else 0.0

    active_weights = {k: weights[k] for k in components}
    total_weight = sum(active_weights.values())
    score = sum(components[k] * active_weights[k] for k in components) / total_weight

    # Small tie-breaker: safety rating, normalized to a 0-0.05 nudge so it
    # never overrides an actual preference match.
    score += (car.get("safety_rating", 0) / 5.0) * 0.05

    return {"score": round(min(score, 1.0), 4), "components": components}


def rank_cars(cars: list[dict], prefs: UserPreferences, top_n: int = 5) -> list[dict]:
    scored = [{"car": car, **score_car(car, prefs)} for car in cars]
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored[:top_n]


if __name__ == "__main__":
    sample_cars = [
        {"name": "Maruti Swift", "price_min": 600000, "price_max": 900000, "fuel_type": "Petrol", "body_type": "Hatchback", "transmission": "Manual", "safety_rating": 3.5},
        {"name": "Hyundai Creta", "price_min": 1100000, "price_max": 1900000, "fuel_type": "Petrol", "body_type": "SUV", "transmission": "Automatic", "safety_rating": 4.5},
        {"name": "Tata Nexon EV", "price_min": 1450000, "price_max": 1700000, "fuel_type": "Electric", "body_type": "SUV", "transmission": "Automatic", "safety_rating": 5.0},
    ]
    prefs = UserPreferences(budget=1200000, fuel_type="Petrol", body_type="SUV")
    for r in rank_cars(sample_cars, prefs):
        print(r["car"]["name"], r["score"], r["components"])
