const Sidebar = {
  props: ['page', 'user'],
  emits: ['navigate'],
  template: `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="fa-solid fa-bolt"></i></div>
      <span class="logo-text">HNF CRM</span>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      <div class="nav-item" :class="{active:page==='dashboard'}" @click="$emit('navigate','dashboard')"><i class="fa-solid fa-chart-pie"></i> Dashboard</div>
      <div class="nav-item" :class="{active:page==='customers'}" @click="$emit('navigate','customers')"><i class="fa-solid fa-users"></i> Customers <span class="nav-badge">8</span></div>
      <div class="nav-item" :class="{active:page==='tasks'}" @click="$emit('navigate','tasks')"><i class="fa-solid fa-list-check"></i> Tasks <span class="nav-badge">5</span></div>
      <div class="nav-item" :class="{active:page==='schedule'}" @click="$emit('navigate','schedule')"><i class="fa-solid fa-chart-gantt"></i> Schedule</div>
      <div class="nav-section-label">Team</div>
      <div class="nav-item" :class="{active:page==='employees'}" @click="$emit('navigate','employees')"><i class="fa-solid fa-user-tie"></i> Employees</div>
      <div class="nav-section-label">System</div>
      <div class="nav-item" :class="{active:page==='settings'}" @click="$emit('navigate','settings')"><i class="fa-solid fa-gear"></i> Settings</div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-card" @click="$emit('navigate','settings')" title="Click to view Settings">
        <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">{{user ? user.initials : 'AD'}}</div>
        <div style="overflow:hidden">
          <div class="user-name" style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden">{{user ? user.name : 'Admin User'}}</div>
          <div class="user-role">{{user ? user.role : 'Super Admin'}}</div>
        </div>
      </div>
    </div>
  </aside>`
};

const Topbar = {
  props: ['title', 'subtitle', 'currentRole', 'systemRoles'],
  emits: ['logout', 'navigate', 'change-role'],
  template: `
  <header class="topbar">
    <div class="topbar-left">
      <h1>{{title}}</h1>
      <p v-if="subtitle">{{subtitle}}</p>
    </div>
    <div class="topbar-right" style="display:flex;align-items:center;gap:12px">
      <div style="display:flex;align-items:center;gap:6px;background:var(--glass);padding:6px 12px;border-radius:8px;border:1px solid var(--glass-border)">
        <i class="fa-solid fa-user-shield" style="color:var(--accent);font-size:14px"></i>
        <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">Role:</span>
        <select :value="currentRole" @change="$emit('change-role', $event.target.value)" style="background:transparent;border:none;color:var(--text-primary);font-size:12px;font-weight:700;cursor:pointer;outline:none">
          <option v-for="r in (systemRoles || [])" :key="r" :value="r" style="background:#1e1e2d;color:#fff">{{r}}</option>
        </select>
      </div>
      <div class="topbar-btn" @click="$emit('navigate','settings')" title="Settings"><i class="fa-solid fa-gear"></i></div>
      <div class="topbar-btn" title="Notifications"><i class="fa-solid fa-bell"></i></div>
      <div class="topbar-btn" @click="$emit('logout')" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></div>
    </div>
  </header>`
};


