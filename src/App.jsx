import { useState, useEffect } from 'react'
import { HashRouter as BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './screens/Home'
import AddRoom from './screens/AddRoom'
import CreateRoom from './screens/CreateRoom'
import SelectRoomType from './screens/SelectRoomType'
import AdjustRoom from './screens/AdjustRoom'
import DesignBedroom from './screens/DesignBedroom'
import OnboardingDone from './screens/OnboardingDone'
import TemplateRoom from './screens/TemplateRoom'

function useViewportScale() {
  const calc = () => {
    if (window.innerWidth > 430) return 1
    return Math.max(window.innerWidth / 375, window.innerHeight / 812)
  }
  const [scale, setScale] = useState(calc)
  useEffect(() => {
    const update = () => setScale(calc())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

const ROUTE_BG = {
  '/add-room': '#ffffff',
}

function AppShell({ scale }) {
  const location = useLocation()
  const bg = scale !== 1 ? (ROUTE_BG[location.pathname] ?? '#111111') : '#111111'

  // phone-inner bottom 오프셋: 스케일된 콘텐츠가 뷰포트 초과하는 만큼 보정
  useEffect(() => {
    if (scale === 1) {
      document.documentElement.style.removeProperty('--phone-inner-bottom')
      return
    }
    const overflow = Math.max(0, 812 - window.innerHeight / scale)
    document.documentElement.style.setProperty('--phone-inner-bottom', `${overflow}px`)
  }, [scale])

  // 라우트별 배경색 + meta 태그 동기화
  useEffect(() => {
    if (scale === 1) return
    const color = ROUTE_BG[location.pathname] ?? '#222222'
    document.body.style.background = color
    document.documentElement.style.background = color
    const themeTag = document.querySelector('meta[name="theme-color"]')
    const statusTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (themeTag) themeTag.setAttribute('content', color)
    if (statusTag) statusTag.setAttribute('content', color === '#ffffff' ? 'default' : 'black-translucent')
  }, [location.pathname, scale])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      display: 'flex',
      alignItems: scale !== 1 ? 'flex-start' : 'center',
      justifyContent: 'center',
      overflow: 'hidden', background: bg,
    }}>
      {scale !== 1 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 'env(safe-area-inset-top)',
          background: bg,
          zIndex: 9999,
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ transform: `scale(${scale})`, transformOrigin: scale !== 1 ? 'top center' : 'center center' }}>
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
      </div>
    </div>
  )
}

export default function App() {
  const scale = useViewportScale()
  return (
    <BrowserRouter>
      <AppShell scale={scale} />
    </BrowserRouter>
  )
}
