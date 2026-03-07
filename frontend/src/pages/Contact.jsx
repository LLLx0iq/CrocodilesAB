import { useState } from 'react'
import { ChevronDown, ChevronUp, Trophy, Users, GraduationCap, ExternalLink } from 'lucide-react'

export default function About() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">О проекте</h1>
        <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* Основная информация */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Хакатон «Nuclear it hack»
            </h2>
            <p className="text-gray-700 font-medium">
              Задача «Что скрывают Рамановские спектры» • Команда «Высокодиагностики»
            </p>
          </div>
        </div>
      </div>

      {/* Команда */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="text-green-600" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900">Наша команда</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TeamMember
            initial="В"
            color="bg-blue-500"
            name="Сирачёв Вильдан Ильдарович"
            telegram="@weeeeeelldone"
            telegramUrl="https://t.me/weeeeeelldone"
          />
          <TeamMember
            initial="Д"
            color="bg-green-500"
            name="Лактина Дарья Сергеевна"
            telegram="@sagiriigg"
            telegramUrl="https://t.me/sagiriigg"
          />
          <TeamMember
            initial="В"
            color="bg-purple-500"
            name="Сухинин Виталий Максимович"
            telegram="@LLL_botik"
            telegramUrl="https://t.me/LLL_botik"
          />
          <TeamMember
            initial="П"
            color="bg-red-500"
            name="Брязгунова Полина Владимировна"
            telegram="@polinochkamalinochkkka"
            telegramUrl="https://t.me/polinochkamalinochkkka"
          />
        </div>
      </div>

      {/* Дополнительная информация с аккордеоном */}
      <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <GraduationCap className="text-orange-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Об образовании</h3>
          </div>
          {expanded ? (
            <ChevronUp className="text-gray-500" size={20} />
          ) : (
            <ChevronDown className="text-gray-500" size={20} />
          )}
        </button>

        {expanded && (
          <div className="mt-4 pl-11">
            <p className="text-gray-700 leading-relaxed">
              Разработчики — студенты кафедры №46 «Компьютерные медицинские системы» 
              Национального исследовательского ядерного университета «МИФИ».
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamMember({ initial, color, name, telegram, telegramUrl }) {
  // Разбиваем ФИО на части
  const nameParts = name.split(' ')
  
  // Убираем @ из начала, если он есть, для отображения
  const displayTelegram = telegram.startsWith('@') ? telegram : `@${telegram}`
  
  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 text-center hover:shadow-md transition-shadow flex flex-col h-full">
      <div className={`w-16 h-16 ${color} rounded-full mx-auto mb-3 flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-xl">{initial}</span>
      </div>
      
      {/* Контейнер для ФИО с фиксированной минимальной высотой */}
      <div className="min-h-[100px] flex items-center justify-center mb-3">
        <div className="text-lg font-semibold text-gray-800 leading-tight">
          {nameParts.map((part, index) => (
            <div key={index}>{part}</div>
          ))}
        </div>
      </div>
      
      {/* Кнопка с Telegram, адаптированная для длинных имен */}
      <div className="mt-auto">
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors w-full max-w-[180px] mx-auto"
          title={displayTelegram}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
            alt="Telegram"
            className="w-4 h-4 mr-2 flex-shrink-0"
          />
          <span className="text-sm truncate">{displayTelegram}</span>
          <ExternalLink size={12} className="ml-1 text-gray-500 flex-shrink-0" />
        </a>
      </div>
    </div>
  )
}