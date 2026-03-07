const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Создаем директории
const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'uploads/temp');
const scriptsDir = path.join(__dirname, 'scripts');
const resultsDir = path.join(__dirname, 'processed_results');
const modelsDir = path.join(__dirname, 'models');

console.log('Checking directories:');
console.log('- uploadsDir:', uploadsDir, 'exists:', fs.existsSync(uploadsDir));
console.log('- tempDir:', tempDir, 'exists:', fs.existsSync(tempDir));
console.log('- scriptsDir:', scriptsDir, 'exists:', fs.existsSync(scriptsDir));
console.log('- resultsDir:', resultsDir, 'exists:', fs.existsSync(resultsDir));
console.log('- modelsDir:', modelsDir, 'exists:', fs.existsSync(modelsDir));

// Создаем директории, если их нет
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
  console.log('Создана папка для результатов:', resultsDir);
}
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Создана папка для моделей:', modelsDir);
}

// Функция для полной очистки processed_results
function cleanupProcessedResults() {
  try {
    if (fs.existsSync(resultsDir)) {
      const files = fs.readdirSync(resultsDir);
      for (const file of files) {
        const filePath = path.join(resultsDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`Удален файл из processed_results: ${file}`);
        }
      }
      console.log('✅ Папка processed_results полностью очищена');
    }
  } catch (err) {
    console.error('Ошибка при очистке processed_results:', err);
  }
}

// Настройка multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.txt', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы .txt и .csv'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Эндпоинт для проверки
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Эндпоинт для обработки спектра (старый, оставляем для обратной совместимости)
app.post('/api/process-spectrum', upload.single('file'), async (req, res) => {
  console.log('=== Начало обработки запроса ===');
  
  try {
    if (!req.file) {
      console.log('Ошибка: файл не загружен');
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const { centering, brainRegion } = req.body;
    console.log('Параметры:', { centering, brainRegion });
    console.log('Файл:', req.file);

    const uploadedFilePath = req.file.path;
    const fileName = req.file.filename;

    // Создаем временную директорию
    const sessionDir = path.join(tempDir, Date.now().toString());
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log('Создана временная директория:', sessionDir);

    // Определяем имя файла в зависимости от параметра centering
    const targetFileName = centering === 'center1500' ? '1500.txt' : '2900.txt';
    const targetFilePath = path.join(sessionDir, targetFileName);
    fs.copyFileSync(uploadedFilePath, targetFilePath);
    console.log('Файл скопирован в:', targetFilePath);

    // Путь к выходному файлу
    const outputFile = path.join(sessionDir, centering === 'center1500' ? '1500_processed.csv' : '2900_processed.csv');

    // Путь к Python скрипту
    const pythonScript = path.join(__dirname, 'scripts', 'spectrum_processor.py');
    console.log('Python скрипт:', pythonScript);
    console.log('Python скрипт существует:', fs.existsSync(pythonScript));

    // Запускаем Python скрипт
    const pythonProcess = spawn('python3', [
      pythonScript,
      '--input-dir', sessionDir,
      '--brain-region', brainRegion,
      '--target-range', centering,
      '--output-file', outputFile
    ]);

    let pythonError = '';

    pythonProcess.stderr.on('data', (data) => {
      pythonError += data.toString();
      console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', async (code) => {
      console.log('Python process finished with code:', code);
      
      // Удаляем оригинальный файл
      try {
        fs.unlinkSync(uploadedFilePath);
        console.log('Оригинальный файл удален');
      } catch (err) {
        console.error('Ошибка при удалении файла:', err);
      }

      if (code !== 0) {
        console.error('Ошибка Python скрипта:', pythonError);
        fs.rmSync(sessionDir, { recursive: true, force: true });
        
        return res.status(500).json({ 
          error: 'Ошибка при обработке файла Python скриптом',
          details: pythonError 
        });
      }

      try {
        if (fs.existsSync(outputFile)) {
          // Создаем имя для сохраненного файла
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const savedFileName = `result_${brainRegion}_${centering}_${timestamp}.csv`;
          const savedFilePath = path.join(resultsDir, savedFileName);
          
          // Копируем обработанный файл
          fs.copyFileSync(outputFile, savedFilePath);
          console.log(`✅ ОБРАБОТАННЫЙ ФАЙЛ СОХРАНЕН: ${savedFilePath}`);

          const result = fs.readFileSync(outputFile, 'utf-8');
          const lines = result.trim().split('\n').length - 1;
          
          // Удаляем временную директорию
          fs.rmSync(sessionDir, { recursive: true, force: true });
          console.log('Временная директория удалена');
          
          const response = { 
            success: true, 
            message: `Файл успешно обработан. Результат сохранен как: ${savedFileName}`,
            data: {
              rows_processed: Math.max(0, lines),
              saved_file: savedFileName
            }
          };
          console.log('Отправка ответа:', response);
          res.json(response);
          
          // Очищаем processed_results после отправки ответа
          console.log('Очистка processed_results...');
          cleanupProcessedResults();
          
        } else {
          throw new Error('Выходной файл не создан');
        }
      } catch (err) {
        console.error('Ошибка при чтении результата:', err);
        fs.rmSync(sessionDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'Ошибка при чтении результата: ' + err.message });
      }
    });

  } catch (error) {
    console.error('Общая ошибка:', error);
    res.status(500).json({ error: error.message });
  }
});

