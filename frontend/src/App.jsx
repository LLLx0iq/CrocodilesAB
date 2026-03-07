import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Model from './pages/Model'
import Contact from './pages/Contact'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/model" element={<Model />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Layout>
  )
}

export default App