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

// 밝은 배경 라우트 (기본 theme-color #fff와 일치)
const LIGHT_ROUTES = new Set(['/add-room'])

function AppShell({ scale }) {
  const location = useLocation()
  const isLight = LIGHT_ROUTES.has(location.pathname)
  const bg = scale !== 1 ? (isLight ? '#ffffff' : '#111111') : '#111111'

  // phone-inner top/bottom 오프셋 계산
  useEffect(() => {
    if (scale === 1) {
      document.documentElement.style.removeProperty('--phone-inner-top')
      document.documentElement.style.removeProperty('--phone-inner-bottom')
      return
    }
    // env(safe-area-inset-top)를 JS로 직접 측정
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);pointer-events:none;opacity:0'
    document.body.appendChild(el)
    const sat = el.getBoundingClientRect().height
    document.body.removeChild(el)

    // topBar(y=50)가 상태바(sat) 바로 아래에 오도록
    const phoneInnerTop = sat - 50
    document.documentElement.style.setProperty('--phone-inner-top', `${phoneInnerTop}px`)

    const overflow = Math.max(0, 812 - window.innerHeight / scale)
    document.documentElement.style.setProperty('--phone-inner-bottom', `${overflow}px`)
  }, [scale])

  // 라우트별 theme-color + body 배경 동기화 (기본 white, 어두운 화면에서 dark로 변경)
  useEffect(() => {
    if (scale === 1) return
    const color = isLight ? '#ffffff' : '#222222'
    const statusStyle = isLight ? 'default' : 'black-translucent'
    document.body.style.background = color
    document.documentElement.style.background = color
    const themeTag = document.querySelector('meta[name="theme-color"]')
    const statusTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (themeTag) themeTag.setAttribute('content', color)
    if (statusTag) statusTag.setAttribute('content', statusStyle)
  }, [location.pathname, scale, isLight])

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
          height: 'env(safe-area-inset-top, 60px)',
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
