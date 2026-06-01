import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PhoneShell from '../components/PhoneShell'

import imgTemplateRoom  from '../assets/images/template-room-preview.png'
import img941           from '../assets/images/status-941.svg'
import imgLevels        from '../assets/images/status-levels.svg'
import imgAutoArrange1  from '../assets/images/자동배치_1.png'
import imgAutoArrange2  from '../assets/images/자동배치_2.png'
import imgAutoArrange3  from '../assets/images/자동배치_3.png'
import iconArrowUpMedium  from '../assets/icons/[Icon] Arrow Up_Medium.svg'
import iconArrowLeft       from '../assets/icons/[Icon] Arrow Left.svg'
import iconBackButton      from '../assets/icons/[Icon] Back Button.svg'
import iconPencil          from '../assets/icons/[Icon] Pencil.svg'
import iconTrash           from '../assets/icons/[Icon] Trash.svg'
import imgSpinnerBg        from '../assets/images/spinner-bg.svg'
import imgSpinnerQ1        from '../assets/images/spinner-q1.svg'
import imgSpinnerQ2        from '../assets/images/spinner-q2.svg'
import iconSpaceAIView     from '../assets/icons/[Space AI] Icon Button_View.svg'
import iconSpaceAICapture  from '../assets/icons/[Space AI] Icon Button_Capture.svg'
import iconSpaceAIRoomlist from '../assets/icons/[Space AI] Icon Button_Roomlist.svg'
import iconSpaceAIMenu     from '../assets/icons/[Space AI] Icon Button_Menu.svg'

// 침실 고정 영역: roomFrameInner(280×188) 기준 우상단 98×150
const FIXED_ZONE = { x: 182, y: 0, w: 98, h: 150 }

// 사전 지정 영역 목록 (Figma node 15414:16716 기준)
// 인접 영역 간 2px 간격 확보 (stroke 2px 겹침 방지)
// 공유 경계: 현관↔주방(x=71→70/72), 거실↔주방(y=86→85/87), 거실·주방↔침실(x=182→181/183), 침실↔다용도실(y=150→149/151)
const AREAS = [
  { key: 'kitchen',  x: 72,  y: 87,  w: 109, h: 101, fill: 'rgba(255,123,40,0.4)',  stroke: '#ff7b28', label: '주방',     pillX: 100, pillY: 127, pillW: 52 },
  { key: 'living',   x: 84,  y: 0,   w: 97,  h: 85,  fill: 'rgba(255,195,0,0.4)',   stroke: '#ffc300', label: '거실',     pillX: 108, pillY: 34,  pillW: 52 },
  { key: 'bathroom', x: 24,  y: 0,   w: 56,  h: 83,  fill: 'rgba(253,61,74,0.4)',   stroke: '#fd3d4a', label: '욕실',     pillX: 26,  pillY: 32,  pillW: 52 },
  { key: 'utility',  x: 228, y: 151, w: 52,  h: 37,  fill: 'rgba(200,0,255,0.4)',   stroke: '#c800ff', label: '다용도실', pillX: 216, pillY: 160, pillW: 76 },
  { key: 'foyer',    x: 0,   y: 86,  w: 70,  h: 80,  fill: 'rgba(0,121,250,0.4)',   stroke: '#0079fa', label: '현관',     pillX: 10,  pillY: 117, pillW: 52 },
  { key: 'bedroom',  x: 183, y: 0,   w: 97,  h: 149, fill: 'rgba(0,179,45,0.4)',    stroke: '#00b32d', label: '침실',     pillX: 206, pillY: 65,  pillW: 52 },
]

