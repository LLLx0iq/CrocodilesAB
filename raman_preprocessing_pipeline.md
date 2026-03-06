# Raman Spectroscopy — Data Preprocessing Pipeline (LLM-readable)

Version: 1.0  
Scope: 1D Raman spectra (single spectra, batches, and simple maps), for ML/DL tasks (classification/regression). [web:9][web:5]

---

## 0) Intent (what this pipeline optimizes)
Goal: transform raw Raman spectra into *model-ready* inputs while preserving chemically meaningful peaks and reducing instrument/sample artifacts. [web:9][web:15]

Primary artifacts to handle:
- Cosmic ray spikes (sharp, narrow, non-physical peaks). [web:9][web:33]
- Fluorescence/background (broad baseline; often dominates Raman signal). [web:9][web:35]
- Intensity scaling differences (laser power, focus, integration time, optics). [web:9][web:15]
- Scatter / multiplicative effects (powders, heterogeneous samples). [web:9]
- Noise (shot noise, detector noise) without smearing real Raman peaks. [web:9]

---

## 1) Input / Output contract

### Input (raw)
Each spectrum record should contain:
- x: Raman shift axis (cm⁻¹) OR wavelength axis (must be convertible). [web:9]
- y: intensity values (counts). [web:9]
- metadata (strongly recommended): instrument ID, laser wavelength, resolution, integration time, power, date/time, sample prep, substrate (for SERS), operator. [web:5]

### Output (preprocessed)
- x_common: common/standardized Raman shift grid.
- y_processed: corrected + normalized spectrum on x_common.
- qc_flags: per-spectrum flags (spikes detected, baseline fit quality, saturation, low SNR, truncation). [web:9]

---

## 2) Pipeline overview (strict order)
IMPORTANT ORDER RULE:
1) Remove cosmic rays **before** any smoothing/derivatives, otherwise spikes will smear and become harder to remove. [web:9]

Canonical sequence:
1. Harmonize axis (calibration + resampling/interpolation to a common grid). [web:9]
2. Detect & remove cosmic rays (despike). [web:9][web:33]
3. Baseline / fluorescence correction. [web:9][web:35]
4. Scatter correction (MSC/EMSC/SNV) when relevant (powders/heterogeneous optics). [web:9]
5. Denoising / smoothing (e.g., Savitzky–Golay) if needed. [web:9]
6. Intensity normalization / scaling (vector, area, z-score, etc.). [web:9][web:15]
7. Feature enhancement (optional): derivatives, peak picking, band integration. [web:9]
8. (Optional) Dimensionality reduction / feature extraction for classic ML (PCA/PLS). [web:5]

---

## 3) Step-by-step specification (each step has: Purpose / When / Methods / Key params / QC)

### STEP 1 — Axis harmonization (x-grid standardization)
Purpose:
- Ensure spectra are comparable point-to-point across samples/instruments. [web:9]

When:
- Always, if x-grids differ across files/instruments or if you will batch-train ML. [web:9][web:5]

Methods:
- Convert to Raman shift if needed; calibrate using known reference peaks when available; then resample to x_common via interpolation. [web:9]

Key parameters:
- x_range: choose meaningful range (e.g., fingerprint region); keep consistent across dataset. [web:5]
- grid_spacing: match instrument resolution / typical peak widths; avoid oversampling that inflates noise. [web:9]

QC checks:
- Monotonic x, no gaps, no duplicated points.
- Track how many points were extrapolated (should be ~0). [web:9]

Output:
- x_common, y_resampled. [web:9]

---

### STEP 2 — Cosmic ray removal (despiking)
Purpose:
- Remove narrow spikes unrelated to chemistry (particle hits on detector). [web:9][web:33]

When:
- Recommended for most CCD-based Raman acquisitions; especially if exposure is long. [web:9]

Methods (common families):
- Threshold / window methods (fast): detect extreme local outliers using robust statistics, replace by local fit/median. [web:9]
- Polynomial/“missing-point” approaches: fit local polynomial excluding spike point. [web:9]
- Wavelet-based despiking: identify spike-like components at specific scales, reconstruct without them. [web:9]

Key parameters:
- spike_threshold: robust z-score or MAD-based threshold.
- window_size: should be smaller than typical real peak width to avoid removing real peaks. [web:9]

QC checks:
- Log number of spikes removed; unusually high counts may indicate acquisition issues.
- Visual spot-check: confirm real Raman peaks not flattened. [web:9][web:33]

Output:
- y_despiked. [web:9]

---

### STEP 3 — Baseline / fluorescence correction
Purpose:
- Remove broad background (often fluorescence) without distorting Raman peaks. [web:9][web:35]

When:
- Almost always for biological samples, colored materials, many organics, SERS substrates. [web:35][web:9]

Methods (widely used):
- AsLS / arPLS / airPLS: asymmetric penalized least squares baseline; robust and popular. [web:9]
- Polynomial baseline (ModPoly variants): fast, but can be sensitive to complex baselines. [web:9]
- Wavelet baseline removal: separates low-frequency baseline from high-frequency peaks. [web:9]
- Learned approaches (DL-based correction): used in newer work for complex cases. [web:9][web:30]

Key parameters (for AsLS-like):
- λ (smoothness penalty): higher → smoother baseline.
- p (asymmetry): lower p biases baseline under peaks. [web:9]

QC checks:
- Baseline should be smooth and stay below/around the spectral envelope, not cutting through major peaks. [web:9]
- Store baseline curve for auditability. [web:9]

