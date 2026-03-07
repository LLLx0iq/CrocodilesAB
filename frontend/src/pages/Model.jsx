import { useState } from 'react'

function Model() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [centering, setCentering] = useState('center1500')
  const [brainRegion, setBrainRegion] = useState('cerebellum')
  const [tissueType, setTissueType] = useState('')
  const [classificationResult, setClassificationResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const validExtensions = ['.txt', '.csv']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Пожалуйста, загрузите файл с расширением .txt или .csv')
        setSelectedFile(null)
        event.target.value = ''
        return
      }
      
      setSelectedFile(file)
      setError('')
      console.log('Файл выбран:', file.name)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (!selectedFile) {
      setError('Выберите файл для загрузки')
      return
    }

    setIsProcessing(true)
    setError('')
    setSuccess('')
    setTissueType('')
    setClassificationResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('centering', centering)
    formData.append('brainRegion', brainRegion)

    try {
      const response = await fetch('/api/classify-tissue', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при обработке')
      }

      setSuccess(data.message)
      
      if (data.data) {
        setClassificationResult(data.data)
        
        // Формируем строку результата
        const resultStr = `Ткань: ${data.data.most_likely_class} (уверенность: ${data.data.confidence_percentage}%, точек: ${data.data.total_points})`;
        setTissueType(resultStr)
      }
      
    } catch (err) {
      setError(err.message)
      console.error('Ошибка:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Функция для форматирования распределения классов
  const formatDistribution = (dist) => {
    if (!dist) return '';
    return Object.entries(dist)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Анализ и классификация ткани
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Загрузите файл с данными (.txt или .csv)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".txt,.csv"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                ✓ Выбран файл: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Диапазон волновых чисел
            </label>
            <select
              value={centering}
              onChange={(e) => setCentering(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="center1500">center1500</option>
              <option value="center2900">center2900</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Область мозга
            </label>
            <select
              value={brainRegion}
              onChange={(e) => setBrainRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="cerebellum">cerebellum</option>
              <option value="cortex">cortex</option>
              <option value="striatum">striatum</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedFile || isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isProcessing ? 'Обработка и классификация...' : 'Анализировать ткань'}
          </button>
        </form>

        {/* Результат обработки */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Результат классификации ткани
          </label>
          <div className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-md text-gray-700 min-h-[46px]">
            {tissueType || '— ожидание загрузки —'}
          </div>
        </div>

        {/* Детальный результат без фигурных скобок */}
        {classificationResult && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="font-bold text-lg mb-2">Детали классификации:</h3>
            <p>Класс ткани: {classificationResult.most_likely_class}</p>
            <p>Уверенность: {classificationResult.confidence_percentage}%</p>
            <p>Всего проанализировано точек: {classificationResult.total_points}</p>
            <div className="mt-2">
              <p className="font-semibold">Распределение по классам:</p>
              <p className="text-sm bg-white p-2 rounded">
                {formatDistribution(classificationResult.class_distribution)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Model