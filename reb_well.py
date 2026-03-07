from pathlib import Path
import pandas as pd

ROOT = Path('endo/endo')
OUT_1500 = ROOT / 'all_center1500.csv'
OUT_2900 = ROOT / 'all_center2900.csv'

EXPECTED_COLS = ['X', 'Y', 'Wave', 'Intensity']

def extract_label(filename: str, variants):
    name = filename.lower()
    for v in variants:
        if v in name:
            return v
    return None

def parse_filename(path: Path):
    name = path.name.lower()

    brain_department = extract_label(name, ['cortex', 'striatum', 'cerebellum'])
    group_mouse = extract_label(name, ['exo', 'endo', 'control'])
    center = extract_label(name, ['center1500', 'center2900'])

    missing = []
    if brain_department is None:
        missing.append('brain department')
    if group_mouse is None:
        missing.append('group mouse')
    if center is None:
        missing.append('center')

    if missing:
        raise ValueError(f'Не удалось извлечь {missing} из имени файла: {path.name}')

    return brain_department, group_mouse, center

def read_txt_file(path: Path):
    brain_department, group_mouse, center = parse_filename(path)

    df = pd.read_csv(
        path,
        sep=r'\s+',
        engine='python'
    )

    df.columns = [str(c).replace('#', '').strip() for c in df.columns]

    if df.shape[1] < 4:
        raise ValueError(f'В файле меньше 4 колонок: {path}')

    if df.columns.tolist()[:4] != EXPECTED_COLS:
        if all(col in df.columns for col in EXPECTED_COLS):
            df = df[EXPECTED_COLS].copy()
        else:
            raise ValueError(
                f'Ожидались колонки {EXPECTED_COLS}, получены {df.columns.tolist()} в файле {path}'
            )
    else:
        df = df.iloc[:, :4].copy()
        df.columns = EXPECTED_COLS

    for col in EXPECTED_COLS:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.dropna(subset=EXPECTED_COLS)

    df['brain department'] = brain_department
    df['group mouse'] = group_mouse
    df['center'] = center
    df['source_file'] = str(path)

    return df

txt_files = sorted(ROOT.rglob('*.txt'))

if not txt_files:
    raise FileNotFoundError(f'Не найдено .txt файлов в папке: {ROOT}')

all_dfs = []
errors = []

for path in txt_files:
    try:
        df = read_txt_file(path)
        all_dfs.append(df)
    except Exception as e:
        errors.append((str(path), str(e)))

if not all_dfs:
    raise RuntimeError('Не удалось прочитать ни одного файла.')

full_df = pd.concat(all_dfs, ignore_index=True)

final_cols = [
    'X', 'Y', 'Wave', 'Intensity',
    'brain department', 'group mouse', 'center'
]
full_df = full_df[final_cols]

df_1500 = full_df[full_df['center'] == 'center1500'].copy()
df_2900 = full_df[full_df['center'] == 'center2900'].copy()

df_1500.to_csv(OUT_1500, index=False, encoding='utf-8-sig')
df_2900.to_csv(OUT_2900, index=False, encoding='utf-8-sig')

print(f'Найдено txt файлов: {len(txt_files)}')
print(f'Успешно обработано: {len(all_dfs)}')
print(f'С ошибками: {len(errors)}')
print(f'center1500 rows: {len(df_1500)} -> {OUT_1500}')
print(f'center2900 rows: {len(df_2900)} -> {OUT_2900}')

if errors:
    print('\nОшибки:')
    for file_path, err in errors:
        print(file_path, '->', err)
