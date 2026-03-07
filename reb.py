from pathlib import Path
import csv

# ===== НАСТРОЙКИ =====
INPUT_DIR = Path(r"./exo/exo")       # папка с txt-файлами
OUTPUT_CSV = Path("exo.csv")   # итоговый csv
CLASS_LABEL = "exo"              # задай нужный класс здесь

def get_center(filename: str):
    if "center1500" in filename:
        return 1500
    if "center2900" in filename:
        return 2900
    return None

def wave_ok(wave: float, center):
    if center == 1500:
        return 1000 < wave < 1600
    if center == 2900:
        return 2800 < wave < 3000
    return True

def parse_file(file_path: Path):
    rows = []

    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        next(f, None)  # пропускаем заголовок

        for line in f:
            parts = line.strip().split()
            if len(parts) < 4:
                continue

            try:
                x = float(parts[0])
                y = float(parts[1])
                wave = float(parts[2])
                intensity = float(parts[3])
            except ValueError:
                continue

            rows.append((x, y, wave, intensity))

    return rows

def main():
    files = sorted(INPUT_DIR.glob("*.txt"))

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as out_f:
        writer = csv.writer(out_f)
        writer.writerow([
            "file_number",
            "x_norm",
            "y_norm",
            "Wave",
            "Intensity",
            "brain_region",
            "class"
        ])

        for file_number, file_path in enumerate(files):
            brain_region = file_path.stem.split("_")[0]
            center = get_center(file_path.name)

            rows = parse_file(file_path)
            if not rows:
                continue

            xs = sorted({row[0] for row in rows})
            ys = sorted({row[1] for row in rows})

            x_map = {x: i for i, x in enumerate(xs)}
            y_map = {y: i for i, y in enumerate(ys)}

            for x, y, wave, intensity in rows:
                if not wave_ok(wave, center):
                    continue

                writer.writerow([
                    file_number,
                    x_map[x],      # 0..34
                    y_map[y],      # 0..14
                    wave,
                    intensity,
                    brain_region,
                    CLASS_LABEL
                ])

    print(f"Готово: {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
