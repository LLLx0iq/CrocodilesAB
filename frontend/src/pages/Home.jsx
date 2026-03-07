import { useSelector } from "react-redux"
import { User, Mail, Activity, Heart, AlertTriangle, Shield, Cpu, BarChart3, Microscope, Atom, Waves, Brain } from "lucide-react"

export default function Home() {
  const user = useSelector((state) => state.app.user)
  const loading = useSelector((state) => state.app.loading)

  // Если данные еще загружаются
  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Если пользователь авторизован — блок с аккаунтом */}
      {user && (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <User className="text-white" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Добро пожаловать, {user.name}!
            </h2>
            <p className="text-gray-600">Ваш профиль в системе анализа спектроскопии комбинационного рассеяния</p>
          </div>

          <div className="grid md:grid-cols-1 gap-4 max-w-md mx-auto">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <User size={18} className="text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-800 font-medium">ФИО</p>
                <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Mail size={18} className="text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Email</p>
                <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Информация о системе */}
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Waves className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Система классификации спектров комбинационного рассеяния ткани мозга
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
            Платформа для анализа спектральных данных и классификации экспериментальных групп мышей 
            на основе экспрессии белка теплового шока HSP70. Система использует два ключевых спектральных 
            диапазона, выбранных на основе биофизического обоснования.
          </p>
        </div>

        {/* Основные направления анализа */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-100">
            <div className="mx-auto w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <Activity className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Контрольная группа</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Мыши дикого типа с базальным уровнем экспрессии HSP70. 
              Формируют базовую линию для сравнения спектральных паттернов.
            </p>
          </div>
<div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="mx-auto w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Brain className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Эндогенная экспрессия HSP70</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Трансгенные мыши с продукцией человеческого HSP70 внутри клеток. 
              Ожидаются изменения в белковых структурах и упорядоченности мембран.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="mx-auto w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-white" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Экзогенная экспрессия HSP70</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Трансгенные мыши с секрецией HSP70 во внеклеточное пространство. 
              Ожидаются маркеры воспаления, изменения гидратации и разупорядочивание мембран.
            </p>
          </div>
        </div>
{/* БЛОК С ОБОСНОВАНИЕМ ВЫБРАННЫХ ДИАПАЗОНОВ */}
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center mb-4">
              <Atom className="text-indigo-600 mr-3" size={28} />
              <h3 className="text-2xl font-bold text-gray-900">Биофизическое обоснование выбора спектральных диапазонов</h3>
            </div>
            <p className="text-gray-700 mb-4 leading-relaxed text-lg font-medium">
              Для анализа отобраны два ключевых диапазона: <span className="bg-indigo-100 px-2 py-1 rounded">1240-1700 см⁻¹</span> и <span className="bg-indigo-100 px-2 py-1 rounded">2830-3070 см⁻¹</span>
            </p>
            
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* Диапазон 1240-1700 см⁻¹ */}
              <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl">1240–1700 см⁻¹</h4>
                </div>
                <p className="text-gray-600 mb-3 font-medium">Область "отпечатков пальцев" (fingerprint region)</p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-indigo-800 mb-2">Ключевые компоненты:</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>1650-1680 см⁻¹ (Амид I):</strong> Прямой маркер вторичной структуры белков и работы HSP70 как шаперона</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>1550-1560 см⁻¹ (Триптофан):</strong> Чувствительный индикатор микроокружения и воспалительных процессов</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>1260-1300 см⁻¹ (Амид III, α-спирали):</strong> Подтверждение конформационных изменений белков</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>1315-1340 см⁻¹ (Пурины):</strong> Маркер транскрипционной активности и клеточного ответа</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">
                      <span className="font-bold">Дискриминация:</span> Контроль ↔ Эндогенный (структура белков)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Диапазон 2830-3070 см⁻¹ */}
              <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xl">2830–3070 см⁻¹</h4>
                </div>
                <p className="text-gray-600 mb-3 font-medium">Высоковолновая область (C-H stretching)</p>
