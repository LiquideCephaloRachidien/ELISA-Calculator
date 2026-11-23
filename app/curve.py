"""Linear ELISA standard curve. Pure functions: no Flask, no files.

The browser copy lives in app/static/js/curve.js. Change both in the same
commit. Round only when displaying; keep full float precision here.

Pipeline
1. Blank-correct every replicate: corrected = od - blank_od.
   A missing blank is 0.
2. Skip a row whose fields are all empty. A partly filled row is invalid.
   Row handling belongs to app/validation.py; this module only sees numbers.
3. Mean = arithmetic mean of the two corrected replicates.
4. Percent difference = abs(a - b) / mean * 100.
   If the mean is 0, the percent difference is None and nothing is flagged.
   >= Config.CV_WARN_PERCENT (15) is a warning.
   >= Config.CV_BAD_PERCENT (25) is bad.
5. Fit y = slope * x + intercept by ordinary least squares.
   x is concentration, y is mean corrected OD.
   Need at least two points with different x values.
6. Unknown concentration = (mean_corrected_od - intercept) / slope,
   then multiplied by that sample's dilution. Dilution applies to samples
   only. Standards are entered as the concentration already in the well.
   If the slope is 0, there is no concentration.
7. A sample is extrapolated when its mean corrected OD falls outside the
   range of the standards' mean corrected ODs.
8. A corrected OD above Config.SATURATION_OD (2.5) is "possible saturation".
   It is still used in the fit. OD outside Config.OD_MIN..OD_MAX is invalid
   and is rejected by validation before it reaches this module.

Worked example, blank 0
  standards (0, 0.10, 0.10), (10, 0.30, 0.30), (20, 0.50, 0.50)
  slope 0.02, intercept 0.10, R^2 1
  unknown replicates 0.40 and 0.40, dilution 2 -> concentration 30

Percent difference
  0.30 and 0.36 -> 18.181...% -> warning
  0.30 and 0.40 -> 28.571...% -> bad

OLS, for n points
  m = (n * sum(xy) - sum(x) * sum(y)) / (n * sum(x^2) - sum(x)^2)
  b = (sum(y) - m * sum(x)) / n
  R^2 = 1 - SS_res / SS_tot
  If SS_tot is 0, R^2 is None.

Points are {"x": concentration, "y": mean_corrected_od} so the shape
matches the JavaScript objects and the JSON snapshot.
"""


def percent_difference(a: float, b: float) -> float | None:
    raise NotImplementedError


def fit_line(points: list[dict]) -> dict | None:
    """Return {"slope", "intercept", "r2"} or None when a line cannot be fit."""
    raise NotImplementedError


def predict_concentration(
    slope: float,
    intercept: float,
    mean_corrected_od: float,
    dilution: float,
) -> float | None:
    """Return dilution * (od - intercept) / slope, or None if slope is 0."""
    raise NotImplementedError
