<template>
  <LoginPage
    v-if="!isLoggedIn"
    @login-success="handleLoginSuccess"
  />

  <div v-else class="layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">AIPS</div>
        <div>
          <div class="brand-title">MK-AIPS</div>
          <div class="brand-subtitle">智慧排程模組</div>
        </div>
      </div>

      <div class="user-box">
        <div class="user-name">{{ currentUser.display_name || currentUser.username }}</div>
        <div class="user-role">{{ currentUser.role_name }}</div>
        <button class="logout-btn" @click="logout">登出</button>
      </div>

      <nav class="side-menu">
        <div v-for="group in menuGroups" :key="group.title" class="menu-group">
          <button class="menu-group-title" @click="toggleGroup(group.title)">
            <span>{{ group.icon }}</span>
            <span>{{ group.title }}</span>
            <span class="menu-arrow">{{ openedGroups.includes(group.title) ? '▾' : '▸' }}</span>
          </button>

          <div v-show="openedGroups.includes(group.title)" class="submenu">
            <button
              v-for="item in group.children"
              :key="item.key"
              :class="{ active: tab === item.key }"
              @click="tab = item.key"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div>Demo Mode</div>
        <small>Vue 3 + FastAPI + PostgreSQL</small>
      </div>
    </aside>

    <main class="main-content">
      <Dashboard v-if="tab === 'dashboard'" />
      <LoginAuthPanel v-if="tab === 'login_auth'" />

      <HardwareSimulatorOverview v-if="tab === 'hw_overview'" />
      <PdaAndroidSimulator v-if="tab === 'hw_pda'" />
      <NfcQrTagSimulator v-if="tab === 'hw_tags'" />
      <CncMeterSimulator v-if="tab === 'hw_cnc_meter'" />
      <LineSideLogisticsSimulator v-if="tab === 'hw_logistics'" />

      <MeterDashboard v-if="tab === 'meter'" />
      <WorkOrderPanel v-if="tab === 'wo'" />
      <RunCardPanel v-if="tab === 'run_card'" />
      <InventoryPanel v-if="tab === 'inventory'" />
      <RealtimeEventPanel v-if="tab === 'realtime_event'" />
      <IntegrationOutputPanel v-if="tab === 'integration_output'" />

      <AipsStatePanel v-if="tab === 'state'" />
      <DqnActionPanel v-if="tab === 'action'" />
      <PredictionPanel v-if="tab === 'prediction'" />
      <RewardPanel v-if="tab === 'reward'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import LoginPage from './components/LoginPage.vue'
import Dashboard from './components/Dashboard.vue'
import LoginAuthPanel from './components/LoginAuthPanel.vue'

import HardwareSimulatorOverview from './components/HardwareSimulatorOverview.vue'
import PdaAndroidSimulator from './components/PdaAndroidSimulator.vue'
import NfcQrTagSimulator from './components/NfcQrTagSimulator.vue'
import CncMeterSimulator from './components/CncMeterSimulator.vue'
import LineSideLogisticsSimulator from './components/LineSideLogisticsSimulator.vue'

import MeterDashboard from './components/MeterDashboard.vue'
import WorkOrderPanel from './components/WorkOrderPanel.vue'
import RunCardPanel from './components/RunCardPanel.vue'
import InventoryPanel from './components/InventoryPanel.vue'
import RealtimeEventPanel from './components/RealtimeEventPanel.vue'
import IntegrationOutputPanel from './components/IntegrationOutputPanel.vue'

import AipsStatePanel from './components/AipsStatePanel.vue'
import DqnActionPanel from './components/DqnActionPanel.vue'
import PredictionPanel from './components/PredictionPanel.vue'
import RewardPanel from './components/RewardPanel.vue'

const storedToken = localStorage.getItem('aips_token')
const storedUser = localStorage.getItem('aips_user')

const isLoggedIn = ref(!!storedToken)
const currentUser = ref(storedUser ? JSON.parse(storedUser) : {})
const tab = ref('dashboard')

const openedGroups = ref([
  '總覽',
  '系統管理',
  '硬體模擬器',
  '核心作業',
  'AI 決策'
])

const menuGroups = [
  {
    title: '總覽',
    icon: '🏠',
    children: [
      { key: 'dashboard', label: '總覽儀表板', icon: '📊' }
    ]
  },
  {
    title: '系統管理',
    icon: '🔐',
    children: [
      { key: 'login_auth', label: '登入 / 權限管理', icon: '👤' }
    ]
  },
  {
    title: '硬體模擬器',
    icon: '🏭',
    children: [
      { key: 'hw_overview', label: '模擬器總覽', icon: '🗺️' },
      { key: 'hw_pda', label: 'WiFi PDA / Android', icon: '📱' },
      { key: 'hw_tags', label: 'NFC / QR Code 標籤', icon: '🏷️' },
      { key: 'hw_cnc_meter', label: 'CNC + 智慧電表', icon: '⚡' },
      { key: 'hw_logistics', label: '線邊庫 / 人工物流', icon: '🛒' }
    ]
  },
  {
    title: '核心作業',
    icon: '⚙️',
    children: [
      { key: 'meter', label: 'CNC 智慧電表', icon: '⚡' },
      { key: 'wo', label: 'ERP 製令單', icon: '📋' },
      { key: 'run_card', label: '製令流程卡 / AI', icon: '🧾' },
      { key: 'inventory', label: 'WMS 線邊庫', icon: '📦' },
      { key: 'realtime_event', label: '即時事件', icon: '📡' },
      { key: 'integration_output', label: '對外整合輸出', icon: '📤' }
    ]
  },
  {
    title: 'AI 決策',
    icon: '🤖',
    children: [
      { key: 'state', label: 'DQN State', icon: '🧠' },
      { key: 'action', label: 'DQN 排程建議', icon: '✅' },
      { key: 'prediction', label: 'AI 生產預測', icon: '📈' },
      { key: 'reward', label: 'Reward 回饋', icon: '🏆' }
    ]
  }
]

function handleLoginSuccess(payload) {
  localStorage.setItem('aips_token', payload.token)
  localStorage.setItem('aips_user', JSON.stringify(payload.user))
  currentUser.value = payload.user
  isLoggedIn.value = true
  tab.value = 'dashboard'
}

function logout() {
  localStorage.removeItem('aips_token')
  localStorage.removeItem('aips_user')
  isLoggedIn.value = false
  currentUser.value = {}
}

function toggleGroup(title) {
  if (openedGroups.value.includes(title)) {
    openedGroups.value = openedGroups.value.filter(item => item !== title)
  } else {
    openedGroups.value.push(title)
  }
}
</script>
