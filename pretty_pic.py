import argparse
import pandas as pd
import matplotlib.pyplot as plt
from scipy.signal import find_peaks


PAINT_RANGES = [
    (1240, 1700),
    (2830, 3070),
]

RED_HALF_WIDTH = 3       # сколько точек вокруг вершины красить
MIN_PROMINENCE = 120     # чувствительность к пикам
MIN_DISTANCE = 5         # минимальное расстояние между пиками в точках


def paint_all_peaks(ax, df, left, right,
                    red_half_width=3,
                    min_prominence=120,
                    min_distance=5):
    part = df[(df["wave"] >= left) & (df["wave"] <= right)].copy()
    if part.empty:
        return

    part = part.reset_index()
    peaks, _ = find_peaks(
        part["intensity"].values,
        prominence=min_prominence,
        distance=min_distance
    )

    for p in peaks:
        global_idx = part.loc[p, "index"]
        start = max(0, global_idx - red_half_width)
        end = min(len(df) - 1, global_idx + red_half_width)

        ax.plot(
            df.loc[start:end, "wave"],
            df.loc[start:end, "intensity"],
            color="red",
            linewidth=2.5
        )


def main(input_file, output_file):
    df = pd.read_csv(input_file, encoding="utf-8-sig")

    required = {"wave", "intensity"}
    if not required.issubset(df.columns):
        raise ValueError(f"В CSV должны быть столбцы: {required}")

    df["wave"] = pd.to_numeric(df["wave"], errors="coerce")
    df["intensity"] = pd.to_numeric(df["intensity"], errors="coerce")
    df = df.dropna(subset=["wave", "intensity"])

    avg_df = (
        df.groupby("wave", as_index=False)["intensity"]
        .mean()
        .sort_values("wave")
        .reset_index(drop=True)
    )

    fig, ax = plt.subplots(figsize=(12, 6))

    ax.plot(avg_df["wave"], avg_df["intensity"], color="blue", linewidth=1.6)

    for left, right in PAINT_RANGES:
        paint_all_peaks(
            ax, avg_df, left, right,
            red_half_width=RED_HALF_WIDTH,
            min_prominence=MIN_PROMINENCE,
            min_distance=MIN_DISTANCE
        )

    ax.set_title("Визуальное представление среднего введенных данных")
    ax.set_xlabel("wave")
    ax.set_ylabel("intensity")
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    plt.close(fig)



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input_file", nargs="?", default="pred.csv")
    parser.add_argument("--output", default="avg_spectrum.png")
    args = parser.parse_args()

    main(args.input_file, args.output)
