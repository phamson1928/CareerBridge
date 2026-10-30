export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CareerBridge AI Worker | Giao diện Quản trị Cấu hình Nội bộ</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover: rgba(30, 41, 59, 0.85);
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --primary-glow: rgba(59, 130, 246, 0.35);
      --accent: #8b5cf6;
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.3);
      --warning: #f59e0b;
      --danger: #ef4444;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --input-bg: rgba(15, 23, 42, 0.8);
      --input-border: rgba(255, 255, 255, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 15% 15%, #131d33 0%, #090d16 100%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* Ambient Background Glow */
    .ambient-glow {
      position: fixed;
      top: -150px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .ambient-glow-2 {
      position: fixed;
      bottom: -150px;
      left: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    /* Layout */
    .container {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px;
      position: relative;
      z-index: 1;
      flex: 1;
    }

    /* Header */
    header {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px var(--primary-glow);
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
      fill: #fff;
    }

    .brand-info h1 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-badge {
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .brand-info p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Pulse Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid var(--card-border);
      transition: all 0.3s ease;
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #94a3b8;
    }

    .status-badge.running {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .status-badge.running .status-dot {
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulse-dot 1.8s infinite;
    }

    .status-badge.paused {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.35);
      color: #fbbf24;
    }
    .status-badge.paused .status-dot {
      background: #f59e0b;
    }

    .status-badge.pending {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.35);
      color: #f87171;
    }
    .status-badge.pending .status-dot {
      background: #ef4444;
      animation: pulse-dot 1s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* Primary & Secondary Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn:active {
      transform: scale(0.98);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #4f46e5);
      color: #fff;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-hover), #4338ca);
      box-shadow: 0 6px 20px var(--primary-glow);
    }

    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      color: #e2e8f0;
      border-color: rgba(255, 255, 255, 0.1);
    }
    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-warning {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.4);
    }
    .btn-warning:hover {
      background: rgba(245, 158, 11, 0.3);
    }

    .btn-success {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.4);
    }
    .btn-success:hover {
      background: rgba(16, 185, 129, 0.3);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      border-color: rgba(255, 255, 255, 0.18);
      transform: translateY(-2px);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    .stat-icon.green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .stat-icon.purple {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
    }
    .stat-icon.amber {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }

    .stat-content {
      flex: 1;
      overflow: hidden;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 2px;
    }

    /* Tabs Navigation */
    .tabs-header {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 12px 18px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: var(--text-main);
    }

    .tab-btn.active {
      color: #60a5fa;
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      box-shadow: 0 0 10px var(--primary);
    }

    .tab-pane {
      display: none;
      animation: fadeIn 0.25s ease-in-out;
    }

    .tab-pane.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Card Panels */
    .panel-card {
      background: var(--card-bg);
      backdrop-filter: blur(14px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .panel-title {
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }

    .panel-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Form Controls */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-control-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input, .form-select {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 0.88rem;
      font-family: inherit;
      transition: all 0.2s ease;
      outline: none;
    }

    .form-input:focus, .form-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      background: rgba(15, 23, 42, 0.95);
    }

    .input-addon-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
    }
    .input-addon-btn:hover {
      color: #fff;
    }

    .input-hint {
      font-size: 0.75rem;
      color: var(--text-dim);
      margin-top: 2px;
    }

    /* Provider Selection Cards */
    .provider-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .provider-card {
      background: rgba(15, 23, 42, 0.6);
      border: 2px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.25s ease;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .provider-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(30, 41, 59, 0.6);
      transform: translateY(-2px);
    }

    .provider-card.selected {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.1);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
    }

    .provider-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .provider-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .provider-chip {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .provider-chip.recommended {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }

    .provider-chip.universal {
      background: rgba(139, 92, 246, 0.2);
      color: #a78bfa;
      border: 1px solid rgba(139, 92, 246, 0.4);
    }

    .provider-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Inline Test Results Chip */
    .test-result-chip {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 500;
      margin-top: 8px;
      line-height: 1.4;
    }
    .test-result-chip.success {
      display: flex;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
    }
    .test-result-chip.error {
      display: flex;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
    }

    /* CV Table */
    .table-wrap {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--card-border);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }

    .data-table th {
      background: rgba(15, 23, 42, 0.9);
      padding: 12px 16px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      white-space: nowrap;
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #e2e8f0;
      vertical-align: middle;
    }

    .data-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    /* Score Badges */
    .score-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 4px 10px;
      border-radius: 6px;
      min-width: 48px;
    }
    .score-high {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .score-mid {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .score-low {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .rec-tag {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .rec-strong {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }
    .rec-hire {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
    }
    .rec-consider {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }
    .rec-reject {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .skill-tag {
      display: inline-block;
      font-size: 0.7rem;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      padding: 1px 6px;
      border-radius: 4px;
      margin: 2px;
    }

    /* Terminal Console */
    .terminal-window {
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .terminal-topbar {
      background: rgba(15, 23, 42, 0.95);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
    }

    .terminal-dots {
      display: flex;
      gap: 6px;
    }

    .terminal-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }

    .terminal-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .terminal-body {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.78rem;
      padding: 16px;
      height: 420px;
      overflow-y: auto;
      color: #cbd5e1;
      line-height: 1.6;
    }

    .log-line {
      display: flex;
      gap: 10px;
      margin-bottom: 4px;
      word-break: break-all;
    }

    .log-time {
      color: var(--text-dim);
      user-select: none;
    }

    .log-level {
      font-weight: 600;
      padding: 0 4px;
      border-radius: 3px;
      user-select: none;
    }
    .log-level.info { color: #38bdf8; }
    .log-level.success { color: #34d399; }
    .log-level.warn { color: #fbbf24; }
    .log-level.error { color: #f87171; }
    .log-level.job { color: #c084fc; font-weight: 700; }

    /* Toast Notification */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast {
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      min-width: 320px;
      animation: slideIn 0.3s ease;
      color: #fff;
      font-size: 0.88rem;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast.success { border-color: rgba(16, 185, 129, 0.4); }
    .toast.error { border-color: rgba(239, 68, 68, 0.4); }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 80;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-backdrop.open {
      display: flex;
    }

    .modal-content {
      background: #0f172a;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      width: 100%;
      max-width: 640px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      animation: modalZoom 0.2s ease;
    }

    @keyframes modalZoom {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--card-border);
      padding: 16px 20px;
      font-size: 0.78rem;
      color: var(--text-dim);
      text-align: center;
      background: rgba(15, 23, 42, 0.5);
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="ambient-glow-2"></div>

  <!-- Header -->
  <header>
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="brand-info">
          <h1>CareerBridge AI Worker <span class="brand-badge">Local On-Premise</span></h1>
          <p id="subWorkerTitle">Đang nạp trạng thái worker...</p>
        </div>
      </div>

      <div class="header-actions">
        <div id="workerStatusBadge" class="status-badge">
          <span class="status-dot"></span>
          <span id="workerStatusText">Đang kết nối...</span>
        </div>

        <button id="btnTogglePause" class="btn btn-secondary" onclick="togglePause()">
          <span id="togglePauseIcon">⏸</span> <span id="togglePauseText">Tạm dừng</span>
        </button>

        <button class="btn btn-secondary" onclick="refreshData()" title="Làm mới dữ liệu">
          🔄 Làm mới
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="container">
    <!-- Quick Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon green">⚡</div>
        <div class="stat-content">
          <div class="stat-label">Trạng Thái Hệ Thống</div>
          <div id="statStateText" class="stat-value">--</div>
          <div id="statUptime" class="stat-sub">Thời gian chạy: --</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <div class="stat-label">Tổng CV Đã Quét</div>
          <div id="statTotalScanned" class="stat-value">0</div>
          <div id="statSuccessRate" class="stat-sub">Thành công: 0 | Thất bại: 0</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">🧠</div>
        <div class="stat-content">
          <div class="stat-label">Động Cơ AI Hoạt Động</div>
          <div id="statAiProvider" class="stat-value">--</div>
          <div id="statAiModel" class="stat-sub">Model: --</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amber">⏱</div>
        <div class="stat-content">
          <div class="stat-label">Tốc Độ Xử Lý TB</div>
          <div id="statAvgDuration" class="stat-value">0s</div>
          <div class="stat-sub">An toàn tuyệt đối, 0 rò rỉ file</div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-header">
      <button class="tab-btn active" onclick="switchTab('configTab')">⚙️ Cấu Hình Nội Bộ</button>
      <button class="tab-btn" onclick="switchTab('historyTab')">📋 Lịch Sử Quét CV (<span id="jobHistoryCount">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('logsTab')">💻 Nhật Ký Trực Tiếp (Console Logs)</button>
    </div>

    <!-- TAB 1: CẤU HÌNH -->
    <div id="configTab" class="tab-pane active">
      <!-- Card: Kết nối CareerBridge -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">1. Kết Nối Máy Chủ CareerBridge</div>
            <div class="panel-desc">Cấu hình kết nối tới hệ thống CareerBridge để nhận tác vụ duyệt CV của công ty bạn</div>
          </div>
          <button type="button" class="btn btn-secondary" onclick="testBackendConnection()">
            ⚡ Kiểm tra kết nối Backend
          </button>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">CareerBridge Backend URL</label>
            <input type="text" id="cfgBackendUrl" class="form-input" placeholder="http://localhost:3000 hoặc domain web">
            <div class="input-hint">Địa chỉ máy chủ CareerBridge (mặc định http://localhost:3000)</div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>Mã Bí Mật Worker Token</span>
              <a href="#" onclick="alert('Đăng nhập vào CareerBridge > Góc Doanh Nghiệp > Quản lý AI Worker > Bấm Tạo Mã Token mới'); return false;" style="color:#60a5fa; text-decoration:none; font-size:0.75rem;">Lấy token ở đâu?</a>
            </label>
            <div class="form-control-wrap">
              <input type="password" id="cfgWorkerToken" class="form-input" placeholder="cwb_sec_..." style="padding-right:70px;">
              <button type="button" class="input-addon-btn" onclick="toggleTokenVisibility()">👁 Hiện</button>
            </div>
            <div class="input-hint">Token bảo mật do Doanh nghiệp tạo (bắt đầu bằng cwb_...)</div>
          </div>

          <div class="form-group">
            <label class="form-label">Tên Định Danh Máy Quét (Worker Name)</label>
            <input type="text" id="cfgWorkerName" class="form-input" placeholder="Company-AI-Worker">
            <div class="input-hint">Giúp bạn nhận biết máy này trên Dashboard quản trị Doanh nghiệp</div>
          </div>
        </div>

        <div id="backendTestResult" class="test-result-chip"></div>
      </div>

      <!-- Card: Lựa chọn Mô hình AI -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">2. Lựa Chọn Động Cơ AI Cục Bộ (Local AI Engine)</div>
            <div class="panel-desc">Toàn bộ dữ liệu CV và phân tích chạy trên máy nội bộ của bạn, không gửi file ra ngoài</div>
          </div>
          <button type="button" class="btn btn-secondary" onclick="testAiConnection()">
            ⚡ Kiểm tra kết nối AI
          </button>
        </div>

        <label class="form-label" style="margin-bottom: 12px;">Chọn công nghệ AI sử dụng:</label>
        <div class="provider-cards">
          <!-- Card 1: Mock Heuristic -->
          <div id="cardMock" class="provider-card" onclick="selectProvider('mock')">
            <div class="provider-card-header">
              <div class="provider-title">🧪 Mock Engine</div>
              <span class="provider-chip recommended">Dùng ngay</span>
            </div>
            <p class="provider-desc">
              Không cần card GPU hay cài đặt AI Server ngoài! Tự động bóc tách từ khóa, năm kinh nghiệm và thang điểm chuẩn hóa nội bộ.
            </p>
          </div>

          <!-- Card 2: Ollama Local -->
          <div id="cardOllama" class="provider-card" onclick="selectProvider('ollama')">
            <div class="provider-card-header">
              <div class="provider-title">🧠 Ollama Local</div>
              <span class="provider-chip">Phổ biến</span>
            </div>
            <p class="provider-desc">
              Chạy trực tiếp qua ứng dụng Ollama trên máy tính. Tối ưu cho mô hình Qwen 2.5 hoặc Llama 3.2. Cổng mặc định 11434.
            </p>
          </div>

          <!-- Card 3: Universal OpenAI-compatible -->
          <div id="cardOpenAi" class="provider-card" onclick="selectProvider('openai-compatible')">
            <div class="provider-card-header">
              <div class="provider-title">🚀 Universal vLLM / OpenAI</div>
              <span class="provider-chip universal">Máy chủ LAN</span>
            </div>
            <p class="provider-desc">
              Chuẩn phổ quát tương thích vLLM, LocalAI, llama.cpp server, hoặc máy chủ AI nội bộ trong mạng LAN công ty bạn.
            </p>
          </div>
        </div>

        <!-- Form fields for AI config -->
        <div class="form-grid" id="aiConfigInputs">
          <div class="form-group">
            <label class="form-label">Địa Chỉ Máy Chủ AI (Base URL)</label>
            <input type="text" id="cfgAiBaseUrl" class="form-input" placeholder="http://localhost:11434">
            <div class="input-hint" id="aiUrlHint">Địa chỉ IP hoặc localhost của AI Server</div>
          </div>

          <div class="form-group">
            <label class="form-label">Tên Mô Hình AI (Model Name)</label>
            <input type="text" id="cfgAiModel" class="form-input" placeholder="qwen2.5:7b">
            <div class="input-hint">Ví dụ: qwen2.5:7b, llama3.2:3b, mistral:7b</div>
          </div>

          <div class="form-group" id="groupApiKey" style="display:none;">
            <label class="form-label">API Key Nội Bộ (Nếu có)</label>
            <input type="password" id="cfgAiApiKey" class="form-input" placeholder="Tùy chọn nếu AI Server yêu cầu mật khẩu">
            <div class="input-hint">Để trống nếu máy chủ không đặt khóa xác thực</div>
          </div>
        </div>

        <div id="aiTestResult" class="test-result-chip"></div>
      </div>

      <!-- Card: Tham số Vận hành & Lưu -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">3. Tham Số Vận Hành & Khởi Chạy</div>
            <div class="panel-desc">Điều chỉnh chu kỳ quét và cổng truy cập Dashboard</div>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom: 24px;">
          <div class="form-group">
            <label class="form-label">Chu kỳ kiểm tra việc mới (Polling - Giây)</label>
            <input type="number" id="cfgPollInterval" class="form-input" value="5" min="1" max="60">
            <div class="input-hint">Thời gian nghỉ giữa các lần kiểm tra hàng đợi (khuyến nghị 3 - 10s)</div>
          </div>

          <div class="form-group">
            <label class="form-label">Chu kỳ báo sống (Heartbeat - Giây)</label>
            <input type="number" id="cfgHeartbeatInterval" class="form-input" value="25" min="5" max="120">
            <div class="input-hint">Báo trạng thái Online cho CareerBridge (mặc định 25s)</div>
          </div>

          <div class="form-group">
            <label class="form-label">Cổng Web Dashboard (Port)</label>
            <input type="number" id="cfgWebPort" class="form-input" value="5050" min="1024" max="65535">
            <div class="input-hint">Cổng truy cập giao diện hiện tại (mặc định 5050)</div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px;">
          <button type="button" class="btn btn-primary" style="padding:12px 28px; font-size:0.95rem;" onclick="saveConfig()">
            💾 Lưu Cấu Hình & Áp Dụng Ngay
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 2: LỊCH SỬ QUÉT CV -->
    <div id="historyTab" class="tab-pane">
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">Lịch Sử Các Lượt Quét CV Gần Đây</div>
            <div class="panel-desc">Kết quả bóc tách và đánh giá của AI được ghi nhận tại đây</div>
          </div>
          <button class="btn btn-secondary" onclick="refreshData()">
            🔄 Cập nhật
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Mã Job</th>
                <th>Vị Trí Thực Tập</th>
                <th>Tên Tệp CV</th>
                <th>Điểm AI</th>
                <th>Khuyến Nghị</th>
                <th>Thời Gian</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody id="jobHistoryTableBody">
              <tr>
                <td colspan="8" style="text-align:center; padding:30px; color:var(--text-dim);">
                  Chưa có lượt quét nào. Khi ứng viên nộp CV, Worker sẽ tự động tải về, quét và hiển thị tại đây!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: CONSOLE LOGS -->
    <div id="logsTab" class="tab-pane">
      <div class="terminal-window">
        <div class="terminal-topbar">
          <div class="terminal-dots">
            <div class="terminal-dot dot-red"></div>
            <div class="terminal-dot dot-yellow"></div>
            <div class="terminal-dot dot-green"></div>
          </div>
          <div class="terminal-title">careerbridge-ai-worker console output</div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="clearLogs()">
              🧹 Xóa log
            </button>
          </div>
        </div>
        <div id="terminalBody" class="terminal-body">
          <div class="log-line">
            <span class="log-time">[Hệ thống]</span>
            <span class="log-level info">INFO</span>
            <span>Đang nạp nhật ký thời gian thực...</span>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Job Details Modal -->
  <div id="jobModal" class="modal-backdrop">
    <div class="modal-content">
      <div class="panel-header">
        <div class="panel-title">Chi Tiết Đánh Giá CV</div>
        <button class="btn btn-secondary" style="padding:4px 10px;" onclick="closeModal()">✕</button>
      </div>
      <div id="modalDetailsBody">
        <!-- Rendered dynamically -->
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div id="toastContainer" class="toast-container"></div>

  <!-- Footer -->
  <footer>
    CareerBridge Enterprise AI Worker Client &bull; Phiên bản 1.0.0 &bull; Dữ liệu bảo mật tuyệt đối tại máy chủ nội bộ Doanh nghiệp
  </footer>

  <script>
    let currentConfig = {};
    let selectedProvider = 'mock';
    let currentJobs = [];
    let isPausedState = false;

    // Toast helper
    function showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.innerHTML = (type === 'success' ? '✔ ' : '✖ ') + message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    // Switch Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    }

    // Select Provider Card
    function selectProvider(provider) {
      selectedProvider = provider;
      document.getElementById('cardMock').classList.toggle('selected', provider === 'mock');
      document.getElementById('cardOllama').classList.toggle('selected', provider === 'ollama');
      document.getElementById('cardOpenAi').classList.toggle('selected', provider === 'openai-compatible');

      const urlInput = document.getElementById('cfgAiBaseUrl');
      const modelInput = document.getElementById('cfgAiModel');
      const apiKeyGroup = document.getElementById('groupApiKey');
      const urlHint = document.getElementById('aiUrlHint');

      if (provider === 'mock') {
        urlInput.value = 'http://localhost';
        urlInput.disabled = true;
        modelInput.value = 'heuristic-keyword-v1';
        modelInput.disabled = true;
        apiKeyGroup.style.display = 'none';
        urlHint.textContent = 'Chế độ Mock tự hoạt động không cần máy chủ AI';
      } else if (provider === 'ollama') {
        urlInput.disabled = false;
        modelInput.disabled = false;
        if (!urlInput.value || urlInput.value.includes('8000') || urlInput.value === 'http://localhost') {
          urlInput.value = 'http://localhost:11434';
        }
        if (!modelInput.value || modelInput.value.includes('heuristic')) {
          modelInput.value = 'qwen2.5:7b';
        }
        apiKeyGroup.style.display = 'none';
        urlHint.textContent = 'Cổng mặc định của Ollama là 11434';
      } else if (provider === 'openai-compatible') {
        urlInput.disabled = false;
        modelInput.disabled = false;
        if (!urlInput.value || urlInput.value.includes('11434') || urlInput.value === 'http://localhost') {
          urlInput.value = 'http://localhost:8000/v1';
        }
        if (!modelInput.value || modelInput.value.includes('heuristic')) {
          modelInput.value = 'qwen2.5:7b';
        }
        apiKeyGroup.style.display = 'flex';
        urlHint.textContent = 'Điền URL vLLM, LocalAI hoặc IP máy chủ mạng LAN (vd: http://192.168.1.50:8000/v1)';
      }
    }

    function toggleTokenVisibility() {
      const input = document.getElementById('cfgWorkerToken');
      const btn = event.currentTarget;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈 Ẩn';
      } else {
        input.type = 'password';
        btn.textContent = '👁 Hiện';
      }
    }

    // Refresh all data
    async function refreshData() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        updateUI(data);
      } catch (err) {
        console.error('Không thể lấy dữ liệu status:', err);
      }
    }

    function updateUI(data) {
      currentConfig = data.config || {};
      isPausedState = data.isPaused;

      // Update badge
      const badge = document.getElementById('workerStatusBadge');
      const badgeText = document.getElementById('workerStatusText');
      const subTitle = document.getElementById('subWorkerTitle');
      const stateText = document.getElementById('statStateText');

      badge.className = 'status-badge';
      if (data.state === 'RUNNING') {
        badge.classList.add('running');
        badgeText.textContent = 'ĐANG CHẠY (ONLINE)';
        stateText.textContent = 'HOẠT ĐỘNG';
        stateText.style.color = '#34d399';
      } else if (data.state === 'PAUSED') {
        badge.classList.add('paused');
        badgeText.textContent = 'TẠM DỪNG (PAUSED)';
        stateText.textContent = 'TẠM DỪNG';
        stateText.style.color = '#fbbf24';
      } else if (data.state === 'CONFIG_PENDING') {
        badge.classList.add('pending');
        badgeText.textContent = 'CHỜ CẤU HÌNH TOKEN';
        stateText.textContent = 'CHƯA CẤU HÌNH';
        stateText.style.color = '#f87171';
      } else {
        badgeText.textContent = data.state;
      }

      subTitle.textContent = 'Doanh nghiệp: ' + (currentConfig.workerName || 'Company') + ' | ' + (currentConfig.backendUrl || '');

      // Pause button text
      const btnToggle = document.getElementById('btnTogglePause');
      const toggleText = document.getElementById('togglePauseText');
      const toggleIcon = document.getElementById('togglePauseIcon');
      if (data.isPaused) {
        btnToggle.className = 'btn btn-success';
        toggleText.textContent = 'Tiếp tục quét';
        toggleIcon.textContent = '▶';
      } else {
        btnToggle.className = 'btn btn-secondary';
        toggleText.textContent = 'Tạm dừng';
        toggleIcon.textContent = '⏸';
      }

      // Stats
      document.getElementById('statUptime').textContent = 'Thời gian chạy: ' + formatUptime(data.uptimeSec);
      document.getElementById('statTotalScanned').textContent = data.stats.totalProcessed || 0;
      document.getElementById('statSuccessRate').textContent = 'Thành công: ' + data.stats.successful + ' | Thất bại: ' + data.stats.failed;
      document.getElementById('statAvgDuration').textContent = (data.stats.avgDurationSec || 0) + 's';

      let provLabel = 'Mock Engine';
      if (currentConfig.provider === 'ollama') provLabel = 'Ollama Local';
      else if (currentConfig.provider === 'openai-compatible') provLabel = 'Universal OpenAI';
      document.getElementById('statAiProvider').textContent = provLabel;
      document.getElementById('statAiModel').textContent = 'Model: ' + (currentConfig.aiModel || 'N/A');

      // Populate config inputs only if not actively editing
      if (!document.getElementById('cfgBackendUrl').matches(':focus')) {
        document.getElementById('cfgBackendUrl').value = currentConfig.backendUrl || '';
      }
      if (!document.getElementById('cfgWorkerToken').matches(':focus') && currentConfig.workerTokenMasked) {
        if (!document.getElementById('cfgWorkerToken').value) {
          document.getElementById('cfgWorkerToken').placeholder = currentConfig.workerTokenMasked;
        }
      }
      if (!document.getElementById('cfgWorkerName').matches(':focus')) {
        document.getElementById('cfgWorkerName').value = currentConfig.workerName || '';
      }
      if (!document.getElementById('cfgPollInterval').matches(':focus')) {
        document.getElementById('cfgPollInterval').value = currentConfig.pollIntervalSec || 5;
      }
      if (!document.getElementById('cfgHeartbeatInterval').matches(':focus')) {
        document.getElementById('cfgHeartbeatInterval').value = currentConfig.heartbeatIntervalSec || 25;
      }
      if (!document.getElementById('cfgWebPort').matches(':focus')) {
        document.getElementById('cfgWebPort').value = currentConfig.webPort || 5050;
      }

      // Select active provider
      if (currentConfig.provider && selectedProvider !== currentConfig.provider) {
        selectProvider(currentConfig.provider);
        if (currentConfig.aiBaseUrl) document.getElementById('cfgAiBaseUrl').value = currentConfig.aiBaseUrl;
        if (currentConfig.aiModel) document.getElementById('cfgAiModel').value = currentConfig.aiModel;
      }

      // Render Job History
      currentJobs = data.recentJobs || [];
      document.getElementById('jobHistoryCount').textContent = currentJobs.length;
      renderJobTable(currentJobs);
    }

    function formatUptime(seconds) {
      if (!seconds) return '0s';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      const h = Math.floor(m / 60);
      if (h > 0) return h + 'h ' + (m % 60) + 'm';
      if (m > 0) return m + 'm ' + s + 's';
      return s + 's';
    }

    function renderJobTable(jobs) {
      const tbody = document.getElementById('jobHistoryTableBody');
      if (!jobs || jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-dim);">Chưa có lượt quét nào. Khi ứng viên nộp CV, Worker sẽ tự động tải về, quét và hiển thị tại đây!</td></tr>';
        return;
      }

      tbody.innerHTML = jobs.map((job, idx) => {
        let scoreHtml = '--';
        let recHtml = '<span class="rec-tag rec-reject">THẤT BẠI</span>';
        if (job.status === 'SUCCESS' && typeof job.aiScore === 'number') {
          let scoreClass = 'score-mid';
          if (job.aiScore >= 80) scoreClass = 'score-high';
          else if (job.aiScore < 60) scoreClass = 'score-low';
          scoreHtml = '<span class="score-badge ' + scoreClass + '">' + job.aiScore + '</span>';

          if (job.recommendation === 'STRONG_HIRE') recHtml = '<span class="rec-tag rec-strong">Ưu tiên cao</span>';
          else if (job.recommendation === 'HIRE') recHtml = '<span class="rec-tag rec-hire">Đạt yêu cầu</span>';
          else if (job.recommendation === 'CONSIDER') recHtml = '<span class="rec-tag rec-consider">Cân nhắc</span>';
          else recHtml = '<span class="rec-tag rec-reject">Không đạt</span>';
        }

        return '<tr>' +
          '<td>' + job.timestamp + '</td>' +
          '<td style="font-family:monospace; color:#94a3b8;">#' + job.jobId.slice(-6) + '</td>' +
          '<td style="font-weight:600;">' + escapeHtml(job.internshipTitle) + '</td>' +
          '<td>' + escapeHtml(job.cvFileName) + '</td>' +
          '<td>' + scoreHtml + '</td>' +
          '<td>' + recHtml + '</td>' +
          '<td>' + job.durationSec + 's</td>' +
          '<td><button class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem;" onclick="viewJobDetail(' + idx + ')">Chi tiết</button></td>' +
          '</tr>';
      }).join('');
    }

    function viewJobDetail(idx) {
      const job = currentJobs[idx];
      if (!job) return;
      const modal = document.getElementById('jobModal');
      const body = document.getElementById('modalDetailsBody');

      let skillsHtml = '';
      if (job.matchedSkills && job.matchedSkills.length > 0) {
        skillsHtml += '<div style="margin-bottom:12px;"><strong style="font-size:0.8rem; color:#34d399;">Kỹ năng khớp:</strong><br/>' +
          job.matchedSkills.map(s => '<span class="skill-tag" style="background:rgba(16,185,129,0.2); color:#34d399;">' + escapeHtml(s) + '</span>').join('') + '</div>';
      }
      if (job.missingSkills && job.missingSkills.length > 0) {
        skillsHtml += '<div style="margin-bottom:12px;"><strong style="font-size:0.8rem; color:#f87171;">Kỹ năng thiếu:</strong><br/>' +
          job.missingSkills.map(s => '<span class="skill-tag" style="background:rgba(239,68,68,0.2); color:#f87171;">' + escapeHtml(s) + '</span>').join('') + '</div>';
      }

      let strengthsHtml = '';
      if (job.strengths && job.strengths.length > 0) {
        strengthsHtml = '<div style="margin-bottom:12px;"><strong style="font-size:0.8rem; color:#38bdf8;">Điểm mạnh nổi bật:</strong><ul style="padding-left:20px; font-size:0.85rem; margin-top:4px; color:#cbd5e1;">' +
          job.strengths.map(s => '<li>' + escapeHtml(s) + '</li>').join('') + '</ul></div>';
      }

      let weaknessesHtml = '';
      if (job.weaknesses && job.weaknesses.length > 0) {
        weaknessesHtml = '<div style="margin-bottom:12px;"><strong style="font-size:0.8rem; color:#fbbf24;">Điểm cần lưu ý:</strong><ul style="padding-left:20px; font-size:0.85rem; margin-top:4px; color:#cbd5e1;">' +
          job.weaknesses.map(w => '<li>' + escapeHtml(w) + '</li>').join('') + '</ul></div>';
      }

      body.innerHTML = '<div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
          '<div>' +
            '<h3 style="color:#fff; font-size:1.05rem;">' + escapeHtml(job.internshipTitle) + '</h3>' +
            '<p style="font-size:0.8rem; color:#94a3b8;">Tệp: ' + escapeHtml(job.cvFileName) + ' &bull; Lần quét lúc ' + job.timestamp + '</p>' +
          '</div>' +
          (typeof job.aiScore === 'number' ? '<div class="score-badge score-high" style="font-size:1.1rem; padding:6px 14px;">' + job.aiScore + '/100</div>' : '') +
        '</div>' +
        (job.summary ? '<div style="background:rgba(255,255,255,0.03); border:1px solid var(--card-border); padding:12px; border-radius:8px; margin-bottom:14px; font-size:0.85rem; color:#e2e8f0; line-height:1.5;">' + escapeHtml(job.summary) + '</div>' : '') +
        skillsHtml +
        strengthsHtml +
        weaknessesHtml +
        (job.errorMessage ? '<div style="color:#f87171; background:rgba(239,68,68,0.1); padding:10px; border-radius:6px; font-size:0.85rem;">' + escapeHtml(job.errorMessage) + '</div>' : '') +
        '</div>';

      modal.classList.add('open');
    }

    function closeModal() {
      document.getElementById('jobModal').classList.remove('open');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }

    // Toggle Pause
    async function togglePause() {
      const nextAction = isPausedState ? 'resume' : 'pause';
      try {
        const res = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: nextAction }),
        });
        const data = await res.json();
        updateUI(data);
        showToast(nextAction === 'pause' ? 'Đã tạm dừng lắng nghe CV' : 'Đã tiếp tục lắng nghe CV từ hàng đợi!');
      } catch (err) {
        showToast('Lỗi khi điều khiển worker: ' + err.message, 'error');
      }
    }

    // Test Backend Connection
    async function testBackendConnection() {
      const btn = event.currentTarget;
      const chip = document.getElementById('backendTestResult');
      const backendUrl = document.getElementById('cfgBackendUrl').value.trim() || currentConfig.backendUrl;
      const workerToken = document.getElementById('cfgWorkerToken').value.trim() || currentConfig.workerToken;

      chip.className = 'test-result-chip';
      chip.textContent = 'Đang kiểm tra kết nối tới Backend...';
      chip.style.display = 'flex';

      try {
        const res = await fetch('/api/test-backend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backendUrl, workerToken }),
        });
        const result = await res.json();
        if (result.success) {
          chip.className = 'test-result-chip success';
          chip.innerHTML = '✔ ' + result.message + ' (' + result.latencyMs + 'ms)';
          showToast('Kết nối CareerBridge Backend thành công!');
        } else {
          chip.className = 'test-result-chip error';
          chip.innerHTML = '✖ ' + result.message;
          showToast('Kiểm tra Backend thất bại: ' + result.message, 'error');
        }
      } catch (err) {
        chip.className = 'test-result-chip error';
        chip.innerHTML = '✖ Lỗi mạng: ' + err.message;
      }
    }

    // Test AI Connection
    async function testAiConnection() {
      const chip = document.getElementById('aiTestResult');
      const aiBaseUrl = document.getElementById('cfgAiBaseUrl').value.trim();
      const aiModel = document.getElementById('cfgAiModel').value.trim();
      const aiApiKey = document.getElementById('cfgAiApiKey')?.value.trim();

      chip.className = 'test-result-chip';
      chip.textContent = 'Đang ping máy chủ AI nội bộ (' + selectedProvider + ')...';
      chip.style.display = 'flex';

      try {
        const res = await fetch('/api/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider,
            aiBaseUrl,
            aiModel,
            aiApiKey,
          }),
        });
        const result = await res.json();
        if (result.success) {
          chip.className = 'test-result-chip success';
          chip.innerHTML = '✔ ' + result.message + ' (' + result.latencyMs + 'ms)';
          showToast('Kết nối động cơ AI thành công!');
        } else {
          chip.className = 'test-result-chip error';
          chip.innerHTML = '✖ ' + result.message;
          showToast('Kiểm tra AI thất bại: ' + result.message, 'error');
        }
      } catch (err) {
        chip.className = 'test-result-chip error';
        chip.innerHTML = '✖ Lỗi mạng: ' + err.message;
      }
    }

    // Save Config
    async function saveConfig() {
      const payload = {
        backendUrl: document.getElementById('cfgBackendUrl').value.trim(),
        workerToken: document.getElementById('cfgWorkerToken').value.trim() || undefined,
        workerName: document.getElementById('cfgWorkerName').value.trim(),
        provider: selectedProvider,
        aiBaseUrl: document.getElementById('cfgAiBaseUrl').value.trim(),
        aiModel: document.getElementById('cfgAiModel').value.trim(),
        aiApiKey: document.getElementById('cfgAiApiKey')?.value.trim() || undefined,
        pollIntervalSec: parseInt(document.getElementById('cfgPollInterval').value, 10),
        heartbeatIntervalSec: parseInt(document.getElementById('cfgHeartbeatInterval').value, 10),
        webPort: parseInt(document.getElementById('cfgWebPort').value, 10),
      };

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        updateUI(data);
        showToast('Cấu hình đã được lưu và cập nhật trực tiếp thành công!');
      } catch (err) {
        showToast('Lỗi khi lưu cấu hình: ' + err.message, 'error');
      }
    }

    // Fetch live logs
    async function fetchLogs() {
      try {
        const res = await fetch('/api/logs');
        const logs = await res.json();
        const body = document.getElementById('terminalBody');
        if (!logs || logs.length === 0) return;

        body.innerHTML = logs.map(l => {
          return '<div class="log-line">' +
            '<span class="log-time">[' + l.timestamp + ']</span>' +
            '<span class="log-level ' + l.level + '">' + l.level.toUpperCase() + '</span>' +
            '<span>' + escapeHtml(l.message) + '</span>' +
            '</div>';
        }).join('');
        body.scrollTop = body.scrollHeight;
      } catch (e) {
        // silent
      }
    }

    async function clearLogs() {
      await fetch('/api/logs/clear', { method: 'POST' });
      document.getElementById('terminalBody').innerHTML = '';
      showToast('Đã xóa bộ nhớ log');
    }

    // Polling timer
    refreshData();
    setInterval(refreshData, 3000);
    setInterval(fetchLogs, 2500);
  </script>
</body>
</html>`;
}