<div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-purple-800 mb-2">Ключевые компоненты:</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>2885/2850 см⁻¹ (CH₂ сим./асим.):</strong> Отношение, характеризующее упорядоченность липидных мембран — ГЛАВНЫЙ дискриминатор Эндо vs Экзо</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>2930/2850 см⁻¹ (CH₃/CH₂):</strong> Соотношение белки/липиды, показывает накопление белка</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>3015 см⁻¹ (=C-H):</strong> Степень ненасыщенности липидов — маркер окислительного стресса</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                        <span><strong>3060 см⁻¹ (ароматические C-H):</strong> Появление при воспалении и распаде тканей</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">
                      <span className="font-bold">Дискриминация:</span> Эндогенный ↔ Экзогенный (состояние мембран)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Общая таблица различий */}
            <div className="mt-8 overflow-x-auto">
              <h4 className="font-bold text-gray-900 text-lg mb-4">Ожидаемые спектральные различия между группами</h4>
              <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Признак</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Контроль</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Эндогенный HSP70</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Экзогенный HSP70</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">1655 см⁻¹ (Амид I α-спирали)</td>
                    <td className="px-4 py-3 text-sm">Базовый уровень</td>
                    <td className="px-4 py-3 text-sm bg-green-50 font-semibold">↑↑ (острый пик)</td>
                    <td className="px-4 py-3 text-sm">Базовый / плечо 1670</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">2885/2850 (порядок мембран)</td>
                    <td className="px-4 py-3 text-sm">База ~1.2-1.3</td>
                    <td className="px-4 py-3 text-sm bg-green-50 font-semibold">↑ (более упорядочены)</td>
                    <td className="px-4 py-3 text-sm bg-orange-50 font-semibold">↓↓ (разупорядочены)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">2930/2850 (белки/липиды)</td>
                    <td className="px-4 py-3 text-sm">База</td>
                    <td className="px-4 py-3 text-sm bg-green-50 font-semibold">↑↑</td>
