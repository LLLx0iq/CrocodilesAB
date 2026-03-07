from pathlib import Path
import pandas as pd

# НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
# ======================
BASE_DIR = Path('./test')              # папка с данными
BRAIN_REGION = "striatum"              # область мозга для всех файлов
TARGET_RANGE = "center2900"           # что ищем: "center1500" или "center2900"
OUTPUT_FILE = "pred2900.csv"            # имя выходного файла
# ======================

# Диапазоны волновых чисел
RANGES = {
    "center1500": (1240, 1700),
    "center2900": (2830, 3070)
}

# Проверка корректности выбранного диапазона
if TARGET_RANGE not in RANGES:
    print(f"ОШИБКА: TARGET_RANGE должен быть 'center1500' или 'center2900'")
    exit(1)

RANGE_MIN, RANGE_MAX = RANGES[TARGET_RANGE]

rows = []

# Собираем все txt файлы из всех подпапок
txt_files = list(BASE_DIR.rglob('*.txt'))
print(f"Найдено txt файлов: {len(txt_files)}")

for txt_file in txt_files:
    filename = txt_file.stem
    
    # Проверка наличия нужного паттерна в имени
    if TARGET_RANGE not in filename:
        continue
        
    print(f"\nОбработка файла: {filename}")
        
    try:
        # Чтение файла с разделителями-пробельными символами
        df = pd.read_csv(txt_file, sep=r'\s+', engine='python')
        
        # Очистка названий колонок
        df.columns = [c.strip().lstrip('#') for c in df.columns]
        
        # Проверка наличия нужных колонок
        if 'Wave' not in df.columns or 'Intensity' not in df.columns:
            print(f"  Пропущен: нет колонок Wave/Intensity. Доступные колонки: {list(df.columns)}")
            continue

        # Берем только нужные колонки и очищаем данные
        data = df[['Wave', 'Intensity']].copy()
        data['Wave'] = pd.to_numeric(data['Wave'], errors='coerce')
        data['Intensity'] = pd.to_numeric(data['Intensity'], errors='coerce')
        data = data.dropna(subset=['Wave', 'Intensity'])
        
        # Фильтрация по диапазону
        mask = (data['Wave'] >= RANGE_MIN) & (data['Wave'] <= RANGE_MAX)
        part = data.loc[mask, ['Wave', 'Intensity']].copy()
        
        if len(part) > 0:
            part.rename(columns={'Wave': 'wave', 'Intensity': 'intensity'}, inplace=True)
            part['brain_region'] = BRAIN_REGION
            # УБРАЛИ КОЛОНКУ source_file - теперь сохраняем только три колонки
            rows.append(part[['wave', 'intensity', 'brain_region']])
            print(f"  Добавлено строк: {len(part)}")
        else:
            print(f"  Нет данных в указанном диапазоне")
                
    except Exception as e:
        print(f"  ОШИБКА при обработке: {e}")
        continue

# Сохранение результатов
print(f"\nИтого:")
if rows:
    total_rows = sum(len(df) for df in rows)

    
    # Объединяем все данные
    result_df = pd.concat(rows, ignore_index=True)
    
    # Сохраняем в CSV
    result_df.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    print(f"  Сохранено в {OUTPUT_FILE}")
    
    # Покажем первые несколько строк для проверки
    print("\nПервые 5 строк результата:")
    print(result_df.head())
  
else:
    print(f"  Нет данных для сохранения")
    # Создаем пустой файл с правильной структурой (тоже без source_file)
    pd.DataFrame(columns=['wave', 'intensity', 'brain_region']).to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    print(f"  Создан пустой файл {OUTPUT_FILE}")

print('\nГотово!')