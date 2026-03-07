#!/usr/bin/env python3
import argparse
from pathlib import Path
import pandas as pd
import sys

def process_spectrum(input_dir, brain_region, target_range, output_file):
    """
    Обрабатывает спектральные данные из файлов в указанной директории
    
    Args:
        input_dir: директория с входными файлами
        brain_region: область мозга
        target_range: целевой диапазон (center1500 или center2900)
        output_file: путь к выходному файлу
    """
    
    # Диапазоны волновых чисел
    RANGES = {
        "center1500": (1240, 1700),
        "center2900": (2830, 3070)
    }
    
    # Проверка корректности выбранного диапазона
    if target_range not in RANGES:
        print(f"ОШИБКА: target_range должен быть 'center1500' или 'center2900'", file=sys.stderr)
        sys.exit(1)
    
    RANGE_MIN, RANGE_MAX = RANGES[target_range]
    BASE_DIR = Path(input_dir)
    
    rows = []
    
    # Собираем все txt файлы из указанной директории
    txt_files = list(BASE_DIR.glob('*.txt'))
    print(f"Найдено txt файлов: {len(txt_files)}")
    
    if not txt_files:
        print(f"ВНИМАНИЕ: Нет файлов для обработки в {input_dir}", file=sys.stderr)
        # Создаем пустой DataFrame
        pd.DataFrame(columns=['wave', 'intensity', 'brain_region']).to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"Создан пустой файл {output_file}")
        return
    
    for txt_file in txt_files:
        filename = txt_file.stem
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
                part['brain_region'] = brain_region
                rows.append(part[['wave', 'intensity', 'brain_region']])
                print(f"  Добавлено строк: {len(part)}")
            else:
                print(f"  Нет данных в указанном диапазоне")
                    
        except Exception as e:
            print(f"  ОШИБКА при обработке: {e}", file=sys.stderr)
            continue
    
    # Сохранение результатов
    print(f"\nИтого:")
    if rows:
        total_rows = sum(len(df) for df in rows)
        # Объединяем все данные
        result_df = pd.concat(rows, ignore_index=True)
        
        # Сохраняем в CSV
        result_df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"  Сохранено {total_rows} строк в {output_file}")
        
        # Покажем первые несколько строк для проверки
        print("\nПервые 5 строк результата:")
        print(result_df.head())
    else:
        print(f"  Нет данных для сохранения")
        # Создаем пустой файл с правильной структурой
        pd.DataFrame(columns=['wave', 'intensity', 'brain_region']).to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"  Создан пустой файл {output_file}")
    
    print('\nГотово!')

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Обработка спектральных данных')
    parser.add_argument('--input-dir', required=True, help='Директория с входными файлами')
    parser.add_argument('--brain-region', required=True, help='Область мозга')
    parser.add_argument('--target-range', required=True, choices=['center1500', 'center2900'], help='Целевой диапазон')
    parser.add_argument('--output-file', required=True, help='Путь к выходному файлу')
    
    args = parser.parse_args()
    
    process_spectrum(
        input_dir=args.input_dir,
        brain_region=args.brain_region,
        target_range=args.target_range,
        output_file=args.output_file
    )