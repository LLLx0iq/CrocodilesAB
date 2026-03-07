#!/usr/bin/env python3
import argparse
import pandas as pd
import numpy as np
import joblib
import json
import sys
from pathlib import Path

# Маппинг классов
CLASS_NAMES = {
    0: "control",
    1: "endo", 
    2: "exo"
}

def load_model(model_path):
    """Загрузка модели из .joblib файла"""
    try:
        data = joblib.load(model_path)
        print(f"Загружен объект типа: {type(data)}")
        
        # Если это словарь, извлекаем модель по ключу 'model'
        if isinstance(data, dict):
            print(f"Ключи словаря: {list(data.keys())}")
            model = data.get('model')
            if model is None:
                print(f"ОШИБКА: В словаре нет ключа 'model'", file=sys.stderr)
                sys.exit(1)
            print(f"Модель извлечена из словаря, тип: {type(model)}")
            return model, data
        else:
            # Если это уже модель
            return data, {}
    except Exception as e:
        print(f"Ошибка при загрузке модели: {e}", file=sys.stderr)
        sys.exit(1)

def classify_tissue(data_file, model, model_data=None):
    """
    Классификация всей ткани на основе всех точек
    """
    # Читаем данные
    df = pd.read_csv(data_file)
    print(f"Загружено {len(df)} точек для классификации")
    
    if len(df) == 0:
        print("Нет данных для классификации", file=sys.stderr)
        sys.exit(1)
    
    # Получаем список признаков, которые ожидает модель
    if model_data and 'feature_columns' in model_data:
        feature_columns = model_data['feature_columns']
        print(f"Модель ожидает признаки: {feature_columns}")
        
        # Проверяем, есть ли все нужные колонки
        missing_cols = [col for col in feature_columns if col not in df.columns]
        if missing_cols:
            print(f"ВНИМАНИЕ: Отсутствуют колонки: {missing_cols}", file=sys.stderr)
            # Используем только те, что есть
            available_cols = [col for col in feature_columns if col in df.columns]
            X = df[available_cols]
        else:
            X = df[feature_columns]
    else:
        # Если нет информации о признаках, используем все кроме brain_region
        feature_columns = [col for col in df.columns if col != 'brain_region']
        X = df[feature_columns]
        print(f"Используем признаки: {feature_columns}")
    
    # Получаем предсказания для всех точек
    predictions = model.predict(X)
    
    # Если есть predict_proba, получаем вероятности
    if hasattr(model, 'predict_proba'):
        probabilities = model.predict_proba(X)
    else:
        probabilities = None
    
    # Анализируем распределение классов
    unique_classes, counts = np.unique(predictions, return_counts=True)
    
    # Создаем распределение с названиями классов
    class_distribution = {}
    for cls, count in zip(unique_classes, counts):
        cls_int = int(cls)
        cls_name = CLASS_NAMES.get(cls_int, f"class_{cls_int}")
        class_distribution[cls_name] = int(count)
    
    # Находим наиболее вероятный класс для всей ткани
    most_common_class_idx = unique_classes[np.argmax(counts)]
    most_common_class = int(most_common_class_idx)
    most_common_class_name = CLASS_NAMES.get(most_common_class, f"class_{most_common_class}")
    most_common_count = np.max(counts)
    most_common_percentage = (most_common_count / len(predictions)) * 100
    
    # Формируем результат
    result = {
        'most_likely_class': most_common_class_name,  # теперь строка
        'most_likely_class_code': most_common_class,  # оставляем код для отладки
        'confidence_percentage': round(most_common_percentage, 2),
        'class_distribution': class_distribution,  # теперь с названиями
        'total_points': len(predictions)
    }
    
    # Если есть вероятности, добавляем средние
    if probabilities is not None:
        mean_probabilities = np.mean(probabilities, axis=0)
        result['mean_probabilities'] = mean_probabilities.tolist()
        result['classes'] = [CLASS_NAMES.get(int(c), f"class_{int(c)}") for c in unique_classes]
    
    return result

def main():
    parser = argparse.ArgumentParser(description='Классификация ткани по спектральным данным')
    parser.add_argument('--input-file', required=True, help='Обработанный CSV файл')
    parser.add_argument('--model-path', required=True, help='Путь к .joblib модели')
    parser.add_argument('--output-file', required=True, help='Путь для сохранения результата')
    
    args = parser.parse_args()
    
    try:
        # 1. Загружаем модель (из словаря если нужно)
        model, model_data = load_model(args.model_path)
        
        # 2. Классифицируем ткань
        result = classify_tissue(args.input_file, model, model_data)
        
        # 3. Сохраняем результат
        with open(args.output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Результат классификации сохранен в: {args.output_file}")
        print(f"Наиболее вероятный класс: {result['most_likely_class']} "
              f"(уверенность: {result['confidence_percentage']}%)")
        
    except Exception as e:
        print(f"Ошибка при классификации: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()