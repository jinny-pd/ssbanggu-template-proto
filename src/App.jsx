import { useState, useEffect } from 'react'
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './screens/Home'
import AddRoom from './screens/AddRoom'
import CreateRoom from './screens/CreateRoom'
import SelectRoomType from './screens/SelectRoomType'
import AdjustRoom from './screens/AdjustRoom'
import DesignBedroom from './screens/DesignBedroom'
import OnboardingDone from './screens/OnboardingDone'
import TemplateRoom from './screens/TemplateRoom'

function useViewportScale() {
  const calc = () => window.innerWidth <= 430 ? window.screen.height / 812 : 1
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const update = () => setScale(calc())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

export default function App() {
  const scale = useViewportScale()
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: '#111',
    }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add-room" element={<AddRoom />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/select-room-type" element={<SelectRoomType />} />
            <Route path="/adjust-room" element={<AdjustRoom />} />
            <Route path="/design-bedroom" element={<DesignBedroom />} />
            <Route path="/onboarding-done" element={<OnboardingDone />} />
            <Route path="/template-room" element={<TemplateRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  )
}
