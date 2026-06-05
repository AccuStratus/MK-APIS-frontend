import React, { useMemo, useState } from 'react'
import minkingLogo from './assets/minking-logo-brand.png'
import iksLogo from './assets/iks-logo.png'
import LoginPage from './components/LoginPage.jsx'
import MeterDashboard from './components/MeterDashboard.jsx'
import RunCardPanel from './components/RunCardPanel.jsx'
import DqnExplainPanel from './components/DqnExplainPanel.jsx'
import IntegrationOutputPanel from './components/IntegrationOutputPanel.jsx'
import RealtimeEventPanel from './components/RealtimeEventPanel.jsx'
import { Dashboard, WorkOrderPanel, InventoryPanel } from './components/CorePanels.jsx'
import { HardwareSimulatorOverview, LoginAuthPanel, AipsStatePanel, DqnActionPanel, PredictionPanel, RewardPanel } from './components/SimplePanels.jsx'
import { PdaAndroidSimulator, NfcQrTagSimulator, CncMeterSimulator, LineSideLogisticsSimulator } from './components/SimulatorPanels.jsx'

const menuGroups = [
  { title: '總覽', icon: '🏠', children: [{ key: 'dashboard', label: '總覽儀表板', icon: '📊' }] },
  { title: '系統管理', icon: '🔐', children: [{ key: 'login_auth', label: '登入 / 權限管理', icon: '👤' }] },
  { title: '硬體模擬器', icon: '🏭', children: [
    { key: 'hw_overview', label: '模擬器總覽', icon: '🗺️' },
    { key: 'hw_pda', label: 'WiFi PDA / Android', icon: '📱' },
    { key: 'hw_tags', label: 'NFC / QR Code 標籤', icon: '🏷️' },
    { key: 'hw_cnc_meter', label: 'CNC + 智慧電表', icon: '⚡' },
    { key: 'hw_logistics', label: '線邊庫 / 人工物流', icon: '🛒' }
  ] },
  { title: '核心作業', icon: '⚙️', children: [
    { key: 'meter', label: 'CNC 智慧電表', icon: '⚡' },
    { key: 'wo', label: 'ERP 製令單', icon: '📋' },
    { key: 'run_card', label: '製令流程卡 / AI', icon: '🧾' },
    { key: 'inventory', label: 'WMS 線邊庫', icon: '📦' },
    { key: 'realtime_event', label: '即時事件', icon: '📡' },
    { key: 'integration_output', label: '對外整合輸出', icon: '📤' }
  ] },
  { title: 'AI 決策', icon: '🤖', children: [
    { key: 'state', label: 'DQN State', icon: '🧠' },
    { key: 'action', label: 'DQN 排程Action', icon: '✅' },
    { key: 'dqn_explain', label: 'DQN Reward 說明', icon: '🎯' },
    { key: 'prediction', label: 'AI 生產預測', icon: '📈' },
    { key: 'reward', label: 'Reward 回饋', icon: '🏆' }
  ] }
]

function CurrentPanel({ tab }) {
  const map = {
    dashboard: <Dashboard />,
    login_auth: <LoginAuthPanel />,
    hw_overview: <HardwareSimulatorOverview />,
    hw_pda: <PdaAndroidSimulator />,
    hw_tags: <NfcQrTagSimulator />,
    hw_cnc_meter: <CncMeterSimulator />,
    hw_logistics: <LineSideLogisticsSimulator />,
    meter: <MeterDashboard />,
    wo: <WorkOrderPanel />,
    run_card: <RunCardPanel />,
    inventory: <InventoryPanel />,
    realtime_event: <RealtimeEventPanel />,
    integration_output: <IntegrationOutputPanel />,
    state: <AipsStatePanel />,
    action: <DqnActionPanel />,
    dqn_explain: <DqnExplainPanel />,
    prediction: <PredictionPanel />,
    reward: <RewardPanel />
  }
  return map[tab] || <Dashboard />
}

export default function App() {
  const storedToken = localStorage.getItem('aips_token')
  const storedUser = localStorage.getItem('aips_user')
  const [isLoggedIn, setIsLoggedIn] = useState(!!storedToken)
  const [currentUser, setCurrentUser] = useState(storedUser ? JSON.parse(storedUser) : {})
  const [tab, setTab] = useState('dashboard')
  const [openedGroups, setOpenedGroups] = useState(['總覽','系統管理','硬體模擬器','核心作業','AI 決策'])

  function handleLoginSuccess(payload) {
    localStorage.setItem('aips_token', payload.token)
    localStorage.setItem('aips_user', JSON.stringify(payload.user))
    setCurrentUser(payload.user)
    setIsLoggedIn(true)
    setTab('dashboard')
  }

  function logout() {
    localStorage.removeItem('aips_token')
    localStorage.removeItem('aips_user')
    setIsLoggedIn(false)
    setCurrentUser({})
  }

  function toggleGroup(title) {
    setOpenedGroups(prev => prev.includes(title) ? prev.filter(x => x !== title) : [...prev, title])
  }

  if (!isLoggedIn) return <LoginPage onLoginSuccess={handleLoginSuccess} />

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo-wrap"><img className="brand-image" src={minkingLogo} alt="MinKing Logo" /></div>
          <div className="sidebar-si-card">
            <span className="si-label">SI</span>
            <img className="si-logo-image" src={iksLogo} alt="國興資訊 IKS Logo" />
            <span className="si-company">國興資訊</span>
          </div>
          <div className="brand-text"><div className="brand-title">MK-AIPS</div><div className="brand-subtitle">智慧排程模組</div></div>
        </div>
        <div className="user-box">
          <div className="user-name">{currentUser.display_name || currentUser.username}</div>
          <div className="user-role">{currentUser.role_name}</div>
          <button className="logout-btn" onClick={logout}>登出</button>
        </div>
        <nav className="side-menu">
          {menuGroups.map(group => (
            <div key={group.title} className="menu-group">
              <button className="menu-group-title" onClick={() => toggleGroup(group.title)}>
                <span>{group.icon}</span><span>{group.title}</span><span className="menu-arrow">{openedGroups.includes(group.title) ? '▾' : '▸'}</span>
              </button>
              {openedGroups.includes(group.title) && <div className="submenu">
                {group.children.map(item => <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}><span>{item.icon}</span><span>{item.label}</span></button>)}
              </div>}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer"><small>React + FastAPI + PostgreSQL</small><small>SI：國興資訊</small></div>
      </aside>
      <main className="main-content"><CurrentPanel tab={tab} /></main>
    </div>
  )
}