Output:
- y_baseline_corrected, baseline_curve. [web:9]

---

### STEP 4 — Scatter correction (optional but important in many solids)
Purpose:
- Correct multiplicative/additive scatter effects and path-length differences. [web:9]

When:
- Powders, particulates, turbid media, variable focusing, strong scattering differences. [web:9]

Methods:
- SNV (per-spectrum centering/scaling).
- MSC / EMSC (align to reference/mean spectrum; EMSC can include polynomial terms). [web:9]

Key parameters:
- reference spectrum choice (mean, median, or known reference).
- polynomial order (for EMSC). [web:9]

QC checks:
- After correction, relative peak ratios should be more stable across replicates.
- Beware: aggressive correction can remove real physical intensity variation (bad for quantification if intensity carries concentration info). [web:9][web:15]

Output:
- y_scatter_corrected. [web:9]

---

### STEP 5 — Denoising / smoothing (use carefully)
Purpose:
- Improve SNR while preserving peak shapes/positions. [web:9]

When:
- Low SNR spectra, but only after despiking and baseline correction. [web:9]

Methods:
- Savitzky–Golay smoothing: common default, preserves peak width better than simple moving average. [web:9]
- Wavelet denoising: shrinkage/thresholding in wavelet domain. [web:9]

Key parameters (Savitzky–Golay):
- window_length: odd integer; set relative to peak widths/resolution.
- poly_order: typically low (2–4); too high can introduce artifacts. [web:9]

QC checks:
- Compare original vs smoothed around sharp peaks; ensure no peak shift or excessive broadening. [web:9]

Output:
- y_denoised. [web:9]

---

### STEP 6 — Intensity normalization / scaling (choose based on task)
Purpose:
- Make spectra comparable across acquisition settings, and stabilize ML training. [web:9][web:15]

When:
- Nearly always for classification; for quantitative regression choose carefully to not destroy absolute concentration information. [web:15][web:9]

Common choices:
- Vector (L2) normalization: good for classification when shape matters. [web:9]
- Z-score standardization: robust across batches, common for ML. [web:9]
- Min–max scaling: convenient but sensitive to outliers. [web:9]
- Area normalization (integral): used when total intensity is not meaningful. [web:9]

QC checks:
- Track scaling factors; extreme values indicate measurement problems (e.g., saturation, near-zero signal). [web:9]

Output:
- y_normalized, scale_params. [web:9]

---

### STEP 7 — Feature enhancement (optional, depends on model)
Purpose:
- Increase separability or reduce baseline sensitivity. [web:9]

When:
- Classic ML with limited data; overlapping peaks; heavy baseline residuals. [web:5][web:9]

Methods:
- 1st/2nd derivatives (often via Savitzky–Golay derivatives) to emphasize peak shapes and suppress slowly varying background. [web:9]
- Peak picking / band integration (domain-driven features) for interpretability. [web:5]

QC checks:
- Derivatives amplify noise; ensure denoising is adequate and do not use overly narrow windows. [web:9]

Output:
- y_features (could be derivative spectrum or engineered features). [web:9]

---

### STEP 8 — Optional: dimensionality reduction / feature extraction (classic ML)
Purpose:
- Reduce dimensionality, mitigate multicollinearity, improve generalization on small datasets. [web:5]

When:
- SVM, PLS-DA, RF on small/medium datasets. [web:5]

Methods:
- PCA → classifier (SVM/LDA/QDA).
- PLS / PLS-DA (often strong and interpretable in spectroscopy). [web:5]

QC checks:
- Use proper cross-validation; fit PCA/PLS only on training folds to avoid leakage. [web:5]

Output:
- low_dim_features + fitted transforms. [web:5]

---

## 4) Recommended defaults (practical “starter config”)
For typical biological Raman classification:
1) Resample to common grid.
2) Despike (robust threshold + local replacement).
3) Baseline correction (arPLS or AsLS).
4) (Optional) SNV or EMSC if strong scatter variability.
5) Savitzky–Golay smoothing.
6) L2 normalization.
7) Train SVM (RBF) or PLS-DA as baseline; move to 1D-CNN if dataset is large enough. [web:9][web:5]

For quantitative regression (concentration):
- Prefer minimal normalization that preserves absolute intensities; document each transform; validate on external sets when possible. [web:15]

---

## 5) Validation protocol (preprocessing must be evaluated, not assumed)
- Always keep raw spectra and store intermediate outputs per step for audit. [web:9]
- Evaluate sensitivity: run ablations (e.g., with/without baseline correction) and compare CV metrics. [web:5]
- Avoid data leakage: any fitted transform (baseline parameters chosen per dataset, PCA/PLS, scalers) must be fitted on training data only within CV. [web:5]

---

## 6) Minimal pseudocode (for an LLM or engineer)
Given spectrum (x, y):

1. y = resample_to_common_grid(x, y, x_common)
2. y = despike_cosmic_rays(y)
3. baseline = estimate_baseline(y)            # AsLS/arPLS/airPLS
4. y = y - baseline
5. y = scatter_correction(y)                  # optional: SNV/MSC/EMSC
6. y = denoise(y)                             # optional: Savitzky–Golay / wavelet
7. y = normalize(y)                           # L2 or z-score, task-dependent
8. y = feature_transform(y)                   # optional: derivatives / peaks / PCA

Return y, qc_flags, and stored transforms.
[web:9][web:5]
