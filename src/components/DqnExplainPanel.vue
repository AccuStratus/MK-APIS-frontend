<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">DQN 決策說明 / Reward 展開</h1>
        <p class="page-subtitle">
          展示 DQN 接收哪些變數、如何計算 Reward 分數，以及高分 / 低分如何觸發加工、補料、停機、換機台等 Action。
        </p>
      </div>
      <div class="toolbar">
        <button class="primary-btn" @click="loadOverview">重新載入說明</button>
        <button @click="simulate">重新計算 Reward</button>
      </div>
    </div>

    <div class="explain-banner">
      <strong>委員說明重點：</strong>
      DQN 不是單純寫 if/else，它會把 ERP 製令、流程卡工序、CNC 智慧電表、WMS 線邊庫存轉成 State Vector，
      再比較每個 Action 的 Reward / Q Value，最後選擇分數最高的事件。
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">CNC 數量</div>
        <div class="metric-value">3</div>
        <div class="metric-hint">CNC-01 / CNC-02 / CNC-03</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">State 變數</div>
        <div class="metric-value">{{ variables.length }}</div>
        <div class="metric-hint">DQN 接收的輸入變數</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Action 數量</div>
        <div class="metric-value">{{ actions.length }}</div>
        <div class="metric-hint">加工 / 補料 / 停機 / 換機台</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Reward 範圍</div>
        <div class="metric-value">0~100</div>
        <div class="metric-hint">越高越優先觸發</div>
      </div>
    </div>

    <section class="card">
      <h2>a. DQN 接收變數</h2>
      <p class="section-note">
        以下變數會組成 State Vector，例如：
        <code>[交期剩餘, 預估加工, OEE, 缺料風險, 電力風險, 品質風險, 前置工序完成]</code>
      </p>
      <DataTable :columns="variableColumns" :rows="variables" :labels="variableLabels" />
    </section>

    <section class="card">
      <h2>b. DQN 如何提升 CNC 控制效率與性能</h2>
      <div class="flow-grid">
        <div class="flow-box">
          <h3>1. 避免錯誤加工</h3>
          <p>工序未完成時，立即加工會被扣高額 reward，避免步驟 2 在步驟 1 未完成前被派工。</p>
        </div>
        <div class="flow-box">
          <h3>2. 提升稼動率</h3>
          <p>OEE 高的 CNC 會提高「立即加工」分數；OEE 低時會考慮換 CNC。</p>
        </div>
        <div class="flow-box">
          <h3>3. 降低缺料等待</h3>
          <p>缺料風險高時，DQN 會觸發補料，而不是讓 CNC 空等。</p>
        </div>
        <div class="flow-box">
          <h3>4. 降低異常停機</h3>
          <p>THD / 功率風險高時，DQN 會建議停機檢查，避免硬做造成更大損失。</p>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>c. Action 與觸發事件</h2>
      <DataTable :columns="actionColumns" :rows="actions" :labels="actionLabels" />
    </section>

    <section class="card">
      <h2>d. Reward 計算公式</h2>
      <p class="section-note">
        Reward 是 0~100 分。分數越高，代表此 Action 在目前 State 下越值得執行。
        實際 DQN 會學 Q Value；此頁用可解釋公式展示「為什麼它會選這個 Action」。
      </p>
      <div class="formula-list">
        <div v-for="(formula, key) in rewardFormula" :key="key" class="formula-item">
          <strong>{{ key }}</strong>
          <span>{{ formula }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>三台 CNC + 工序關係範例</h2>
      <p class="section-note">
        若流程卡是「步驟1 → 步驟2 → 步驟3」，則後一步必須等前一步完成。
        若三台 CNC 可平行加工，DQN 會比較每台 CNC 的 Reward，選最高分 Action。
      </p>

      <div class="cnc-grid">
        <div v-for="row in results" :key="row.cnc_id" class="cnc-card">
          <div class="cnc-title">{{ row.cnc_id }}｜{{ row.current_step }}</div>
          <div class="best-action">{{ row.best_action_name }}</div>
          <div class="state-line">State Vector：{{ row.state_vector.join(' / ') }}</div>

          <div class="reward-bars">
            <div v-for="(score, action) in row.reward_scores" :key="action" class="reward-row">
              <span class="reward-name">{{ action }}</span>
              <div class="bar">
                <div class="bar-inner" :style="{ width: `${score}%` }"></div>
              </div>
              <span class="reward-score">{{ score }}</span>
            </div>
          </div>

          <div class="explain-small">
            交期壓力={{ row.explain.due_pressure }}，
            前置未完成懲罰={{ row.explain.dependency_penalty }}，
            缺料={{ row.explain.shortage_risk }}，
            電力={{ row.explain.power_thd_risk }}，
            品質={{ row.explain.quality_risk }}
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>可以對委員這樣說</h2>
      <div class="speech-box">
        本系統的 DQN State 包含交期剩餘時間、LSTM/ARIMA 預估加工時間、CNC OEE、線邊庫缺料風險、智慧電表 THD 風險、品質風險與工序前置關係。
        DQN 會針對「立即加工、等待前工序、補料、停機維護、換 CNC、提高優先權」計算 Reward / Q Value。
        分數最高者會成為建議 Action，因此可同時兼顧交期、稼動率、缺料、品質與設備風險。
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import apiClient from '../api/apiClient'
import DataTable from './DataTable.vue'

const variables = ref([])
const actions = ref([])
const rewardFormula = ref({})
const results = ref([])

const variableColumns = ['name', 'label', 'meaning', 'source']
const variableLabels = {
  name: '變數名稱',
  label: '中文名稱',
  meaning: 'DQN 用途',
  source: '資料來源'
}

const actionColumns = ['action_code', 'action_name', 'trigger', 'event']
const actionLabels = {
  action_code: 'Action Code',
  action_name: 'Action',
  trigger: '觸發條件',
  event: '系統事件'
}

async function loadOverview() {
  const res = await apiClient.get('/aips/dqn-explain/overview')
  variables.value = res.data.variables || []
  actions.value = res.data.actions || []
  rewardFormula.value = res.data.reward_formula || {}
  results.value = res.data.demo_results || []
}

async function simulate() {
  const items = results.value.map(item => item.input_state)
  const res = await apiClient.post('/aips/dqn-explain/simulate', { items })
  results.value = res.data.results || []
}

onMounted(loadOverview)
</script>

<style scoped>
.explain-banner {
  background: #eef6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a8a;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
  line-height: 1.8;
}

.section-note {
  color: #64748b;
  margin-bottom: 12px;
  line-height: 1.8;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.flow-box {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  background: #f8fafc;
}

.flow-box h3 {
  margin: 0 0 8px;
  color: #0f172a;
}

.flow-box p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.formula-list {
  display: grid;
  gap: 10px;
}

.formula-item {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 12px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fafafa;
}

.cnc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.cnc-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: white;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.cnc-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.best-action {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 700;
  margin-bottom: 8px;
}

.state-line {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 12px;
}

.reward-bars {
  display: grid;
  gap: 8px;
}

.reward-row {
  display: grid;
  grid-template-columns: 140px 1fr 42px;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.reward-name {
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #2563eb);
  border-radius: 999px;
}

.reward-score {
  text-align: right;
  color: #0f172a;
  font-weight: 700;
}

.explain-small {
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.speech-box {
  background: #f8fafc;
  border-left: 5px solid #2563eb;
  border-radius: 14px;
  padding: 16px;
  line-height: 2;
  color: #0f172a;
  font-size: 15px;
}

@media (max-width: 1200px) {
  .flow-grid,
  .cnc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
