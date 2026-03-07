# Raman preprocessing and training

## Назначение

Этот проект реализует полный pipeline обработки Raman-спектров: от чтения исходных CSV-файлов до подготовки матрицы признаков и обучения модели классификации. Pipeline существует в двух вариантах: минимальный, понятный для быстрого старта, и расширенный, более пригодный для production и детального аудита качества данных.

Основные классы:
- `control`
- `endo`
- `exo`

Основные спектральные диапазоны:
- `band1500`: 1240.0–1700.0
- `band2900`: 2830.0–3070.0

Обязательные колонки во входных CSV:
- `wave`
- `intensity`
- `brainregion`
- `class`

---

## Общая логика решения

Pipeline выполняет следующие шаги:

1. Находит и загружает входные CSV-файлы.
2. Нормализует имена колонок и категориальные значения.
3. Проверяет схему и очищает строки с некорректными значениями.
4. Делит один CSV на отдельные спектры по разрыву монотонности `wave`.
5. Определяет band спектра (`band1500` или `band2900`).
6. Выполняет первичный QC по спектру.
7. Делит данные на `train` / `valid` / `test`.
8. На train-части оценивает параметры профилирования band-а.
9. Выполняет baseline correction, smoothing, normalization и interpolation.
10. Извлекает peak-based, window-based и full-spectrum признаки.
11. Кодирует классы и категориальные поля.
12. Сохраняет train-ready таблицы и артефакты.
13. Обучает `RandomForestClassifier` и сохраняет модель в `joblib`.

---

## Структура notebooks

### 1. `Raman_minimal_preprocessing_pipeline.ipynb`

Упрощенный и более читаемый вариант для разработчиков. Он полезен для понимания базовой логики preprocessing и feature engineering.

Главные результаты:
- `manifest.csv`
- `1500preprocessing.csv`
- `2900preprocessing.csv`

### 2. `RamanPreprocessingPipeline_patched-2.ipynb`

Расширенная версия pipeline с конфигурационными dataclass, более подробным QC, отдельными артефактами и orchestration через класс `RamanPreprocessingPipeline`.

Главные результаты:
- `manifest.csv`
- `invalidfiles.csv`
- `invalidspectra.csv`
- `objectsummary.csv`
- `spectrumsummary.csv`
- `spectrainterptable.csv`
- `spectrumfeatures.csv`
- `trainreadymatrix.csv`
- `labelencoder.json`
- `bandprofiles.json`
- `consensuspeakwindows.json`
- `pipelineconfig.json`

---

## Конфигурация

В расширенной версии основные параметры вынесены в dataclass-конфиги:

- `IOConfig` — входная папка, выходная папка, маска CSV, режим рекурсивного поиска.
- `BaselineConfig` — параметры AsLS baseline correction: `lam`, `p`, `niter`.
- `SmoothingConfig` — параметры Savitzky-Golay: `polyorder`, `minwindow`, `maxwindow`.
- `ProfilingConfig` — настройки профилирования train-спектров, fallback-пороги и параметры peak picking.
- `FeatureConfig` — настройки числа пиков и размеров consensus windows.
- `SplitConfig` — размеры `train`, `valid`, `test` и `randomstate`.
- `RuntimeConfig` — служебные параметры выполнения, например `loglevel`.
- `RamanPipelineConfig` — общий контейнер, объединяющий все конфиги pipeline.

Метод `RamanPipelineConfig.validate()` проверяет корректность конфигурации, например сумму долей split и совместимость параметров сглаживания.

---

## Описание функций preprocessing

### I/O и нормализация

#### `normalizecolumns(df)`
Приводит названия колонок к нижнему регистру и убирает лишние пробелы. Нужна для унификации схемы входных CSV.

#### `normalizecategoricals(s)`
Приводит категориальные значения к строковому виду, удаляет лишние пробелы и приводит к нижнему регистру.

#### `loadcsv(filepath)`
Используется в минимальном pipeline. Читает CSV, проверяет наличие обязательных колонок, приводит `wave` и `intensity` к numeric, нормализует `brainregion` и `class`, затем удаляет строки с пропусками.

#### `loadandcleancsv(filepath, sourcefileid, encoding)`
Используется в расширенном pipeline. Делает очистку аналогично `loadcsv`, но дополнительно возвращает summary по файлу и объект с причиной ошибки, если файл невалиден.

#### `discovermanifest(inputfiles)`
Создает manifest для фиксированного списка файлов в минимальном notebook. Содержит имя файла, путь и признак существования.