// НОВЫЙ ЭНДПОИНТ: Классификация ткани
app.post('/api/classify-tissue', upload.single('file'), async (req, res) => {
  console.log('=== Начало классификации ткани ===');
  console.log('1. Получен запрос');
  
  try {
    if (!req.file) {
      console.log('2. ОШИБКА: файл не загружен');
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    console.log('2. Файл загружен успешно');
    const { centering, brainRegion } = req.body;
    const uploadedFilePath = req.file.path;
    const fileName = req.file.filename;

    console.log('3. Параметры:', { centering, brainRegion });
    console.log('4. Путь к загруженному файлу:', uploadedFilePath);
    console.log('5. Имя файла:', fileName);

    // 1. Создаем временную директорию для обработки
    const processSessionDir = path.join(tempDir, 'classify_' + Date.now().toString());
    fs.mkdirSync(processSessionDir, { recursive: true });
    console.log('6. Создана временная директория:', processSessionDir);
    
    // 2. Копируем загруженный файл для обработки с правильным именем
    const processTargetFile = path.join(processSessionDir, centering === 'center1500' ? '1500.txt' : '2900.txt');
    fs.copyFileSync(uploadedFilePath, processTargetFile);
    console.log('7. Файл скопирован для обработки как:', processTargetFile);
    console.log('7.1 Размер скопированного файла:', fs.statSync(processTargetFile).size);

    // 3. Выходной файл после первого скрипта
    const processedFile = path.join(processSessionDir, centering === 'center1500' ? '1500_processed.csv' : '2900_processed.csv');
    console.log('8. Выходной файл после обработки будет:', processedFile);
    
    // 4. Запускаем первый Python скрипт (spectrum_processor)
    const processScript = path.join(__dirname, 'scripts', 'spectrum_processor.py');
    console.log('9. Путь к spectrum_processor.py:', processScript);
    console.log('9.1 Файл существует:', fs.existsSync(processScript));
    
    const processPython = spawn('python3', [
      processScript,
      '--input-dir', processSessionDir,
      '--brain-region', brainRegion,
      '--target-range', centering,
      '--output-file', processedFile
    ]);

    console.log('10. Запущен spectrum_processor.py с PID:', processPython.pid);

    let processError = '';
    let processOutput = '';

    processPython.stdout.on('data', (data) => {
      processOutput += data.toString();
      console.log('spectrum_processor stdout:', data.toString());
    });

    processPython.stderr.on('data', (data) => {
      processError += data.toString();
      console.error('spectrum_processor stderr:', data.toString());
    });

    processPython.on('close', async (code) => {
      console.log('11. spectrum_processor завершился с кодом:', code);
      console.log('11.1 stdout суммарно:', processOutput);
      console.log('11.2 stderr суммарно:', processError);
      
      // Удаляем оригинальный загруженный файл
      try {
        fs.unlinkSync(uploadedFilePath);
        console.log('12. Оригинальный файл удален');
      } catch (err) {
        console.error('12. Ошибка при удалении файла:', err);
      }

      if (code !== 0) {
        console.error('13. ОШИБКА spectrum_processor с кодом:', code);
        fs.rmSync(processSessionDir, { recursive: true, force: true });
        console.log('13.1 Временная директория удалена из-за ошибки');
        
        return res.status(500).json({ 
          error: 'Ошибка при обработке файла',
          details: processError || 'Неизвестная ошибка'
        });
      }

      // 5. Проверяем, создался ли обработанный файл
      console.log('14. Проверка существования обработанного файла:', processedFile);
      console.log('14.1 Файл существует:', fs.existsSync(processedFile));
      
      if (!fs.existsSync(processedFile)) {
        console.log('15. ОШИБКА: обработанный файл не создан');
        console.log('15.1 Содержимое директории:', fs.readdirSync(processSessionDir));
        fs.rmSync(processSessionDir, { recursive: true, force: true });
        return res.status(500).json({ error: 'Обработанный файл не создан' });
      }

      console.log('15. Обработанный файл создан, размер:', fs.statSync(processedFile).size);

      // 6. Извлекаем признаки из обработанного файла
      console.log('16. Запуск извлечения признаков...');
      const featuresFile = path.join(processSessionDir, 'features.csv');
      const featuresScript = path.join(__dirname, 'scripts', 'feature_extractor.py');
      
      console.log('16.1 Путь к feature_extractor.py:', featuresScript);
      console.log('16.2 Файл существует:', fs.existsSync(featuresScript));

      const featuresPython = spawn('python3', [
        featuresScript,
        '--input-file', processedFile,
        '--brain-region', brainRegion,
        '--target-range', centering,
        '--output-file', featuresFile
      ]);

      let featuresError = '';
      let featuresOutput = '';

      featuresPython.stdout.on('data', (data) => {
        featuresOutput += data.toString();
        console.log('feature_extractor stdout:', data.toString());
      });

      featuresPython.stderr.on('data', (data) => {
        featuresError += data.toString();
        console.error('feature_extractor stderr:', data.toString());
      });

      featuresPython.on('close', async (featuresCode) => {
        console.log('17. feature_extractor завершился с кодом:', featuresCode);
        console.log('17.1 stdout суммарно:', featuresOutput);
        console.log('17.2 stderr суммарно:', featuresError);

        if (featuresCode !== 0) {
          console.error('18. ОШИБКА feature_extractor');
          fs.rmSync(processSessionDir, { recursive: true, force: true });
          return res.status(500).json({ 
            error: 'Ошибка при извлечении признаков',
            details: featuresError || 'Неизвестная ошибка'
          });
        }

        // 7. Проверяем, создался ли файл с признаками
        console.log('19. Проверка существования файла с признаками:', featuresFile);
        console.log('19.1 Файл существует:', fs.existsSync(featuresFile));
        
        if (!fs.existsSync(featuresFile)) {
          console.log('20. ОШИБКА: файл с признаками не создан');
          fs.rmSync(processSessionDir, { recursive: true, force: true });
          return res.status(500).json({ error: 'Файл с признаками не создан' });
        }

        console.log('20. Файл с признаками создан, размер:', fs.statSync(featuresFile).size);

        // 8. Теперь классифицируем по признакам
        try {
          // Выбираем модель в зависимости от centering
          const modelFileName = centering === 'center1500' ? 'model1500.joblib' : 'model2900.joblib';
          const modelPath = path.join(modelsDir, modelFileName);
          console.log('21. Путь к модели:', modelPath);
          console.log('21.1 Модель существует:', fs.existsSync(modelPath));
          console.log('21.2 Выбранная модель:', modelFileName);
          
          if (!fs.existsSync(modelPath)) {
            throw new Error(`Модель не найдена по пути: ${modelPath}`);
          }
          
          // Выходной файл для результата классификации
          const classificationResultFile = path.join(processSessionDir, 'classification.json');
          console.log('22. Файл результата классификации:', classificationResultFile);
          
          // Путь к скрипту классификации
          const classifyScript = path.join(__dirname, 'scripts', 'tissue_classifier.py');
          console.log('23. Путь к tissue_classifier.py:', classifyScript);
          console.log('23.1 Файл существует:', fs.existsSync(classifyScript));
          
          const classifyPython = spawn('python3', [
            classifyScript,
            '--input-file', featuresFile,
            '--model-path', modelPath,
            '--output-file', classificationResultFile
          ]);

          console.log('24. Запущен tissue_classifier.py с PID:', classifyPython.pid);

          let classifyError = '';
          let classifyOutput = '';

          classifyPython.stdout.on('data', (data) => {
            classifyOutput += data.toString();
            console.log('tissue_classifier stdout:', data.toString());
          });

          classifyPython.stderr.on('data', (data) => {
            classifyError += data.toString();
            console.error('tissue_classifier stderr:', data.toString());
          });

          classifyPython.on('close', async (code2) => {
            console.log('25. tissue_classifier завершился с кодом:', code2);
            console.log('25.1 stdout суммарно:', classifyOutput);
            console.log('25.2 stderr суммарно:', classifyError);
            
            if (code2 !== 0) {
              console.error('26. ОШИБКА tissue_classifier');
              fs.rmSync(processSessionDir, { recursive: true, force: true });
              return res.status(500).json({ 
                error: 'Ошибка при классификации',
                details: classifyError || 'Неизвестная ошибка'
              });
            }

            try {
              // Читаем результат классификации
              console.log('27. Проверка существования файла результата:', classificationResultFile);
              console.log('27.1 Файл существует:', fs.existsSync(classificationResultFile));
              
              if (!fs.existsSync(classificationResultFile)) {
                throw new Error('Файл с результатом классификации не создан');
              }
              
              // Читаем файл и проверяем его содержимое
              const fileContent = fs.readFileSync(classificationResultFile, 'utf-8');
              console.log('28. Содержимое classificationResultFile (первые 200 символов):', fileContent.substring(0, 200));

              if (!fileContent || fileContent.trim() === '') {
                throw new Error('Файл с результатом классификации пуст');
              }

              let result;
              try {
                result = JSON.parse(fileContent);
                console.log('29. Распарсенный result:', JSON.stringify(result, null, 2));
              } catch (parseError) {
                console.error('29. ОШИБКА парсинга JSON:', parseError);
                console.error('29.1 Полное содержимое файла:', fileContent);
                throw new Error(`Не удалось распарсить JSON: ${parseError.message}`);
              }
              
              // Проверяем, что result содержит нужные поля
              console.log('30. Проверка полей result:', Object.keys(result));

              const requiredFields = ['most_likely_class', 'confidence_percentage', 'class_distribution', 'total_points'];
              const missingFields = requiredFields.filter(field => !(field in result));

              if (missingFields.length > 0) {
                console.error('31. ОШИБКА: отсутствуют поля:', missingFields);
                
                // Очистка перед отправкой ошибки
                fs.rmSync(processSessionDir, { recursive: true, force: true });
                console.log('32. Временная директория удалена из-за ошибки');
                
                return res.status(500).json({ 
                  error: 'Python скрипт вернул неполные данные',
                  missing: missingFields 
                });
              }

              // Формируем ответ
              const responseData = {
                success: true,
                message: 'Классификация завершена',
                data: {
                  most_likely_class: result.most_likely_class,
                  confidence_percentage: result.confidence_percentage,
                  class_distribution: result.class_distribution,
                  total_points: result.total_points
                }
              };

              console.log('33. Отправка ответа:', JSON.stringify(responseData, null, 2));

              // Удаляем временную директорию
              fs.rmSync(processSessionDir, { recursive: true, force: true });
              console.log('34. Временная директория удалена');

              // Проверяем, не отправлен ли уже ответ
              if (!res.headersSent) {
                console.log('35. Отправка ответа клиенту');
                res.json(responseData);
                console.log('36. Ответ отправлен');
                
                // Очищаем processed_results ПОСЛЕ отправки ответа
                console.log('37. Очистка processed_results...');
                cleanupProcessedResults();
              }
              
            } catch (err) {
              console.error('38. ОШИБКА при обработке результата:', err);
              
              // Очистка перед отправкой ошибки
              try {
                if (fs.existsSync(processSessionDir)) {
                  fs.rmSync(processSessionDir, { recursive: true, force: true });
                  console.log('39. Временная директория удалена из-за ошибки');
                }
              } catch (cleanupErr) {
                console.error('40. Ошибка при очистке:', cleanupErr);
              }
              
              if (!res.headersSent) {
                res.status(500).json({ error: 'Ошибка при чтении результата: ' + err.message });
              }
            }
          });

        } catch (err) {
          console.error('41. ОШИБКА в блоке классификации:', err);
          
          // Очистка перед отправкой ошибки
          try {
            if (fs.existsSync(processSessionDir)) {
              fs.rmSync(processSessionDir, { recursive: true, force: true });
              console.log('42. Временная директория удалена из-за ошибки');
            }
          } catch (cleanupErr) {
            console.error('43. Ошибка при очистке:', cleanupErr);
          }
          
          if (!res.headersSent) {
            res.status(500).json({ error: err.message });
          }
        }
      });
    });

  } catch (error) {
    console.error('44. ОБЩАЯ ОШИБКА:', error);
    
    // Очистка перед отправкой ошибки
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {
      console.error('45. Ошибка при очистке:', cleanupErr);
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
  console.error('Multer error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер 100MB' });
    }
  }
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`=== Server started on port ${PORT} ===`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Результаты будут сохраняться в: ${resultsDir}`);
  console.log(`Модели должны быть в: ${modelsDir}`);
});