export default function TemplateRoom() {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeArea,      setActiveArea]      = useState(null)
  const [editingArea,     setEditingArea]     = useState(null)
  const [zoneOnlyView,    setZoneOnlyView]    = useState(null)
  const [editDragged,     setEditDragged]     = useState(false)
  const [areaDrawn,       setAreaDrawn]       = useState(false)
  const [areaEditing,     setAreaEditing]     = useState(false)
  const [areaDragPreview, setAreaDragPreview] = useState(null)
  const [areaSnapping,    setAreaSnapping]    = useState(false)
  const [areaSnackbar,    setAreaSnackbar]    = useState(false)

  // 자동배치 바텀시트
  const [autoArrangeVisible, setAutoArrangeVisible] = useState(false)
  const [defaultRoomVisible, setDefaultRoomVisible] = useState(false)
  const [rollingText,   setRollingText]   = useState('더 나은 배치를 위해 가구가 조금 더 필요해요. 필요한 가구를 추천해 드릴게요.')
  const [rollingHidden, setRollingHidden] = useState(false)
  const [rollingFinal,  setRollingFinal]  = useState(false)
  const [apReady,       setApReady]       = useState(false)
  const [apStep3,       setApStep3]       = useState(false)
  const [userBubbleIn,  setUserBubbleIn]  = useState(false)
  const [apAiAck,       setApAiAck]       = useState(false)
  const [apAiAckIn,     setApAiAckIn]     = useState(false)
  const [apAckText,     setApAckText]     = useState('이제 가장 적합한 배치를 찾아드릴게요.')
  const [apAckColor,    setApAckColor]    = useState('#8c8c8c')
  const [apAckBlink,    setApAckBlink]    = useState(false)
  const [apPlacement,        setApPlacement]        = useState(false)
  const [apPlacementIn,      setApPlacementIn]      = useState(false)
  const [apPlacementClosing, setApPlacementClosing] = useState(false)
  const [selectedPlacement,  setSelectedPlacement]  = useState(1)
  const [apSpinner2,    setApSpinner2]    = useState(false)
  const [apRoomAuto,    setApRoomAuto]    = useState(false)
  const [apRoomAutoIn,  setApRoomAutoIn]  = useState(false)
  const [apRoomDown,    setApRoomDown]    = useState(false)
  const [apSnackbar,    setApSnackbar]    = useState(false)
  const [apSnackbarIn,  setApSnackbarIn]  = useState(false)
  const [sheetHeight,   setSheetHeight]   = useState(320)
  const [sheetDragging, setSheetDragging] = useState(false)
  const [bodyOffset,    setBodyOffset]    = useState(0)

  const areaSvgRef           = useRef(null)
  const areaDragRef          = useRef({ active: false, moved: false, startX: 0, startY: 0 })
  const editingAreaRef       = useRef(null)
  const areaSnackbarTimerRef = useRef(null)
  const sheetHeightRef       = useRef(320)
  const sheetDragStartYRef   = useRef(0)
  const sheetDragStartHRef   = useRef(320)
  const apBodyRef            = useRef(null)
  const userBubbleRef        = useRef(null)
  const apAiAckRef           = useRef(null)
  const timersRef            = useRef([])

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }

  // 홈 'area' 스텝에서 진입 시 자동배치 화면 바로 표시
  useEffect(() => {
    if (location.state?.autoArrange) {
      handleAreaNext()
    }
  }, [])

  // editingAreaRef를 최신 editingArea와 동기화
  useEffect(() => { editingAreaRef.current = editingArea }, [editingArea])

  // 마우스/터치 공통 드래그 — { passive: false }로 직접 연결
  useEffect(() => {
    const svg = areaSvgRef.current
    if (!svg) return
    function svgPt(e) {
      const r = svg.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    function onDown(e) {
      if (!editingAreaRef.current) return
      e.preventDefault()
      svg.setPointerCapture(e.pointerId)
      const pt = svgPt(e)
      areaDragRef.current = { active: true, moved: false, startX: pt.x, startY: pt.y }
      setAreaDragPreview({ x: pt.x, y: pt.y, w: 0, h: 0 })
    }
    function onMove(e) {
      const d = areaDragRef.current
      if (!d.active) return
      const pt = svgPt(e)
      const dx = pt.x - d.startX, dy = pt.y - d.startY
      if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true
      if (d.moved) setAreaDragPreview({ x: Math.min(d.startX, pt.x), y: Math.min(d.startY, pt.y), w: Math.abs(dx), h: Math.abs(dy) })
    }
    function onUp() {
      const d = areaDragRef.current
      if (!d.active) return
      const key = editingAreaRef.current
      d.active = false
      setAreaDragPreview(null)
      if (key) { setActiveArea(key); setZoneOnlyView(key); setEditDragged(true) }
    }
    svg.addEventListener('pointerdown',   onDown, { passive: false })
    svg.addEventListener('pointermove',   onMove, { passive: false })
    svg.addEventListener('pointerup',     onUp)
    svg.addEventListener('pointercancel', onUp)
    return () => {
      svg.removeEventListener('pointerdown',   onDown)
      svg.removeEventListener('pointermove',   onMove)
      svg.removeEventListener('pointerup',     onUp)
      svg.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const handleAreaEdit = () => {
    setAreaDrawn(false)
    setAreaEditing(false)
  }

  const handleAreaDelete = () => {
    setAreaDrawn(false)
    setAreaEditing(false)
    setAreaDragPreview(null)
    setAreaSnackbar(true)
    if (areaSnackbarTimerRef.current) clearTimeout(areaSnackbarTimerRef.current)
    areaSnackbarTimerRef.current = setTimeout(() => {
      setAreaSnackbar(false)
      areaSnackbarTimerRef.current = null
    }, 2500)
  }

  /* ── 다음 → 자동배치 바텀시트 열기 ── */
  const handleAreaNext = () => {
    clearTimers()
    localStorage.setItem('ssOnboardingStep', 'area')
    setDefaultRoomVisible(true)
    setRollingText('더 나은 배치를 위해 가구가 조금 더 필요해요. 필요한 가구를 추천해 드릴게요.')
    setRollingHidden(false)
    setRollingFinal(true)
    setApReady(false)
    setApStep3(false)
    setUserBubbleIn(false)
    setApAiAck(false)
    setApAiAckIn(false)
    setApAckText('이제 가장 적합한 배치를 찾아드릴게요.')
    setApAckColor('#8c8c8c')
    setApAckBlink(false)
    setApPlacement(false)
    setApPlacementIn(false)
    setApPlacementClosing(false)
    setApSpinner2(false)
    setApRoomAuto(false)
    setApRoomAutoIn(false)
    setApRoomDown(false)
    setApSnackbar(false)
    setApSnackbarIn(false)
    setSheetHeight(320); sheetHeightRef.current = 320
    setBodyOffset(0)
    if (apBodyRef.current) apBodyRef.current.scrollTop = 0
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAutoArrangeVisible(true)
      const tReady = setTimeout(() => setApReady(true), 1000)
      timersRef.current.push(tReady)
    }))
  }

  const scrollBodyTo = (target) => {
    const el = apBodyRef.current
    if (!el) return
    const start = el.scrollTop, dist = target - start, duration = 400
    const eio = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      el.scrollTop = start + dist * eio(p)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* ── Step3: "모두 배치해줘" 선택 ── */
  const handleStep3 = () => {
    if (!apReady || apStep3) return
    setApStep3(true)
    const t1 = setTimeout(() => {
      setUserBubbleIn(true)
      requestAnimationFrame(() => {
        if (userBubbleRef.current && apBodyRef.current) {
          const offset = userBubbleRef.current.offsetTop
          setBodyOffset(offset + 200)
          requestAnimationFrame(() => scrollBodyTo(offset))
        }
      })
      const t2 = setTimeout(() => {
        setApAiAck(true)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setApAiAckIn(true)
          if (apAiAckRef.current && apBodyRef.current) {
            const offset = apAiAckRef.current.offsetTop
            setBodyOffset(offset + 200)
            requestAnimationFrame(() => scrollBodyTo(offset - 20))
          }
          const tSp  = setTimeout(() => setApSpinner2(true), 200)
          const tB0  = setTimeout(() => setApAckBlink(true), 2000)
          const tP1  = setTimeout(() => {
            setApAckText('침대를 먼저 배치하고 있어요.')
            setApAckBlink(false)
            setApRoomAuto(true)
            requestAnimationFrame(() => requestAnimationFrame(() => setApRoomAutoIn(true)))
          }, 2320)
          const tB1  = setTimeout(() => setApAckBlink(true), 5000)
          const tP2  = setTimeout(() => { setApAckText('탁자를 배치하고 있어요.'); setApAckBlink(false) }, 5320)
          const tB2  = setTimeout(() => setApAckBlink(true), 8000)
          const tP3  = setTimeout(() => { setApAckText('러그를 깔고 소품들을 배치하고 있어요.'); setApAckBlink(false) }, 8320)
          const tB3  = setTimeout(() => setApAckBlink(true), 11000)
          const tFin = setTimeout(() => {
            setApAckText('침실 배치가 완료되었어요. 최적의 배치 후보안을 확인해보세요.')
            setApAckColor('#141414')
            setApAckBlink(false)
            setApSpinner2(false)
          }, 11320)
          const tPlace = setTimeout(() => {
            setSheetHeight(368); sheetHeightRef.current = 368
            setApPlacement(true)
            requestAnimationFrame(() => requestAnimationFrame(() => setApPlacementIn(true)))
          }, 11720)
          timersRef.current.push(tSp, tB0, tP1, tB1, tP2, tB2, tP3, tB3, tFin, tPlace)
        }))
      }, 1500)
      timersRef.current.push(t2)
    }, 500)
    timersRef.current.push(t1)
  }

  /* ── 배치안 확정 → 바텀시트 닫기 + 스낵바 ── */
  const handlePlacementSubmit = () => {
    setApPlacementClosing(true)
    setAutoArrangeVisible(false)
    setApRoomDown(true)
    const tSnackbar = setTimeout(() => {
      setApSnackbar(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setApSnackbarIn(true)))
      const tOut = setTimeout(() => {
        setApSnackbarIn(false)
        const tNav = setTimeout(() => navigate('/onboarding-done'), 500)
        timersRef.current.push(tNav)
      }, 3000)
      timersRef.current.push(tOut)
    }, 300)
    timersRef.current.push(tSnackbar)
  }

  const fz = FIXED_ZONE
  const fzCX = fz.x + fz.w / 2
  const fzCY = fz.y + fz.h / 2
  const chipW = 51, chipH = 20
  const chipX = fzCX - chipW / 2
  const chipY = fzCY - chipH / 2

  return (
    <PhoneShell bg="#222">
      <div style={s.page}>

        {/* ── Status Bar ── */}
        <div className="status-bar" style={s.statusBar}>
          <div style={{ position: 'relative', width: 54, height: 50, flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '32%', bottom: '26%', left: 0, right: 0, borderRadius: 32 }}>
              <img src={img941} alt="" style={{ position: 'absolute', left: 12.45, top: 5.17, width: 28.426, height: 11.089 }} />
            </div>
          </div>
          <div style={{ position: 'relative', width: 68, height: 50, flexShrink: 0 }}>
            <img src={imgLevels} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ── Top Bar ── */}
        {!defaultRoomVisible ? (
          <div className="screen-topbar" style={s.topBar}>
            <div style={{ width: 24, flexShrink: 0 }} />
            <p style={s.topBarTitle}>영역 편집하기</p>
            <button style={s.closeBtn} onClick={() => { localStorage.setItem('ssOnboardingStep', 'template'); navigate('/') }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="screen-topbar" style={{ ...s.topBar, justifyContent: 'space-between' }}>
            <button style={s.closeBtn} onClick={() => navigate('/')}>
              <img src={iconBackButton} alt="뒤로" style={{ width: 24, height: 24 }} />
            </button>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <img src={iconSpaceAIView}     alt="뷰 변경" style={{ width: 40, height: 42 }} />
              <img src={iconSpaceAICapture}  alt="캡처"   style={{ width: 40, height: 42 }} />
              <img src={iconSpaceAIRoomlist} alt="방 목록" style={{ width: 40, height: 42 }} />
              <img src={iconSpaceAIMenu}     alt="메뉴"   style={{ width: 40, height: 42 }} />
            </div>
          </div>
        )}

        {/* ── Tutorial Card ── */}
        <div style={{ ...s.tutorialCard, pointerEvents: 'none' }}>
          <div style={s.tutorialInner}>
            {defaultRoomVisible ? (
              <>
                <span style={s.tutorialStep}>Step 2. 가구 자동 배치 해보기</span>
                <span style={s.tutorialTitle}>비어있는 침실에 가구를 놓아볼까요?</span>
              </>
            ) : (
              <>
                <span style={s.tutorialStep}>Step 1. 방 영역 편집하기</span>
                <span style={s.tutorialTitle}>미리 지정된 영역을 터치해서 수정할 수 있어요</span>
              </>
            )}
          </div>
        </div>

        {/* ── Template Room Image (center) ── */}
        <div style={{ ...s.roomFrame, opacity: defaultRoomVisible ? 0 : 1, transition: 'opacity 400ms ease-in-out', overflow: 'visible' }}>
          <div style={s.roomFrameInner}>
            <img src={imgTemplateRoom} alt="템플릿 방" style={s.roomImg} />
            <svg
              ref={areaSvgRef}
              width={280} height={188}
              viewBox="0 0 280 188"
              style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: editingArea ? 'auto' : 'none', touchAction: 'none' }}
            >
              {/* 사전 지정 영역들 — zone rect only */}
              {AREAS.map(area => {
                const isEditing = editingArea === area.key
                return (
                  <rect key={area.key}
                    x={area.x} y={area.y} width={area.w} height={area.h} rx="4"
                    fill={isEditing ? 'rgba(0,161,255,0.20)' : area.fill}
                    stroke={isEditing ? '#00a1ff' : area.stroke}
                    strokeWidth="2"
                    strokeDasharray={isEditing ? '6 3' : undefined}
                    opacity={
                      (editingArea && editingArea !== area.key) ||
                      (editingArea === area.key && areaDragPreview) ||
                      (zoneOnlyView && zoneOnlyView !== area.key)
                        ? 0 : 1
                    }
                    style={{ transition: 'opacity 150ms ease' }}
                    pointerEvents="none"
                  />
                )
              })}
              {/* 드래그 프리뷰 */}
              {areaDragPreview && areaDragPreview.w > 5 && areaDragPreview.h > 5 && (
                <rect
                  x={areaDragPreview.x} y={areaDragPreview.y}
                  width={areaDragPreview.w} height={areaDragPreview.h}
                  rx="4"
                  fill="rgba(0,161,255,0.20)"
                  stroke="#00a1ff" strokeWidth="2" strokeDasharray="6 3"
                  pointerEvents="none"
                  style={{ transition: 'opacity 150ms ease' }}
                />
              )}
              {/* 그린존 */}
              {areaDrawn && (
                <g style={{
                  transformOrigin: `${fzCX}px ${fzCY}px`,
                  transform: areaSnapping ? 'scale(0.7)' : 'scale(1)',
                  opacity: areaSnapping ? 0 : 1,
                  transition: areaSnapping ? 'none' : 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
                }}>
                  <rect
                    x={fz.x} y={fz.y} width={fz.w} height={fz.h} rx="3"
                    fill="#00B32D" fillOpacity="0.4"
                    stroke="#00B32D" strokeWidth="2"
                    pointerEvents="none"
                  />
                  <g transform={`translate(${chipX}, ${chipY})`} pointerEvents="none">
                    <rect x="0" y="0" width={chipW} height={chipH} rx="10" fill="#141414"/>
                    <circle cx="14" cy="10" r="5" fill="#00B32D"/>
                    <path d="M16.2828 8.617C16.1266 8.461 15.8734 8.461 15.7172 8.617L13.5361 10.798L12.2828 9.545C12.1266 9.389 11.8734 9.389 11.7172 9.545C11.561 9.701 11.561 9.954 11.7172 10.111L13.2533 11.647C13.3283 11.722 13.43 11.764 13.5361 11.764C13.6422 11.764 13.7439 11.722 13.8189 11.647L16.2828 9.183C16.439 9.027 16.439 8.773 16.2828 8.617Z" fill="white"/>
                    <text x="36" y="14" textAnchor="middle" fill="white" fontSize="10" fontFamily="'Pretendard', sans-serif" fontWeight="500" letterSpacing="-0.3">침실</text>
                  </g>
                </g>
              )}
            </svg>
          </div>

            {/* HTML Pill Badges */}
            {AREAS.map(area => {
              const isActive = activeArea === area.key
              const iconFill  = isActive ? 'white'   : '#8c8c8c'
              const checkColor = isActive ? '#141414' : 'white'
              const textColor  = isActive ? 'white'   : '#8c8c8c'
              return (
                <div
                  key={area.key}
                  onClick={() => { setEditingArea(null); setZoneOnlyView(null); setActiveArea(isActive ? null : area.key) }}
                  style={{
                    position: 'absolute',
                    left: area.x + area.w / 2, top: area.pillY,
                    transform: 'translateX(-50%)',
                    display: 'inline-flex',
                    minHeight: 20, maxHeight: 20,
                    padding: '0 8px',
                    justifyContent: 'center', alignItems: 'center',
                    gap: 2,
                    borderRadius: 15,
                    background: isActive ? '#141414' : 'white',
                    cursor: 'pointer', zIndex: 10,
                    opacity: (editingArea || (zoneOnlyView && zoneOnlyView !== area.key)) ? 0 : 1,
                    transition: 'background 150ms ease, opacity 200ms ease',
                    whiteSpace: 'nowrap',
                    pointerEvents: (editingArea || (zoneOnlyView && zoneOnlyView !== area.key)) ? 'none' : 'auto',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="5.5" fill={iconFill} />
                    <path d="M3.5 6.1L5.1 7.7L8.5 4.5" stroke={checkColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: textColor,
                    letterSpacing: '-0.3px', lineHeight: '16px',
                    fontFamily: "'Pretendard', sans-serif",
                  }}>
                    {area.label}
                  </span>
                </div>
              )
            })}
        </div>

        {/* ── 가이드 텍스트 ── */}
        <div style={{
          ...s.guideText,
          opacity: editingArea && !editDragged && !areaDragPreview ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: 'none',
        }}>
          <p style={s.guideTextLabel}>
            드래그하여 {AREAS.find(a => a.key === editingArea)?.label ?? '침실'} 영역을 지정해주세요.
          </p>
        </div>

        {/* ── 수정하기 / 삭제하기 (영역 활성화 시 노출) ── */}
        {activeArea && !defaultRoomVisible && (
          <div style={{
            position: 'absolute', bottom: 82, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 40, zIndex: 20,
          }}>
            <button
              onClick={() => { setEditingArea(activeArea); setActiveArea(null); setEditDragged(false) }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 40, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img src={iconPencil} alt="수정" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8c8c8c', letterSpacing: '-0.3px', lineHeight: '16px', fontFamily: "'Pretendard', sans-serif", whiteSpace: 'nowrap' }}>수정하기</span>
            </button>
            <button
              onClick={() => setActiveArea(null)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 40, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <img src={iconTrash} alt="삭제" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#8c8c8c', letterSpacing: '-0.3px', lineHeight: '16px', fontFamily: "'Pretendard', sans-serif", whiteSpace: 'nowrap' }}>삭제하기</span>
            </button>
          </div>
        )}

        {/* ── 이대로 사용 ── */}
        <div style={{
          position: 'absolute', left: 0, bottom: 0, width: 375,
          paddingLeft: 16, paddingRight: 16,
          paddingTop: 10, paddingBottom: 16,
          opacity: apPlacementClosing ? 0 : 1,
          pointerEvents: (apPlacementClosing || (editingArea && !editDragged) || areaDragPreview) ? 'none' : 'auto',
          transform: (editingArea && !editDragged) || areaDragPreview ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)',
          zIndex: 20,
        }}>
          <button
            onClick={activeArea
              ? () => { setActiveArea(null); setZoneOnlyView(null); setEditingArea(null); setEditDragged(false) }
              : handleAreaNext
            }
            style={{
              width: '100%', height: 48,
              background: '#00a1ff', color: 'white',
              border: 'none', borderRadius: 8,
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px',
              cursor: 'pointer',
            }}
          >
            {activeArea ? '적용하기' : '이대로 사용하기'}
          </button>
        </div>

        {/* ── Default Room 226×226 (Figma node 15238:129154) ── */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% + 0.5px)',
          top: apRoomDown ? 'calc(50% + 1px)' : 'calc(50% - 89px)',
          transform: 'translate(-50%, -50%)',
          width: 226, height: 226,
          background: 'white',
          border: '5px solid #080809',
          overflow: 'hidden',
          zIndex: 5,
          opacity: defaultRoomVisible ? 1 : 0,
          pointerEvents: defaultRoomVisible ? 'auto' : 'none',
          transition: apRoomDown
            ? 'top 500ms ease-in-out, opacity 400ms ease-in-out'
            : 'opacity 400ms ease-in-out',
        }}>
          {/* 방 이미지 — 내부 216×216 좌상단 */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 216, height: 216, overflow: 'hidden' }}>
            <img
              src={imgTemplateRoom}
              alt=""
              style={{
                position: 'absolute',
                width: '327.68%', height: '710.63%',
                left: '-204.06%', top: '-254.11%',
                maxWidth: 'none', pointerEvents: 'none',
              }}
            />
          </div>
          {/* 자동배치 결과 이미지 오버레이 */}
          {apRoomAuto && (
            <img
              key={selectedPlacement}
              src={[imgAutoArrange1, imgAutoArrange2, imgAutoArrange3][selectedPlacement - 1]}
              alt=""
              style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 216, height: 216,
                objectFit: 'contain', objectPosition: 'center',
                display: 'block', pointerEvents: 'none',
                opacity: apRoomAutoIn ? 1 : 0,
                animation: apRoomAutoIn ? 'ap-room-fadein 300ms ease-in both' : 'none',
              }}
            />
          )}
          {/* 스피너 — 226×226 프레임 중앙 40×40 (Figma Size=40, State=50%) */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 40, height: 40, transform: 'translate(-50%, -50%)', opacity: autoArrangeVisible ? (apSpinner2 ? 1 : 0) : (apPlacementClosing ? 0 : 1), transition: 'opacity 0.3s ease' }}>
            <div style={{ position: 'relative', width: 40, height: 40, animation: 'defaultRoomSpin 1.2s linear infinite', transformOrigin: '20px 20px' }}>
              {/* 회색 링 배경 */}
              <img src={imgSpinnerBg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none' }} />
              {/* Q1: 우상단 — 회전 없음 */}
              <div style={{ position: 'absolute', top: 0, left: '50%', right: 0, bottom: '50%' }}>
                <div style={{ position: 'absolute', top: '0.32%', left: 0, right: 0, bottom: 0 }}>
                  <img src={imgSpinnerQ1} alt="" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }} />
                </div>
              </div>
              {/* Q2: 우하단 — 90° 회전 */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, flexShrink: 0, transform: 'rotate(90deg)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, right: '0.32%', bottom: 0, left: 0 }}>
                    <img src={imgSpinnerQ2} alt="" style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 영역 삭제 스낵바 ── */}
        <div style={{
          position: 'absolute',
          left: 16, right: 16, bottom: 82,
          padding: '13px 16px',
          background: '#141414',
          color: '#fff',
          fontFamily: "'Pretendard', sans-serif",
          fontSize: 14, fontWeight: 400, lineHeight: '18px',
          letterSpacing: '-0.3px',
          borderRadius: 8,
          opacity: areaSnackbar ? 1 : 0,
          transform: areaSnackbar ? 'translateY(0)' : 'translateY(100px)',
          pointerEvents: 'none',
          zIndex: 25,
          transition: 'opacity 0.3s ease, transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)',
        }}>
          침실 영역이 삭제되었어요.
        </div>

        {/* ── 배치 완료 스낵바 ── */}
        {apSnackbar && (
          <div style={{
            position: 'absolute',
            left: 16, right: 16, bottom: 20,
            padding: '13px 16px',
            background: '#141414', color: '#fff',
            fontFamily: "'Pretendard', sans-serif",
            fontSize: 14, fontWeight: 400, lineHeight: '18px',
            letterSpacing: '-0.3px', borderRadius: 12,
            opacity: apSnackbarIn ? 1 : 0,
            pointerEvents: 'none', zIndex: 35,
            transition: apSnackbarIn ? 'opacity 300ms ease-out' : 'opacity 200ms ease-out',
          }}>
            침실 꾸미기가 완료되었어요.
          </div>
        )}

        {/* ── 자동배치 바텀시트 ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: 375,
          height: sheetHeight,
          background: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16,
          overflow: 'hidden', zIndex: 30,
          transform: autoArrangeVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: apPlacementClosing
            ? 'transform 300ms ease-in-out'
            : sheetDragging
              ? 'transform 450ms cubic-bezier(0.32, 0.72, 0, 1)'
              : 'height 350ms cubic-bezier(0.32,0.72,0,1), transform 450ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}>
          {/* Grabber */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
              paddingTop: 8, paddingBottom: 12, display: 'flex', justifyContent: 'center',
              cursor: 'ns-resize', touchAction: 'none',
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              sheetDragStartYRef.current = e.clientY
              sheetDragStartHRef.current = sheetHeightRef.current
              setSheetDragging(true)
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
              const dy = sheetDragStartYRef.current - e.clientY
              const newH = Math.max(320, Math.min(706, sheetDragStartHRef.current + dy))
              sheetHeightRef.current = newH
              setSheetHeight(newH)
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId)
              setSheetDragging(false)
              const snapH = apPlacement
                ? (sheetHeightRef.current > 537 ? 706 : 368)
                : (sheetHeightRef.current > 513 ? 706 : 320)
              sheetHeightRef.current = snapH
              setSheetHeight(snapH)
            }}
          >
            <div style={{ width: 40, height: 4, background: 'rgba(140,140,140,0.2)', borderRadius: 40 }} />
          </div>

          {/* Navigation bar */}
          <div style={{
            position: 'absolute', top: 24, left: 0, right: 0, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingLeft: 16, paddingRight: 16, background: 'white',
          }}>
            <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="#2f3438" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 700, color: '#2f3438', letterSpacing: '-0.3px', lineHeight: '20px', fontFamily: "'Pretendard', sans-serif", whiteSpace: 'nowrap' }}>
              침실 영역 자동 배치
            </span>
            <button
              onClick={() => { clearTimers(); setAutoArrangeVisible(false); setDefaultRoomVisible(false) }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="#2f3438" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Body — 스크롤 */}
          <div
            ref={apBodyRef}
            style={{
              position: 'absolute', top: 68, left: 0, right: 0, bottom: apPlacement ? 214 : 64,
              transition: 'bottom 350ms cubic-bezier(0.32,0.72,0,1)',
              overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
            }}
          >
            {/* AI 롤링 텍스트 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingTop: 20, paddingLeft: 16, paddingRight: 16 }}>
              <svg className="ap-sparkles" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 4 }}>
                <path d="M8.5 7C10.5 11 12.5 13 16.5 15C12.5 17 10.5 19 8.5 23C6.5 19 4.5 17 0.5 15C4.5 13 6.5 11 8.5 7Z" fill="#0AA5FF"/>
                <path d="M18.5 0.5C19.75 3 21 4.25 23.5 5.5C21 6.75 19.75 8 18.5 10.5C17.25 8 16 6.75 13.5 5.5C16 4.25 17.25 3 18.5 0.5Z" fill="#0AA5FF"/>
              </svg>
              <p style={{
                flex: 1, minWidth: 0, fontSize: 15, fontWeight: 400,
                color: rollingFinal ? '#141414' : '#8c8c8c',
                letterSpacing: '-0.3px', lineHeight: '24px',
                fontFamily: "'Pretendard', sans-serif", wordBreak: 'break-word',
                opacity: rollingHidden ? 0 : 1,
                transition: 'opacity 0.3s ease, color 0.3s ease',
              }}>
                {rollingText}
              </p>
            </div>

            {/* 유저 버블 */}
            {apStep3 && (
              <div ref={userBubbleRef} style={{ paddingTop: 20, paddingBottom: 20, paddingLeft: 16, paddingRight: 16 }}>
                <div style={{
                  background: '#f5f5f5', borderRadius: 20,
                  paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
                  opacity: userBubbleIn ? 1 : 0,
                  transform: userBubbleIn ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
                }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: '#141414', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", wordBreak: 'break-word' }}>
                    침대, 러그, 탁자, 스탠드를 모두 배치해줘.
                  </p>
                </div>
              </div>
            )}

            {/* AI ack */}
            {apAiAck && (
              <div ref={apAiAckRef} style={{
                display: 'flex', gap: 8, alignItems: apAckColor === '#141414' ? 'flex-start' : 'center',
                paddingBottom: 20, paddingLeft: 16, paddingRight: 16,
                opacity: apAiAckIn ? 1 : 0,
                transform: apAiAckIn ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
              }}>
                <svg className="ap-sparkles" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: apAckColor === '#141414' ? 4 : 0 }}>
                  <path d="M8.5 7C10.5 11 12.5 13 16.5 15C12.5 17 10.5 19 8.5 23C6.5 19 4.5 17 0.5 15C4.5 13 6.5 11 8.5 7Z" fill="#0AA5FF"/>
                  <path d="M18.5 0.5C19.75 3 21 4.25 23.5 5.5C21 6.75 19.75 8 18.5 10.5C17.25 8 16 6.75 13.5 5.5C16 4.25 17.25 3 18.5 0.5Z" fill="#0AA5FF"/>
                </svg>
                <p style={{
                  margin: 0, flex: 1, fontSize: 15, fontWeight: 400,
                  color: apAckColor, letterSpacing: '-0.3px', lineHeight: '24px',
                  fontFamily: "'Pretendard', sans-serif", wordBreak: 'break-word',
                  opacity: apAckBlink ? 0 : 1,
                  transition: 'opacity 0.3s ease, color 0.3s ease',
                }}>
                  {apAckText}
                </p>
              </div>
            )}

            <div style={{ height: bodyOffset }} />
          </div>

          {/* 채팅 입력창 */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 }}>
            {!apPlacement && (
              <>
                <div style={{
                  display: 'flex', gap: 4, alignItems: 'flex-end',
                  opacity: (apReady && !apStep3) ? 0 : 1,
                  transition: (apReady && !apStep3) ? 'opacity 0.3s ease 0.32s' : 'none',
                  pointerEvents: (apReady && !apStep3) ? 'none' : 'auto',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 99, background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="#141414" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 99, background: '#f5f5f5', display: 'flex', alignItems: 'center', paddingLeft: 16, paddingRight: 4, gap: 10, overflow: 'hidden' }}>
                    <span style={{ flex: 1, fontSize: 16, fontWeight: 400, color: '#c1c1c1', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apStep3 ? '작업하는 중' : '생각하는 중'}
                    </span>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: '#141414', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: 'white' }} />
                    </div>
                  </div>
                </div>
                {apReady && !apStep3 && (
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10, right: 10,
                    background: '#f5f5f5', border: '1.5px solid rgba(0,0,0,0.05)',
                    borderRadius: 20, paddingLeft: 16, paddingRight: 16,
                    paddingTop: 10, paddingBottom: 10, overflow: 'hidden',
                    animation: 'ap-pill-fade-in 0.4s ease 0.32s both',
                  }}>
                    <div style={{ paddingBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#141414', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", wordBreak: 'break-word' }}>
                        침대, 러그, 탁자, 스탠드를 배치해볼까요?
                      </p>
                    </div>
                    <div onClick={handleStep3} style={{ borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 8, alignItems: 'center', paddingTop: 14, paddingBottom: 14, cursor: 'pointer' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#141414', letterSpacing: '-0.3px', fontFamily: "'Pretendard', sans-serif" }}>1</div>
                      <p style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 400, color: '#141414', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>모두 배치해줘.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#141414', letterSpacing: '-0.3px', fontFamily: "'Pretendard', sans-serif" }}>2</div>
                      <p style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 400, color: '#8c8c8c', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>직접 입력</p>
                      <div style={{ width: 36, height: 36, borderRadius: 99, background: '#141414', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={iconArrowUpMedium} alt="" style={{ width: 16, height: 16 }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 배치 선택 카드 */}
            {apPlacement && (
              <div style={{
                background: '#f5f5f5', border: '1.5px solid rgba(0,0,0,0.05)',
                borderRadius: 20, paddingLeft: 16, paddingRight: 16,
                paddingTop: 10, paddingBottom: 10, overflow: 'hidden',
                boxShadow: '0px 4px 10px rgba(0,0,0,0.12)',
                opacity: apPlacementIn ? 1 : 0,
                transform: apPlacementIn ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.32,0.72,0,1)',
              }}>
                <div style={{ paddingBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#141414', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif" }}>
                    적용할 배치안을 선택해주세요.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', paddingBottom: 14, borderBottom: '1px solid #e0e0e0' }}>
                  {[
                    { n: 1, img: imgAutoArrange1 },
                    { n: 2, img: imgAutoArrange2 },
                    { n: 3, img: imgAutoArrange3 },
                  ].map(({ n, img }) => {
                    const sel = selectedPlacement === n
                    return (
                      <div key={n} onClick={() => setSelectedPlacement(n)} style={{ width: 80, height: 80, borderRadius: 8, border: sel ? '2px solid #00a1ff' : '1px solid #e0e0e0', background: 'white', overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: 'pointer' }}>
                        <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 4, left: 4, width: 16, height: 16, borderRadius: '50%', background: sel ? '#00a1ff' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'white', letterSpacing: '-0.3px', fontFamily: "'Pretendard', sans-serif" }}>{n}</div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 47, background: 'rgba(0,0,0,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px', fontFamily: "'Pretendard', sans-serif" }}>4</div>
                  <p style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 400, color: '#8c8c8c', letterSpacing: '-0.3px', lineHeight: '24px', fontFamily: "'Pretendard', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>직접 입력</p>
                  <div onClick={handlePlacementSubmit} style={{ width: 36, height: 36, borderRadius: 99, background: '#141414', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
                    <img src={iconArrowUpMedium} alt="" style={{ width: 16, height: 16 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </PhoneShell>
  )
}

const s = {
  page: {
    position: 'absolute', inset: 0,
    background: '#222',
    overflow: 'hidden',
  },

  statusBar: {
    position: 'absolute', top: 0, left: 0, width: 375, height: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 21, paddingRight: 14, zIndex: 10, opacity: 0,
  },

  topBar: {
    position: 'absolute', top: 50, left: 0, width: 375, height: 44,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 16, paddingRight: 16, gap: 20, zIndex: 10,
  },
  topBarTitle: {
    flex: '1 0 0', minWidth: 0,
    fontSize: 16, fontWeight: 500, color: 'white',
    lineHeight: '20px', letterSpacing: '-0.3px',
    fontFamily: "'Pretendard', sans-serif",
    textAlign: 'center',
  },
  closeBtn: {
    width: 24, height: 24, flexShrink: 0,
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  tutorialCard: {
    position: 'absolute', top: 106, left: '50%',
    transform: 'translateX(-50%)',
    width: 343, zIndex: 5,
    backdropFilter: 'blur(2.5px)', WebkitBackdropFilter: 'blur(2.5px)',
    background: 'rgba(0,0,0,0.15)', borderRadius: 16,
    paddingTop: 16, paddingBottom: 16,
  },
  tutorialInner: {
    paddingLeft: 24, paddingRight: 20,
    display: 'flex', flexDirection: 'column',
  },
  tutorialStep: {
    fontSize: 13, fontWeight: 500, color: '#7f7f7f',
    lineHeight: '18px', letterSpacing: '-0.3px',
    fontFamily: "'Pretendard', sans-serif",
    whiteSpace: 'nowrap',
  },
  tutorialTitle: {
    fontSize: 16, fontWeight: 600, color: '#e0e0e0',
    lineHeight: '28px', letterSpacing: '-0.3px',
    fontFamily: "'Pretendard', sans-serif",
  },

  roomFrame: {
    position: 'absolute',
    left: 'calc(50% + 0.5px)', top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 290, height: 198,
    border: '5px solid #080809',
    background: 'white',
    overflow: 'hidden',
    zIndex: 4,
  },
  roomFrameInner: {
    position: 'absolute', left: 0, top: 0,
    width: 280, height: 188,
    overflow: 'hidden',
  },
  roomImg: {
    position: 'absolute',
    width: '114.69%',
    height: '370.43%',
    left: '-6.42%',
    top: '-132.46%',
    maxWidth: 'none',
    pointerEvents: 'none',
  },

  guideText: {
    position: 'absolute', bottom: 20, left: '50%',
    transform: 'translateX(-50%)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255,255,255,0.12)',
    paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
    borderRadius: 12, zIndex: 5,
    whiteSpace: 'nowrap',
  },
  guideTextLabel: {
    fontSize: 16, fontWeight: 400, color: 'white',
    lineHeight: '24px', letterSpacing: '-0.3px',
    fontFamily: "'Pretendard', sans-serif",
    whiteSpace: 'nowrap', textAlign: 'center',
  },
}
