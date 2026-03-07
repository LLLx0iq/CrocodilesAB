from pathlib import Path
import pandas as pd

BASE_DIR = Path('data')
OUT_1500 = '1500.csv'
OUT_2900 = '2900.csv'

CLASS_DIRS = {'endo', 'exo', 'control'}
RANGE_1500 = (1240, 1700)   # включительно
RANGE_2900 = (2830, 3070)   # включительно

rows_1500 = []
rows_2900 = []

for class_dir in CLASS_DIRS:
    folder = BASE_DIR / class_dir
    if not folder.exists():
        continue

    for txt_file in folder.rglob('*.txt'):
        filename = txt_file.stem
        brain_part = filename.split('_')[0]
        target = class_dir

        df = pd.read_csv(txt_file, sep='\t', engine='python')
        df.columns = [c.strip().lstrip('#') for c in df.columns]

        if 'Wave' not in df.columns or 'Intensity' not in df.columns:
            raise ValueError(f'В файле {txt_file} не найдены колонки Wave/Intensity')

        data = df[['Wave', 'Intensity']].copy()
        data['Wave'] = pd.to_numeric(data['Wave'], errors='coerce')
        data['Intensity'] = pd.to_numeric(data['Intensity'], errors='coerce')
        data = data.dropna(subset=['Wave', 'Intensity'])

        if 'center1500' in filename:
            part = data[(data['Wave'] >= RANGE_1500[0]) & (data['Wave'] <= RANGE_1500[1])].copy()
            part['отдел мозга'] = brain_part
            part['целевая переменная'] = target
            part = part.rename(columns={'Wave': 'wave', 'Intensity': 'intensity'})
            rows_1500.append(part[['wave', 'intensity', 'отдел мозга', 'целевая переменная']])

        elif 'center2900' in filename:
            part = data[(data['Wave'] >= RANGE_2900[0]) & (data['Wave'] <= RANGE_2900[1])].copy()
            part['отдел мозга'] = brain_part
            part['целевая переменная'] = target
            part = part.rename(columns={'Wave': 'wave', 'Intensity': 'intensity'})
            rows_2900.append(part[['wave', 'intensity', 'отдел мозга', 'целевая переменная']])

if rows_1500:
    pd.concat(rows_1500, ignore_index=True).to_csv(OUT_1500, index=False, encoding='utf-8-sig')
else:
    pd.DataFrame(columns=['wave', 'intensity', 'отдел мозга', 'целевая переменная']).to_csv(OUT_1500, index=False, encoding='utf-8-sig')

if rows_2900:
    pd.concat(rows_2900, ignore_index=True).to_csv(OUT_2900, index=False, encoding='utf-8-sig')
else:
    pd.DataFrame(columns=['wave', 'intensity', 'отдел мозга', 'целевая переменная']).to_csv(OUT_2900, index=False, encoding='utf-8-sig')

print('done')