#### `discovercsvfiles(inputdir, recursive, pattern)`
Ищет CSV в директории в расширенном pipeline и присваивает каждому файлу `sourcefileid`.

---

### Сегментация спектров

#### `countrawspectra(df)`
Оценивает количество спектров в сыром CSV по переходам, где `wave[i] > wave[i-1]`, то есть начинается новый спектр.

#### `segmentspectra(df)`
Минимальная версия сегментации. Делит один DataFrame на набор спектров и присваивает каждому `spectrumid`.

#### `segmentfileintospectra(df, sourcefileid, filepath, nextidx)`
Расширенная версия сегментации. Возвращает список спектров с глобальными ID, `sourcefileid` и исходным путем.

---

### QC и метаданные

#### `detectband(wavemin, wavemax)`
Определяет, попадает ли спектр в `band1500` или `band2900`, сравнивая границы спектра с заранее заданными диапазонами.

#### `enrichspectrummetadata(spectrum)`
В минимальной версии формирует словарь с метаданными спектра: число точек, минимальную и максимальную волну, band, согласованность меток и признак убывания `wave`.

#### `hasvalidsteplogic(wave)`
В расширенной версии проверяет корректность шага по оси `wave`: значения должны быть конечными, а после подготовки к интерполяции шаг должен быть положительным.

#### `computespectrumpreqc(spectrum)`
Проводит первичный контроль качества спектра. Проверяет число точек, отсутствие пропусков, согласованность меток внутри спектра, монотонность `wave`, корректность шага и принадлежность допустимому band.

#### `buildgrouptable(spectra)`
Агрегирует спектры на уровне `sourcefileid`, чтобы split в полном pipeline можно было выполнять по файлам, а не по отдельным спектрам.

#### `assigngroupsplits(groupdf, cfg)`
В полной версии назначает `train` / `valid` / `test` на уровне `sourcefileid`, стараясь сохранить стратификацию по доминирующему классу.

#### `stratifiedsplitmeta(metadf)`
В минимальном pipeline выполняет stratified split на уровне спектров по колонке `class`.

---

### Подготовка сигнала

#### `preparexyforinterpolation(wavedesc, intensitydesc)`
Сортирует точки по `wave` в возрастающем порядке, объединяет дубликаты по `wave` через среднее значение `intensity`, затем проверяет, что шаг интерполяции положительный и корректный.

#### `aslsbaseline(y, lam, p, niter)`
Реализует AsLS baseline correction. Возвращает baseline, который затем вычитается из сигнала.

#### `choosewindowlength(npoints, minwindow, maxwindow, polyorder)`
Подбирает допустимую нечетную длину окна для Savitzky-Golay filter с учетом длины сигнала и `polyorder`.

#### `interpolatewithedgefill(x, y, grid)`
Интерполирует сигнал на фиксированную сетку `grid` и заполняет значения вне диапазона крайними значениями.

#### `safequantile(values, q, fallback)`
Считает квантиль только по корректным числам. Если подходящих значений нет, возвращает `fallback`.

---

### Profiling train-части

#### `profiletrainband(trainitems, bandid)`
Минимальная версия profiling для одного band-а. По train-спектрам оценивает:
- минимальное число точек,
- минимальное покрытие диапазона,
- шаг сетки,
- параметры peak picking.

#### `profiletrainspectra(trainspectra, cfg)`
Расширенная версия profiling сразу для всех band-ов. Результат сохраняется в `bandprofiles.json`.

Профилирование важно, потому что downstream preprocessing использует параметры, оцененные только на `train`, чтобы не подглядывать в validation и test.

---

### Предобработка одного спектра

#### `preprocessspectrum(item, bandprofile)`
Минимальная версия функции. Для одного спектра выполняет:
1. проверку соответствия band,
2. базовые QC-пороги,
3. подготовку `x, y`,
4. baseline correction,
5. smoothing,
6. normalization,
7. interpolation на общую сетку.

Если какой-либо этап не проходит, функция возвращает `None`.

#### `preprocessspectrum(spectrum, bandprofiles, cfg)`
Расширенная версия с тем же смыслом, но с более детальной диагностикой причин отбраковки и расширенным набором служебных полей.

---

## Описание функций feature engineering

#### `mergeclosepositions(positions, mergedistance)`
Объединяет близко расположенные peak positions в один центр. Используется при построении consensus windows.

#### `buildconsensuswindows(trainprocessed, bandprofile)`
В минимальном pipeline строит набор окон вокруг средних пиков train-спектров одного band-а.

