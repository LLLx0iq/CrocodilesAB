#!/usr/bin/env python3
import argparse
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.signal import savgol_filter, find_peaks
from scipy.stats import skew, kurtosis
import sys

BAND_RANGES = {
    "center1500": (1240.0, 1700.0),
    "center2900": (2830.0, 3070.0)
}

def spectral_entropy(y):
    y = np.asarray(y, dtype=float)
    p = np.square(np.clip(y, 0, None))
    s = p.sum()
    if s <= 0 or not np.isfinite(s):
        return 0.0
    p = p / s
    p = p[p > 0]
    return float(-(p * np.log(p)).sum())

def segment_into_spectra(df):
    wave = df["wave"].to_numpy()
    starts = np.zeros(len(wave), dtype=bool)
    starts[0] = True
    if len(wave) > 1:
        starts[1:] = wave[1:] > wave[:-1]
    seg_id = starts.cumsum()
    return [g.reset_index(drop=True) for _, g in df.groupby(seg_id, sort=False)]

def extract_features(input_file, brain_region, target_range, output_file):
    # Получаем диапазон
    BAND_LO, BAND_HI = BAND_RANGES.get(target_range, (1240.0, 1700.0))
    
    # Карта brainregion -> code
    brainregion_map = {"cortex": 0, "striatum": 1, "cerebellum": 2}
    
    # Читаем данные
    df = pd.read_csv(input_file)
    df.columns = [c.strip().lower() for c in df.columns]
    
    # Проверяем наличие нужных колонок
    needed = ["wave", "intensity", "brain_region"]
    missing = [c for c in needed if c not in df.columns]
    if missing:
        if "brainregion" in df.columns:
            df = df.rename(columns={"brainregion": "brain_region"})
        else:
            print(f"Ошибка: нет колонок {missing}", file=sys.stderr)
            sys.exit(1)
    
    df["wave"] = pd.to_numeric(df["wave"], errors="coerce")
    df["intensity"] = pd.to_numeric(df["intensity"], errors="coerce")
    df["brain_region"] = df["brain_region"].astype(str).str.strip().str.lower()
    df = df.dropna(subset=["wave", "intensity", "brain_region"]).reset_index(drop=True)
    
    # Разделяем на отдельные спектры
    spectra = segment_into_spectra(df)
    print(f"Найдено спектров: {len(spectra)}")
    
    rows = []
    
    for i, sp in enumerate(spectra, start=1):
        w = sp["wave"].to_numpy(dtype=float)
        y = sp["intensity"].to_numpy(dtype=float)
        
        wmin, wmax = float(np.min(w)), float(np.max(w))
        if not (wmin >= BAND_LO and wmax <= BAND_HI):
            continue
        
        # Реверсируем для обработки
        x = w[::-1].copy()
        z = y[::-1].copy()
        
        good = np.isfinite(x) & np.isfinite(z)
        x = x[good]
        z = z[good]
        
        if len(x) < 11:
            continue
        if np.any(np.diff(x) <= 0):
            continue
        
        try:
            wl = min(11, len(z) if len(z) % 2 == 1 else len(z) - 1)
            if wl < 5:
                continue
            z = savgol_filter(z, window_length=wl, polyorder=2, mode="interp")
            z = z - np.min(z)
            mx = np.max(z)
            if not np.isfinite(mx) or mx <= 0:
                continue
            z = z / mx
        except Exception as e:
            print(f"Ошибка обработки спектра: {e}", file=sys.stderr)
            continue
        
        peaks, _ = find_peaks(z, prominence=0.05)
        
        brainregion_val = str(sp["brain_region"].iloc[0])
        
        row = {
            "spectrum_id": f"sp_{i:08d}",
            "brain_region": brainregion_val,
            "brain_region_code": brainregion_map.get(brainregion_val, -1),
            "band_id": target_range,
            "n_peaks": int(len(peaks)),
            "full_area": float(np.trapezoid(z, x)),
            "full_mean": float(np.mean(z)),
            "full_std": float(np.std(z)),
            "full_skew": float(skew(z)) if len(z) > 2 else 0.0,
            "full_kurtosis": float(kurtosis(z)) if len(z) > 3 else 0.0,
            "signal_energy": float(np.sum(z ** 2)),
            "n_local_maxima": int(len(peaks)),
            "spectral_entropy": float(spectral_entropy(z)),
        }
        
        # Добавляем w_01 признаки (первые 1/3 спектра)
        third = len(z) // 3
        if third > 0:
            w_01 = z[:third]
            w_01_x = x[:third]
            row.update({
                "w_01_local_max": float(np.max(w_01)),
                "w_01_local_argmax": float(w_01_x[np.argmax(w_01)]),
                "w_01_center_intensity": float(w_01[len(w_01)//2]) if len(w_01) > 0 else 0.0,
                "w_01_area": float(np.trapezoid(w_01, w_01_x)),
                "w_01_mean": float(np.mean(w_01)),
                "w_01_area_ratio": float(np.trapezoid(w_01, w_01_x) / np.trapezoid(z, x)) if np.trapezoid(z, x) > 0 else 0.0,
                "w_01_height_ratio": float(np.max(w_01) / np.max(z)) if np.max(z) > 0 else 0.0,
            })
        else:
            row.update({
                "w_01_local_max": 0.0,
                "w_01_local_argmax": 0.0,
                "w_01_center_intensity": 0.0,
                "w_01_area": 0.0,
                "w_01_mean": 0.0,
                "w_01_area_ratio": 0.0,
                "w_01_height_ratio": 0.0,
            })
        
        rows.append(row)
    
    if not rows:
        print("Не найдено спектров в указанном диапазоне", file=sys.stderr)
        sys.exit(1)
    
    # Создаем DataFrame
    features_df = pd.DataFrame(rows)
    print(f"Извлечено признаков для {len(features_df)} спектров")
    print(f"Колонки: {list(features_df.columns)}")
    
    # Сохраняем
    features_df.to_csv(output_file, index=False)
    print(f"Признаки сохранены в: {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-file', required=True)
    parser.add_argument('--brain-region', required=True)
    parser.add_argument('--target-range', required=True, choices=['center1500', 'center2900'])
    parser.add_argument('--output-file', required=True)
    
    args = parser.parse_args()
    
    extract_features(
        input_file=args.input_file,
        brain_region=args.brain_region,
        target_range=args.target_range,
        output_file=args.output_file
    )