<td className="px-4 py-3 text-sm">↑ (активация глии)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">1315-1340 (пурины)</td>
                    <td className="px-4 py-3 text-sm">База</td>
                    <td className="px-4 py-3 text-sm">↑ (экспрессия гена)</td>
                    <td className="px-4 py-3 text-sm bg-orange-50 font-semibold">↑↑ (воспаление)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">3015 (ненасыщенность)</td>
                    <td className="px-4 py-3 text-sm">База</td>
                    <td className="px-4 py-3 text-sm bg-green-50 font-semibold">↑ (защита)</td>
                    <td className="px-4 py-3 text-sm bg-orange-50 font-semibold">↓ (окислительный стресс)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-800 font-medium flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Выбранные диапазоны покрывают все ключевые маркеры: 
                белковые структуры (Амид I, Амид III), состояние мембран (CH₂, CH₃), 
                транскрипционную активность (пурины) и окислительный статус (ненасыщенность). 
                Этого достаточно для надежной классификации трех экспериментальных групп.
              </p>
            </div>
          </div>

          {/* Технические детали */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-300">
              <div className="flex items-center mb-4">
                <Cpu className="text-green-600 mr-3" size={24} />
                <h4 className="font-bold text-gray-900 text-lg">Предобработка спектральных данных</h4>
              </div>

              <div className="space-y-5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Сырые спектры комбинационного рассеяния содержат не только полезную химическую информацию,
                  но и шумы, артефакты измерения, флуоресцентный фон и технические вариации. Для получения
                  надежных и воспроизводимых результатов машинного обучения мы проводим последовательную
                  предварительную обработку данных.
                </p>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">1. Валидация и приведение данных</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    На первом этапе проверяется монотонность оси X, соответствующей рамановскому сдвигу
                    (см⁻¹). Мы приводим все спектры к единой равномерной шкале, что является обязательным
                    условием для корректного сравнения образцов между собой и стабильной работы алгоритмов
                    анализа.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">2. Сегментация и выделение информативных диапазонов</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Чтобы снизить вычислительную нагрузку и уменьшить влияние шумовых участков, в модель
                    подаются не полные спектры, а наиболее информативные диапазоны. В этих областях
                    располагаются ключевые пики биомолекул, включая липиды, белки и фенилаланин, что позволяет
                    уменьшить размерность данных, исключить малоинформативные участки и сфокусировать анализ
                    на физиологически значимых признаках.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">3. Сглаживание (фильтр Савицкого—Голея)</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Для подавления высокочастотного шума, неизбежного при регистрации сигнала, применяется
                    фильтр Савицкого—Голея. В отличие от простого усреднения, этот подход аппроксимирует
                    спектр полиномом в скользящем окне, благодаря чему шум эффективно уменьшается без
                    существенного искажения формы, ширины и интенсивности значимых пиков.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">4. Коррекция базовой линии</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Флуоресценция биологических тканей может существенно искажать истинный сигнал,
                    формируя плавный нарастающий фон. Для его удаления используются гибкие алгоритмы,
                    например метод асимметричных наименьших квадратов (asLS), которые позволяют отделить
                    узкие рамановские пики от широкополосной фоновой составляющей.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">5. Нормировка (нормализация)</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Для устранения технических вариаций, связанных с мощностью лазера, временем накопления
                    и условиями регистрации, выполняется нормировка спектров. В зависимости от задачи
                    применяется нормализация на площадь под кривой в выбранном диапазоне либо на интенсивность
                    реперного пика, например фенилаланина при 1003 см⁻¹, что делает данные сопоставимыми
                    для дальнейшего анализа.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">6. Подготовка данных для обучения</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    На завершающем этапе предобработанные спектры структурируются в формат, пригодный для
                    подачи в модели машинного обучения. Это обеспечивает корректное извлечение признаков,
                    устойчивое обучение алгоритмов и повышение достоверности итоговой классификации.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-300">
              <div className="flex items-center mb-4">
                <BarChart3 className="text-purple-600 mr-3" size={24} />
                <h4 className="font-bold text-gray-900 text-lg">Выбранные алгоритмы машинного обучения</h4>
              </div>

              <div className="space-y-5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  При разработке классификационных моделей мы учитывали как природу спектральных данных,
                  так и анатомическую специфику исследуемых образцов. Наш подход сочетает интерпретируемые
                  классические методы и современные алгоритмы для достижения высокой точности классификации
                  и биологической интерпретируемости результатов.
                </p>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Стратификация по анатомическим областям
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Поскольку спектральные профили коры и стриатума значимо различаются вследствие
                    различного липидного состава и особенностей тканевой организации, использование
                    единой модели могло бы привести к систематической ошибке. Поэтому для каждой
                    анатомической области обучается отдельная модель, что повышает чувствительность
                    и точность классификации внутри соответствующего типа ткани.
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-3">
                    Итоговое решение формируется на основе двух независимо обученных моделей, каждая
                    из которых является специализированным классификатором для своей анатомической зоны.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Ансамбль случайного леса для ключевых спектральных диапазонов
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    В качестве основного классификатора выбран случайный лес (Random Forest) — алгоритм,
                    обладающий устойчивостью к переобучению, способностью работать с многомерными данными
                    и возможностью оценки важности признаков. Такой подход особенно удобен для анализа
                    спектров, где информативность распределена между множеством взаимосвязанных признаков.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    1. Модель для диапазона 1500 см⁻¹ («Биохимический отпечаток»)
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Этот диапазон охватывает область «отпечатков пальцев» и амидных полос, связанных
                    с конформацией белков, состоянием нуклеиновых кислот и общими биохимическими
                    перестройками в ткани. Модель, обученная на данном сегменте, чувствительна к
                    молекулярным изменениям, отражающим клеточный ответ и структурную организацию
                    биологических компонентов.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">
                    2. Модель для диапазона 2900 см⁻¹ («Липидный профиль»)
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Высокочастотная область C-H валентных колебаний содержит информацию о насыщенности,
                    упаковке и организации липидного бислоя. Отдельная модель для этого диапазона
                    позволяет точно фиксировать изменения в липидном составе и мембранной архитектуре,
                    которые являются критически важными признаками при дифференциальной диагностике тканей.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Объединение предсказаний
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Интеграция результатов двух специализированных моделей создает синергетический эффект:
                    итоговая система одновременно учитывает изменения в белковых структурах и липидном
                    микроокружении клеток. Это позволяет формировать более устойчивое и информативное
                    финальное предсказание по сравнению с использованием только одного спектрального сегмента.
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Визуализация и снижение размерности
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Для разведочного анализа и визуальной валидации разделения классов на этапе
                    разработки применяется PCA (метод главных компонент). Этот подход позволяет
                    оценить наличие кластеризации данных, проверить разделимость групп и получить
                    дополнительное подтверждение корректности выбранных спектральных признаков
                    до передачи данных в обучаемые модели.
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                  <p className="text-sm text-purple-900 leading-relaxed font-medium">
                    Таким образом, используемый пайплайн объединяет лучшие практики спектроскопии
                    и машинного обучения, обеспечивая высокую точность классификации, устойчивость
                    моделей и биологическую интерпретируемость полученных результатов.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
            <h4 className="font-bold text-gray-900 text-xl mb-4">Ожидаемые результаты классификации</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              На основе выбранных диапазонов модель сможет различать:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-200">
                <div className="font-bold text-lg mb-2">Контроль</div>
                <p className="text-sm">Баланс α/β структур, нормальная упорядоченность мембран, фоновая транскрипция</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="font-bold text-lg mb-2">Эндогенный</div>
                <p className="text-sm">↑ α-спиралей (1655), ↑ упорядоченность мембран (2885/2850), ↑ белки/липиды (2930/2850)</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-bold text-lg mb-2">Экзогенный</div>
                <p className="text-sm">Плечо 1670, ↓ упорядоченность мембран, ↑ пурины, возможны изменения водной полосы</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