#### `buildconsensuspeakwindows(processedtrain, bandprofiles, cfg)`
Полная версия построения consensus windows по каждому band-у. Результат сохраняется в `consensuspeakwindows.json`.

#### `spectralentropy(y)`
Считает спектральную энтропию сигнала как одну из глобальных характеристик формы спектра.

#### `computepeakmetrics(grid, y, bandprofile)`
Ищет пики через `find_peaks`, вычисляет:
- количество пиков,
- позиции,
- высоты,
- prominence,
- widths,
- локальные площади,
- расстояния между пиками,
- главный пик.

#### `extractwindowfeatures(grid, y, windows)`
Извлекает признаки внутри каждого consensus window. Обычно это локальный максимум, положение максимума, интенсивность в центре окна, площадь, среднее значение и относительные ratios.

#### `extractfullspectrumfeatures(grid, y, peakmetrics)`
Строит глобальные признаки по всему спектру:
- `fullarea`
- `fullmean`
- `fullstd`
- `fullskew`
- `fullkurtosis`
- `signalenergy`
- `nlocalmaxima`
- `spectralentropy`

#### `flattenpeakmetrics(peakmetrics)`
Переводит словарь peak-метрик в плоский табличный формат с колонками вроде `peak01position`, `peak01height` и `peakdistance01`.

#### `buildfeaturerow(processed, bandprofile, consensuswindows)`
Минимальная версия сборки одной строки признаков. Объединяет peak-based признаки, window-based признаки, full-spectrum признаки и вектор интерполированного сигнала `iXXXX`.

#### `extractspectrumfeatures(processed, bandprofiles, consensuswindows, cfg)`
Расширенная версия сборки feature row в production-style pipeline.

---

## Кодирование меток и категорий

#### `fitlabelencoder(traindf)`
Строит mapping строковых классов в целочисленные метки на основе train-части. Классы сортируются лексикографически, поэтому mapping имеет вид:
- `control -> 0`
- `endo -> 1`
- `exo -> 2`

#### `fitcategoryencoder(traindf, col)`
Строит mapping для категориальных колонок, например `brainregion` и `bandid`.

#### `applyencoder(series, encoder)`
Минимальная версия применения encoder к одной Series. Неизвестные значения кодируются как `-1`.

#### `applycategoryencoder(df, col, encoder)`
Расширенная версия применения encoder к колонке DataFrame.

#### `savejson(obj, path)`
Сохраняет объект в JSON. Используется для encoder-ов, band profiles, consensus windows и config.

#### `savecsv(df, path)`
Сохраняет DataFrame в CSV.

---

## Главные orchestrator-функции

#### `processsinglefile(filepath, outputname)`
Главная функция минимального preprocessing pipeline. Последовательно:
1. загружает CSV,
2. сегментирует спектры,
3. фильтрует невалидные спектры,
4. делает split,
5. строит band profiles,
6. предобрабатывает спектры,
7. строит consensus windows,
8. извлекает признаки,
9. кодирует метки,
10. сохраняет итоговый preprocessing CSV.

Эта функция удобна для чтения, потому что почти весь основной pipeline виден в одном месте.

#### `RamanPreprocessingPipeline.__init__(config)`
Создает объект полного pipeline, проверяет config, инициализирует логирование, фиксирует seed и создает выходную директорию.

#### `RamanPreprocessingPipeline.run()`
Главная точка входа расширенной версии. Выполняет полный end-to-end pipeline: discovery, очистку, QC, split, profiling, preprocessing, feature extraction, encoding и сохранение всех артефактов.

---

## Функции обучения модели

#### `loaddataset(path)`
Загружает подготовленный preprocessing CSV для обучения. Если `target` отсутствует, восстанавливает его по train-классам.

#### `buildlabelmap(df)`
Строит обратную карту `target -> class`, которая нужна для интерпретации предсказаний, отчетов и confusion matrix.

#### `selectinterpretablefeatures(df)`
Отбирает числовые признаки для интерпретируемой модели. Исключает leakage-колонки, например `class`, `target`, `split`, и обычно исключает векторные признаки `iXXXX`, если модель должна оставаться более читаемой.

#### `preparesplits(df)`
Возвращает булевы маски для `train`, `valid` и `test`.

#### `saveconfusionmatrix(cm, labels, outpath)`
Сохраняет confusion matrix в CSV с подписями классов.

#### `evaluatesplitmodel(X, y, labelmap, splitname, outdir, datasetdf, rowmask)`
Выполняет оценку модели на одном split:
- строит предсказания,
- считает accuracy и macro-F1,
- сохраняет classification report,
- сохраняет confusion matrix,
- сохраняет таблицу с probability и predicted label.

#### `traininterpretablerfforfile(inputpath, modelname)`
Главная функция обучения RandomForest на одном preprocessing CSV. Она:
1. загружает датасет,
2. строит label map,
3. выбирает признаки,
4. выделяет train/valid/test,
5. заполняет пропуски train-медианами,
6. обучает `RandomForestClassifier`,
7. сохраняет `joblib`-модель,
8. считает importances,
9. сохраняет метрики по split-ам.

#### `makefeaturesets(df)`
В расширенной training-части автоматически формирует несколько семейств признаков, например full-like, window-like и peak-like, чтобы можно было сравнить разные представления данных.

#### `prepareX(df, cols, fitmask)`
Собирает матрицу признаков из указанного набора колонок, удаляет слишком пустые и константные признаки, а затем заполняет пропуски train-медианами.

#### `getclassmap(df)`
Вспомогательная функция, строящая карту классов из таблицы, если в ней присутствуют `class` и `target`.

---

## Артефакты обучения

После обучения RandomForest обычно сохраняются:
- `*.joblib` — сериализованная модель или bundle,
- `featurelist.csv` — список признаков,
- `mdiimportance.csv` — importance по impurity,
- `permutationimportance.csv` — permutation importance,
- `classificationreport_<split>.csv` — classification report,
- `confusionmatrix_<split>.csv` — confusion matrix,
- `predictions_<split>.csv` — таблица предсказаний.

Если сохраняется bundle, в нем обычно находятся:
- модель,
- список колонок признаков,
- `labelmap`,
- train median values,
- дополнительные encoder-ы,
- параметры модели.

---

## Почему pipeline устроен именно так

### 1. Profiling только на train
Это снижает риск leakage. Параметры grid, peak thresholds и quality thresholds не должны подстраиваться под validation или test.

### 2. Общая интерполяционная сетка
Единая сетка делает признаки сопоставимыми между спектрами внутри одного band-а.

### 3. AsLS baseline correction
Raman-спектры часто имеют фон и медленную baseline-компоненту, поэтому baseline correction необходим перед peak analysis.

### 4. Savitzky-Golay smoothing
Сглаживание уменьшает шум и помогает стабильнее находить пики, не разрушая форму сигнала так сильно, как более грубые методы.

### 5. Несколько типов признаков
Комбинация глобальных признаков, локальных peak-based признаков и window-based признаков позволяет модели видеть сигнал на разных уровнях описания.

### 6. Явные артефакты
Сохранение manifest, QC-таблиц, encoder-ов и feature tables сильно упрощает аудит, воспроизводимость и отладку.

---

## Рекомендации разработчикам

- Если нужно быстро понять основную логику, начинайте с `Raman_minimal_preprocessing_pipeline.ipynb`.
- Если нужно поддерживать production-процесс, ориентируйтесь на `RamanPreprocessingPipeline_patched-2.ipynb` и класс `RamanPreprocessingPipeline`.
- Если требуется добавить новый признак, удобнее всего менять блок feature engineering: `computepeakmetrics`, `extractwindowfeatures`, `extractfullspectrumfeatures`, `flattenpeakmetrics` и сборку feature row.
- Если требуется изменить правила QC, смотрите `computespectrumpreqc` и пороги profiling.
- Если требуется изменить модель, точка входа обычно находится в `traininterpretablerfforfile` или в расширенной training-части notebook.

---

## Краткая схема зависимостей

```text
CSV -> cleaning -> segmentation -> QC -> split
    -> train profiling -> preprocessing
    -> consensus windows -> feature extraction
    -> encoders -> train-ready dataset
    -> RandomForest training -> joblib/model artifacts
```

---

## Для новых разработчиков

Рекомендуемый порядок чтения кода:

1. `processsinglefile()` или `RamanPreprocessingPipeline.run()`
2. `loadcsv()` / `loadandcleancsv()`
3. `segmentspectra()` / `segmentfileintospectra()`
4. `computespectrumpreqc()`
5. `profiletrainband()` / `profiletrainspectra()`
6. `preprocessspectrum()`
7. `computepeakmetrics()` и функции feature extraction
8. `fitlabelencoder()` и category encoders
9. `traininterpretablerfforfile()`

Так проще всего понять полный путь данных от сырого CSV до сохраненной модели.
