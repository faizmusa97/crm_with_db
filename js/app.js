const { createApp, ref, computed, onMounted } = Vue;

createApp({
  components: { Sidebar, Topbar },
  setup() {
    // API Helper: POST request handler
    async function apiCall(action, payload = {}) {
      try {
        const userRole = userProfile ? (userProfile.value ? userProfile.value.role : 'HOD IT') : 'HOD IT';
        const apiUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'api/index.php';
        const res = await axios.post(apiUrl, { action, userRole, ...payload });
        return res.data;
      } catch (err) {
        console.warn('PHP API Call Notice (fallback active):', err.message);
        return null;
      }
    }



    const customersList = ref([...customers]);
    const employeesList = ref([...employees]);
    const tasksList = ref([...tasks]);
    const ordersList = ref([...orders]);
    const activitiesList = ref([...activities]);

    const isLoggedIn = ref(false);
    const page = ref('dashboard');
    const selectedCustomer = ref(null);
    const showTaskModal = ref(false);
    const showCustomerModal = ref(false);
    const editingCustomer = ref(null);
    const selectedEmployee = ref(null);
    const showEmployeeModal = ref(false);
    const editingEmployee = ref(null);
    const emptyEmployee = () => ({ name:'', email:'', phone:'', role:'Account Executive', dept:'Sales', accessLevel:'Standard', status:'active', password:'password123', deals:0, revenue:0 });
    const employeeForm = ref(emptyEmployee());
    const selectedTask = ref(null);
    const showTaskDetailModal = ref(false);
    const taskEditMode = ref(false);
    const taskEditForm = ref({});
    const customerTab = ref('overview');
    const showOrderModal = ref(false);
    const orderForm = ref({ type:'request', title:'', desc:'', amount:0, assignee:'' });
    const showQuotationModal = ref(false);
    const quotationOrder = ref(null);
    const searchQ = ref('');
    const empSearch = ref('');
    const taskFilter = ref('all');

    const loginForm = ref({ email: 'admin@hnfcrm.com', password: '', remember: false });
    const loginError = ref('');
    const taskForm = ref({ title:'', desc:'', priority:'medium', assignee:'', due:'', type:'Task', customer:'' });

    const emptyCustomer = () => ({ name:'', email:'', phone:'', company:'', status:'prospect', value:0, deal:'', owner:'', city:'', country:'', industry:'', notes:'' });
    const customerForm = ref(emptyCustomer());

    async function doLogin() {
      if (!loginForm.value.email || !loginForm.value.password) { loginError.value = 'Please fill all fields.'; return; }
      const res = await apiCall('login', { email: loginForm.value.email, password: loginForm.value.password });
      if (res && res.status === 'error') {
        loginError.value = res.message;
        return;
      }
      isLoggedIn.value = true;
    }

    const userProfile = ref({
      name: 'Admin User',
      email: 'admin@hnfcrm.com',
      phone: '+1 (555) 234-5678',
      role: 'Super Admin',
      department: 'Management',
      initials: 'AD',
      bio: 'Lead Administrator of HNF CRM System.'
    });
    const profileForm = ref({ ...userProfile.value });
    const profileSuccessMsg = ref('');

    async function loadInitialData() {
      const res = await apiCall('get_initial_data');
      if (res && res.status === 'success' && res.data) {
        if (res.data.customers && res.data.customers.length) customersList.value = res.data.customers;
        if (res.data.employees && res.data.employees.length) employeesList.value = res.data.employees;
        if (res.data.tasks && res.data.tasks.length) tasksList.value = res.data.tasks;
        if (res.data.orders && res.data.orders.length) ordersList.value = res.data.orders;
        if (res.data.activities && res.data.activities.length) activitiesList.value = res.data.activities;
        if (res.data.userProfile) {
          userProfile.value = { ...userProfile.value, ...res.data.userProfile };
          profileForm.value = { ...userProfile.value };
        }
      }
    }
    onMounted(loadInitialData);

    async function saveProfile() {
      if (!profileForm.value.name || !profileForm.value.email) return;
      const res = await apiCall('save_profile', profileForm.value);
      if (res && res.status === 'success' && res.data) {
        userProfile.value = res.data;
      } else {
        const parts = profileForm.value.name.trim().split(' ');
        const init = parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : parts[0].slice(0,2).toUpperCase();
        userProfile.value = { ...profileForm.value, initials: init };
      }
      profileSuccessMsg.value = 'Profile updated successfully!';
      setTimeout(() => { profileSuccessMsg.value = ''; }, 3000);
    }

    const currentTheme = ref(localStorage.getItem('crm_theme') || 'dark');
    function switchTheme(t) {
      currentTheme.value = t;
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('crm_theme', t);
    }
    document.documentElement.setAttribute('data-theme', currentTheme.value);

    const pageInfo = computed(() => {
      const map = {
        dashboard: { title: 'Dashboard', subtitle: 'Welcome back, ' + userProfile.value.name + '! Here\'s your overview.' },
        customers: { title: 'Customers', subtitle: 'Manage your customer relationships.' },
        customer_detail: { title: selectedCustomer.value?.name || 'Customer Detail', subtitle: selectedCustomer.value?.company },
        tasks: { title: 'Tasks', subtitle: 'Track and manage task requests.' },
        schedule: { title: 'Schedule & Timeline', subtitle: 'Gantt chart timeline view of pending, in-progress, and completed tasks.' },
        employees: { title: 'Employees', subtitle: 'Manage your team members.' },
        employee_detail: { title: selectedEmployee.value?.name || 'Employee Detail', subtitle: selectedEmployee.value ? (selectedEmployee.value.role + ' · ' + selectedEmployee.value.dept) : '' },
        settings: { title: 'Settings', subtitle: 'Manage your profile and application theme preferences.' },
      };
      return map[page.value] || { title: 'HNF CRM', subtitle: '' };
    });

    function viewCustomer(c) { selectedCustomer.value = c; page.value = 'customer_detail'; customerTab.value = 'overview'; }

    const customerOrders = computed(() =>
      selectedCustomer.value ? ordersList.value.filter(o => o.customerId === selectedCustomer.value.id) : []
    );

    async function addOrder() {
      if (!orderForm.value.title) return;
      const payload = {
        customerId: selectedCustomer.value.id,
        customerName: selectedCustomer.value.name,
        ...orderForm.value
      };
      const res = await apiCall('save_order', payload);
      if (res && res.status === 'success' && res.data) {
        ordersList.value.unshift(res.data);
      } else {
        const newO = {
          id: Date.now(),
          customerId: selectedCustomer.value.id,
          customerName: selectedCustomer.value.name,
          type: orderForm.value.type,
          title: orderForm.value.title,
          desc: orderForm.value.desc,
          status: 'pending',
          amount: orderForm.value.type === 'bug' ? 0 : Number(orderForm.value.amount),
          date: new Date().toISOString().slice(0,10),
          quotationNo: orderForm.value.type === 'request' ? 'QT-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-3) : null,
          assignee: orderForm.value.assignee,
        };
        ordersList.value.unshift(newO);
      }
      orderForm.value = { type:'request', title:'', desc:'', amount:0, assignee:'' };
      showOrderModal.value = false;
    }

    function openQuotation(o) { quotationOrder.value = o; showQuotationModal.value = true; }

    function printQuotation() {
      const el = document.getElementById('quotation-print');
      const w = window.open('','_blank');
      w.document.write('<html><head><title>Quotation</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{color:#6366f1}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}.total{font-size:18px;font-weight:bold;color:#6366f1}.footer{margin-top:40px;font-size:12px;color:#888}</style></head><body>' + el.innerHTML + '</body></html>');
      w.document.close(); w.focus(); w.print(); w.close();
    }

    function viewEmployee(e) { selectedEmployee.value = e; page.value = 'employee_detail'; }

    function openAddEmployee() {
      editingEmployee.value = null;
      employeeForm.value = emptyEmployee();
      showEmployeeModal.value = true;
    }

    function openEditEmployee() {
      editingEmployee.value = selectedEmployee.value;
      employeeForm.value = { accessLevel: 'Standard', password: '', ...selectedEmployee.value };
      showEmployeeModal.value = true;
    }

    async function saveEmployee() {
      if (!employeeForm.value.name || !employeeForm.value.email) return;
      const payload = editingEmployee.value ? { id: editingEmployee.value.id, ...employeeForm.value } : { ...employeeForm.value };
      const res = await apiCall('save_employee', payload);
      if (res && res.status === 'success' && res.data) {
        if (editingEmployee.value) {
          const idx = employeesList.value.findIndex(e => e.id === editingEmployee.value.id);
          if (idx !== -1) employeesList.value.splice(idx, 1, res.data);
          selectedEmployee.value = res.data;
        } else {
          employeesList.value.unshift(res.data);
          activitiesList.value.unshift({
            id: Date.now(),
            text: `New employee account created: ${res.data.name} (${res.data.role})`,
            time: 'Just now',
            color: '#6366f1',
            icon: 'fa-user-plus'
          });
        }
      } else {
        if (editingEmployee.value) {
          const idx = employeesList.value.findIndex(e => e.id === editingEmployee.value.id);
          if (idx !== -1) { employeesList.value.splice(idx, 1, { ...editingEmployee.value, ...employeeForm.value }); selectedEmployee.value = employeesList.value[idx]; }
        } else {
          const newE = { id: Date.now(), joined: new Date().toISOString().slice(0,10), deals: Number(employeeForm.value.deals)||0, revenue: Number(employeeForm.value.revenue)||0, tasks: 0, ...employeeForm.value };
          employeesList.value.unshift(newE);
          activitiesList.value.unshift({ id: Date.now(), text: `New employee account created: ${newE.name} (${newE.role})`, time: 'Just now', color: '#6366f1', icon: 'fa-user-plus' });
        }
      }
      showEmployeeModal.value = false;
    }

    function openAddCustomer() {
      editingCustomer.value = null;
      customerForm.value = emptyCustomer();
      showCustomerModal.value = true;
    }

    function openEditCustomer() {
      editingCustomer.value = selectedCustomer.value;
      customerForm.value = { ...selectedCustomer.value };
      showCustomerModal.value = true;
    }

    async function saveCustomer() {
      if (!customerForm.value.name || !customerForm.value.email) return;
      const payload = editingCustomer.value ? { id: editingCustomer.value.id, ...customerForm.value } : { ...customerForm.value };
      const res = await apiCall('save_customer', payload);
      if (res && res.status === 'success' && res.data) {
        if (editingCustomer.value) {
          const idx = customersList.value.findIndex(c => c.id === editingCustomer.value.id);
          if (idx !== -1) customersList.value.splice(idx, 1, res.data);
          selectedCustomer.value = res.data;
        } else {
          customersList.value.unshift(res.data);
        }
      } else {
        if (editingCustomer.value) {
          const idx = customersList.value.findIndex(c => c.id === editingCustomer.value.id);
          if (idx !== -1) { customersList.value.splice(idx, 1, { ...editingCustomer.value, ...customerForm.value }); selectedCustomer.value = customersList.value[idx]; }
        } else {
          const newC = { id: Date.now(), joined: new Date().toISOString().slice(0,10), ...customerForm.value };
          customersList.value.unshift(newC);
        }
      }
      showCustomerModal.value = false;
    }

    const filteredCustomers = computed(() =>
      customersList.value.filter(c => !searchQ.value || c.name.toLowerCase().includes(searchQ.value.toLowerCase()) || c.company.toLowerCase().includes(searchQ.value.toLowerCase()))
    );

    const filteredEmployees = computed(() =>
      employeesList.value.filter(e => !empSearch.value || e.name.toLowerCase().includes(empSearch.value.toLowerCase()) || e.dept.toLowerCase().includes(empSearch.value.toLowerCase()))
    );

    const taskCols = computed(() => ({
      todo: tasksList.value.filter(t => t.status === 'todo' && (taskFilter.value === 'all' || t.priority === taskFilter.value)),
      'in-progress': tasksList.value.filter(t => t.status === 'in-progress' && (taskFilter.value === 'all' || t.priority === taskFilter.value)),
      done: tasksList.value.filter(t => t.status === 'done' && (taskFilter.value === 'all' || t.priority === taskFilter.value)),
    }));

    async function addTask() {
      if (!taskForm.value.title) return;
      const res = await apiCall('save_task', taskForm.value);
      if (res && res.status === 'success' && res.data) {
        tasksList.value.unshift(res.data);
      } else {
        tasksList.value.unshift({ id: Date.now(), ...taskForm.value, status: 'todo' });
      }
      taskForm.value = { title:'', desc:'', priority:'medium', assignee:'', due:'', type:'Task', customer:'' };
      showTaskModal.value = false;
    }

    function viewTask(t) {
      selectedTask.value = t;
      taskEditMode.value = false;
      taskEditForm.value = { ...t };
      showTaskDetailModal.value = true;
    }

    async function saveTaskEdit() {
      if (!taskEditForm.value.title) return;
      const payload = { id: selectedTask.value.id, ...taskEditForm.value };
      const res = await apiCall('save_task', payload);
      if (res && res.status === 'success' && res.data) {
        const idx = tasksList.value.findIndex(t => t.id === selectedTask.value.id);
        if (idx !== -1) tasksList.value.splice(idx, 1, res.data);
        selectedTask.value = res.data;
      } else {
        const idx = tasksList.value.findIndex(t => t.id === selectedTask.value.id);
        if (idx !== -1) { tasksList.value.splice(idx, 1, { ...selectedTask.value, ...taskEditForm.value }); selectedTask.value = tasksList.value[idx]; }
      }
      taskEditMode.value = false;
    }

    function safeInitials(name) { return name ? initials(name) : '?'; }
    function safeColor(name) { const idx = employeesList.value.findIndex(e => e.name === name); return getColor(idx >= 0 ? idx : 0); }

    function priorityBadge(p) {
      return p === 'high' ? 'badge-danger' : p === 'medium' ? 'badge-warning' : 'badge-secondary';
    }
    function statusBadge(s) {
      return s === 'active' ? 'badge-success' : s === 'prospect' ? 'badge-info' : s === 'inactive' ? 'badge-danger' : 'badge-warning';
    }
    function fmtVal(v) { return v >= 1000 ? '$' + (v/1000).toFixed(1) + 'k' : '$' + v; }

    const totalRevenue = computed(() => customersList.value.reduce((a,c) => a + c.value, 0));
    const activeCount = computed(() => customersList.value.filter(c => c.status === 'active').length);
    const openTasks = computed(() => tasksList.value.filter(t => t.status !== 'done').length);

    // Schedule & Gantt chart state
    const schedStatus = ref('all');
    const schedPriority = ref('all');
    const schedSearch = ref('');
    const ganttStartDate = new Date('2026-07-12');
    const ganttTotalDays = 20;

    const ganttDates = computed(() => {
      const dates = [];
      const daysName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const todayStr = '2026-07-22';
      for (let i = 0; i < ganttTotalDays; i++) {
        const d = new Date(ganttStartDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = daysName[d.getDay()];
        const dayNum = d.getDate();
        const isToday = dateStr === todayStr;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        dates.push({ dateStr, dayName, dayNum, isToday, isWeekend, index: i });
      }
      return dates;
    });

    const filteredSchedTasks = computed(() => {
      return tasksList.value.filter(t => {
        const matchStatus = schedStatus.value === 'all' || t.status === schedStatus.value;
        const matchPriority = schedPriority.value === 'all' || t.priority === schedPriority.value;
        const matchQ = !schedSearch.value || t.title.toLowerCase().includes(schedSearch.value.toLowerCase()) || (t.assignee && t.assignee.toLowerCase().includes(schedSearch.value.toLowerCase()));
        return matchStatus && matchPriority && matchQ;
      });
    });

    function getGanttBarStyle(t) {
      const start = new Date(t.startDate || t.due);
      const end = new Date(t.due);
      const diffStart = Math.max(0, Math.round((start - ganttStartDate) / (1000 * 60 * 60 * 24)));
      const duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      const cellWidth = 52;
      return {
        left: (diffStart * cellWidth) + 'px',
        width: (duration * cellWidth) + 'px'
      };
    }

    const schedTodoCount = computed(() => tasksList.value.filter(t => t.status === 'todo').length);
    const schedInProgressCount = computed(() => tasksList.value.filter(t => t.status === 'in-progress').length);
    const schedDoneCount = computed(() => tasksList.value.filter(t => t.status === 'done').length);
    const schedCompletionRate = computed(() => Math.round((schedDoneCount.value / (tasksList.value.length || 1)) * 100));

    const systemRoles = ref(typeof SYSTEM_ROLES !== 'undefined' ? SYSTEM_ROLES : ['HOD IT', 'Software Developer', 'IT Support', 'Technical Support', 'System Analysis', 'Devops', 'Finance', 'Marketing']);
    const currentRole = computed(() => userProfile.value ? userProfile.value.role : 'HOD IT');

    function can(perm) {
      const role = userProfile.value ? userProfile.value.role : 'HOD IT';
      const perms = (typeof ROLE_PERMISSIONS !== 'undefined' && ROLE_PERMISSIONS[role]) ? ROLE_PERMISSIONS[role] : { view_sales: true, add_edit_customer: true, add_edit_task: true, add_edit_employee: true, view_employees: true };
      return !!perms[perm];
    }

    function switchRole(r) {
      if (userProfile.value) {
        userProfile.value.role = r;
        profileForm.value.role = r;
      }
    }

    function fileIcon(name = '', type = '') {
      const ext = name.split('.').pop().toLowerCase();
      if (['jpg','jpeg','png','gif','webp'].includes(ext) || type.includes('image')) return 'fa-file-image';
      if (ext === 'pdf' || type.includes('pdf')) return 'fa-file-pdf';
      if (['doc','docx'].includes(ext) || type.includes('word')) return 'fa-file-word';
      return 'fa-file-lines';
    }

    function fmtFileSize(bytes = 0) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    const uploadingFile = ref(false);

    async function handleFileUpload(e, targetTask) {
      const files = e.target.files;
      if (!files || !files.length) return;
      uploadingFile.value = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const fileData = evt.target.result;
          const payload = {
            taskId: targetTask ? targetTask.id : 0,
            fileName: file.name,
            fileType: file.type,
            fileData: fileData
          };

          const res = await apiCall('upload_attachment', payload);
          let newAtt;
          if (res && res.status === 'success' && res.data) {
            newAtt = res.data;
          } else {
            newAtt = {
              id: Date.now() + i,
              task_id: targetTask ? targetTask.id : 0,
              file_name: file.name,
              original_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_path: fileData,
              created_at: new Date().toISOString().replace('T',' ').slice(0,19)
            };
          }

          if (targetTask) {
            if (!targetTask.attachments) targetTask.attachments = [];
            targetTask.attachments.push(newAtt);
          }
        };
        reader.readAsDataURL(file);
      }
      uploadingFile.value = false;
      e.target.value = '';
    }

    async function removeAttachment(att, targetTask) {
      if (!confirm('Are you sure you want to delete this attachment?')) return;
      await apiCall('delete_attachment', { id: att.id });
      if (targetTask && targetTask.attachments) {
        targetTask.attachments = targetTask.attachments.filter(a => a.id !== att.id);
      }
    }

    function downloadAttachment(att) {
      const link = document.createElement('a');
      link.href = att.file_path;
      link.download = att.original_name || att.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }


    return {
      isLoggedIn, page, selectedCustomer, showTaskModal,
      showCustomerModal, editingCustomer, customerForm,
      selectedEmployee, showEmployeeModal, editingEmployee, employeeForm,
      selectedTask, showTaskDetailModal, taskEditMode, taskEditForm,
      customerTab, showOrderModal, orderForm, showQuotationModal, quotationOrder,
      userProfile, profileForm, profileSuccessMsg, saveProfile,
      currentTheme, switchTheme,
      searchQ, empSearch, taskFilter, loginForm, loginError, taskForm,
      schedStatus, schedPriority, schedSearch, ganttDates, filteredSchedTasks, getGanttBarStyle,
      schedTodoCount, schedInProgressCount, schedDoneCount, schedCompletionRate,
      pageInfo, filteredCustomers, filteredEmployees, taskCols, customerOrders,
      doLogin, viewCustomer, addTask, priorityBadge, statusBadge, fmtVal,
      openAddCustomer, openEditCustomer, saveCustomer,
      viewEmployee, openAddEmployee, openEditEmployee, saveEmployee,
      viewTask, saveTaskEdit,
      addOrder, openQuotation, printQuotation,
      safeInitials, safeColor,
      totalRevenue, activeCount, openTasks,
      customers: customersList, employees: employeesList, tasks: tasksList, orders: ordersList, activities: activitiesList, chartData,
      getColor, initials,
      systemRoles, currentRole, can, switchRole,
      fileIcon, fmtFileSize, uploadingFile, handleFileUpload, removeAttachment, downloadAttachment
    };

  },
  template: `
  <!-- LOGIN -->
  <div v-if="!isLoggedIn" class="login-page">
    <div class="login-card fade-in">
      <div class="login-logo">
        <div class="logo-icon" style="width:52px;height:52px;font-size:22px;border-radius:14px"><i class="fa-solid fa-bolt"></i></div>
      </div>
      <h2 class="login-title">Welcome back</h2>
      <p class="login-sub">Sign in to your HNF CRM account</p>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <div class="input-icon"><i class="fa-solid fa-envelope"></i><input class="form-control" type="email" v-model="loginForm.email" placeholder="you@company.com" /></div>
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <div class="input-icon"><i class="fa-solid fa-lock"></i><input class="form-control" type="password" v-model="loginForm.password" placeholder="Enter password (admin123)" @keyup.enter="doLogin" /></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <label class="checkbox-row"><input type="checkbox" v-model="loginForm.remember" /> Remember me</label>
        <a href="#" style="font-size:13px;color:var(--accent)">Forgot password?</a>
      </div>
      <div v-if="loginError" style="color:var(--danger);font-size:13px;margin-bottom:12px;padding:10px;background:rgba(239,68,68,0.1);border-radius:8px"><i class="fa-solid fa-circle-exclamation"></i> {{loginError}}</div>
      <button class="btn btn-primary login-btn" @click="doLogin"><i class="fa-solid fa-right-to-bracket"></i> Sign In</button>
      <p style="text-align:center;margin-top:20px;font-size:12px;color:var(--text-muted)">Hint: password is <strong style="color:var(--text-secondary)">admin123</strong></p>
    </div>
  </div>

  <!-- MAIN APP -->
  <div v-else class="layout">
    <Sidebar :page="page" :user="userProfile" @navigate="p => { page = p; selectedCustomer = null; selectedEmployee = null; }" />
    <div class="main-content">
      <Topbar :title="pageInfo.title" :subtitle="pageInfo.subtitle" :current-role="currentRole" :system-roles="systemRoles" @logout="isLoggedIn = false" @navigate="p => { page = p; selectedCustomer = null; selectedEmployee = null; }" @change-role="switchRole" />
      <div class="page-wrapper fade-in">


        <!-- DASHBOARD -->
        <div v-if="page === 'dashboard'">
          <div class="stats-grid">
            <div v-if="can('view_sales')" class="stat-card indigo">
              <div class="stat-icon indigo"><i class="fa-solid fa-dollar-sign"></i></div>
              <div class="stat-value">\${{(totalRevenue/1000).toFixed(0)}}k</div>
              <div class="stat-label">Total Revenue</div>
              <div class="stat-change up"><i class="fa-solid fa-arrow-trend-up"></i> +18.2% this month</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-icon purple"><i class="fa-solid fa-users"></i></div>
              <div class="stat-value">{{customers.length}}</div>
              <div class="stat-label">Total Customers</div>
              <div class="stat-change up"><i class="fa-solid fa-arrow-trend-up"></i> +3 this week</div>
            </div>
            <div class="stat-card cyan">
              <div class="stat-icon cyan"><i class="fa-solid fa-list-check"></i></div>
              <div class="stat-value">{{openTasks}}</div>
              <div class="stat-label">Open Tasks</div>
              <div class="stat-change down"><i class="fa-solid fa-arrow-trend-down"></i> 2 overdue</div>
            </div>
            <div class="stat-card green">
              <div class="stat-icon green"><i class="fa-solid fa-user-check"></i></div>
              <div class="stat-value">{{activeCount}}</div>
              <div class="stat-label">Active Clients</div>
              <div class="stat-change up"><i class="fa-solid fa-arrow-trend-up"></i> 75% retention</div>
            </div>
          </div>

          <div class="grid-2">
            <div v-if="can('view_sales')" class="card">
              <div class="card-header">
                <div><div class="card-title">Revenue Trend</div><div class="card-subtitle">Last 12 months performance</div></div>
                <span class="badge badge-success">+18.2%</span>
              </div>
              <div class="mini-chart" style="height:80px;align-items:flex-end;gap:6px">
                <div v-for="(v,i) in chartData" :key="i" class="mini-bar"
                  :style="{height:v+'%',background:'linear-gradient(180deg,#6366f1,#8b5cf6)',opacity: i===chartData.length-1?1:0.55,borderRadius:'5px 5px 0 0',flex:1}"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:10px">
                <span v-for="m in ['Jan','Mar','May','Jul','Sep','Nov']" :key="m" style="font-size:11px;color:var(--text-muted)">{{m}}</span>
              </div>
            </div>

            <div class="card" :style="{gridColumn: can('view_sales') ? 'auto' : 'span 2'}">
              <div class="card-header"><div class="card-title">Recent Activity</div></div>
              <div class="activity-item" v-for="a in activities" :key="a.id">
                <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0" :style="{background:a.color+'22'}">
                  <i :class="'fa-solid '+a.icon" :style="{color:a.color,fontSize:'13px'}"></i>
                </div>
                <div>
                  <div style="font-size:13px;color:var(--text-primary)">{{a.text}}</div>
                  <div class="activity-time">{{a.time}}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card mt-6">
            <div class="card-header">
              <div class="card-title">Top Customers</div>
              <button class="btn btn-ghost btn-sm" @click="page='customers'">View All <i class="fa-solid fa-arrow-right"></i></button>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Customer</th><th>Company</th><th>Status</th><th v-if="can('view_sales')">Deal Value</th><th>Owner</th></tr></thead>
                <tbody>
                  <tr v-for="c in customers.slice(0,5)" :key="c.id" style="cursor:pointer" @click="viewCustomer(c)">
                    <td class="primary" style="display:flex;align-items:center;gap:10px">
                      <div class="avatar avatar-sm" :style="{background:getColor(c.id)}">{{initials(c.name)}}</div>
                      {{c.name}}
                    </td>
                    <td>{{c.company}}</td>
                    <td><span class="badge" :class="statusBadge(c.status)">{{c.status}}</span></td>
                    <td v-if="can('view_sales')" class="primary">{{fmtVal(c.value)}}</td>
                    <td>{{c.owner}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- CUSTOMERS -->
        <div v-if="page === 'customers'">
          <div class="page-header">
            <div><div class="page-title">Customer List</div><div class="page-desc">{{customers.length}} total customers</div></div>
            <button v-if="can('add_edit_customer')" class="btn btn-primary" @click="openAddCustomer"><i class="fa-solid fa-plus"></i> Add Customer</button>
          </div>
          <div class="filter-bar">
            <div class="search-bar" style="flex:1;max-width:360px">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input class="form-control" v-model="searchQ" placeholder="Search customers..." />
            </div>
            <select class="form-control" style="width:160px">
              <option>All Status</option><option>Active</option><option>Prospect</option><option>Inactive</option>
            </select>
          </div>
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Company</th><th>Industry</th><th>Status</th><th v-if="can('view_sales')">Value</th><th>Location</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="c in filteredCustomers" :key="c.id">
                    <td class="primary" style="display:flex;align-items:center;gap:10px;min-width:180px">
                      <div class="avatar avatar-sm" :style="{background:getColor(c.id)}">{{initials(c.name)}}</div>
                      <div><div>{{c.name}}</div><div style="font-size:11px;color:var(--text-muted)">{{c.email}}</div></div>
                    </td>
                    <td>{{c.company}}</td>
                    <td>{{c.industry}}</td>
                    <td><span class="badge" :class="statusBadge(c.status)">{{c.status}}</span></td>
                    <td v-if="can('view_sales')" class="primary">{{fmtVal(c.value)}}</td>
                    <td>{{c.city}}, {{c.country}}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm" @click="viewCustomer(c)"><i class="fa-solid fa-eye"></i> View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <!-- CUSTOMER DETAIL -->
        <div v-if="page === 'customer_detail' && selectedCustomer">
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <button class="btn btn-ghost btn-sm" @click="page='customers'"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button v-if="can('add_edit_customer')" class="btn btn-primary btn-sm" @click="openEditCustomer"><i class="fa-solid fa-pen-to-square"></i> Edit Customer</button>
          </div>

          <!-- Profile Header -->
          <div class="detail-header">
            <div class="avatar avatar-xl" :style="{background:getColor(selectedCustomer.id)}">{{initials(selectedCustomer.name)}}</div>
            <div class="detail-info">
              <div class="detail-name">{{selectedCustomer.name}}</div>
              <div class="detail-meta">
                <span><i class="fa-solid fa-building"></i> {{selectedCustomer.company}}</span>
                <span><i class="fa-solid fa-envelope"></i> {{selectedCustomer.email}}</span>
                <span><i class="fa-solid fa-phone"></i> {{selectedCustomer.phone}}</span>
                <span><i class="fa-solid fa-location-dot"></i> {{selectedCustomer.city}}, {{selectedCustomer.country}}</span>
              </div>
              <div style="margin-top:12px"><span class="badge" :class="statusBadge(selectedCustomer.status)">{{selectedCustomer.status}}</span></div>
            </div>
            <div v-if="can('view_sales')" style="text-align:right">
              <div style="font-size:28px;font-weight:800;color:var(--accent)">{{fmtVal(selectedCustomer.value)}}</div>
              <div style="font-size:12px;color:var(--text-muted)">Deal Value</div>
              <div style="margin-top:8px;font-size:13px;color:var(--text-secondary)">{{selectedCustomer.deal}}</div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="detail-tabs">
            <button class="tab-btn" :class="{active:customerTab==='overview'}" @click="customerTab='overview'"><i class="fa-solid fa-circle-info"></i> Overview</button>
            <button v-if="can('view_sales')" class="tab-btn" :class="{active:customerTab==='orders'}" @click="customerTab='orders'">
              <i class="fa-solid fa-receipt"></i> Sales Orders
              <span class="nav-badge" style="margin-left:6px">{{customerOrders.length}}</span>
            </button>

            <button class="tab-btn" :class="{active:customerTab==='tasks'}" @click="customerTab='tasks'">
              <i class="fa-solid fa-list-check"></i> Tasks
              <span class="nav-badge" style="margin-left:6px">{{tasks.filter(t=>t.customer===selectedCustomer.name).length}}</span>
            </button>
          </div>

          <!-- TAB: Overview -->
          <div v-if="customerTab==='overview'" class="grid-2">
            <div class="card">
              <div class="card-title" style="margin-bottom:16px">Contact Information</div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Industry</div><div class="info-value">{{selectedCustomer.industry}}</div></div>
                <div class="info-item"><div class="info-label">Owner</div><div class="info-value">{{selectedCustomer.owner}}</div></div>
                <div class="info-item"><div class="info-label">Joined</div><div class="info-value">{{selectedCustomer.joined}}</div></div>
                <div class="info-item"><div class="info-label">Country</div><div class="info-value">{{selectedCustomer.country}}</div></div>
                <div class="info-item" style="grid-column:span 2"><div class="info-label">Notes</div><div class="info-value" style="line-height:1.7">{{selectedCustomer.notes}}</div></div>
              </div>
            </div>
            <div class="card">
              <div class="card-header"><div class="card-title">Order Summary</div></div>
              <div style="display:flex;gap:14px;margin-bottom:16px">
                <div style="flex:1;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;text-align:center">
                  <div style="font-size:22px;font-weight:800;color:var(--success)">{{customerOrders.filter(o=>o.type==='request').length}}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Requests</div>
                </div>
                <div style="flex:1;padding:14px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:10px;text-align:center">
                  <div style="font-size:22px;font-weight:800;color:var(--accent)">{{customerOrders.filter(o=>o.type==='bug').length}}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Bugs (Free)</div>
                </div>
                <div style="flex:1;padding:14px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:10px;text-align:center">
                  <div style="font-size:18px;font-weight:800;color:var(--accent-3)">{{'$'+customerOrders.filter(o=>o.type==='request').reduce((a,o)=>a+o.amount,0).toLocaleString()}}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Total Billed</div>
                </div>
              </div>
              <div v-for="o in customerOrders.slice(0,3)" :key="o.id" class="task-card" style="margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  <span class="badge" :class="o.type==='bug'?'badge-danger':'badge-info'"><i :class="o.type==='bug'?'fa-solid fa-bug':'fa-solid fa-cart-shopping'"></i> {{o.type}}</span>
                  <span class="badge" :class="o.status==='approved'?'badge-success':o.status==='resolved'?'badge-cyan':o.status==='pending'?'badge-warning':'badge-info'">{{o.status}}</span>
                </div>
                <div style="font-size:13px;font-weight:600">{{o.title}}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">{{o.date}} <span v-if="o.amount" style="color:var(--accent);font-weight:600">&middot; \${{o.amount.toLocaleString()}}</span></div>
              </div>
            </div>
          </div>

          <!-- TAB: Sales Orders -->
          <div v-if="customerTab==='orders'">
            <div class="page-header" style="margin-bottom:16px">
              <div style="font-size:15px;font-weight:600;color:var(--text-secondary)">{{customerOrders.length}} orders for {{selectedCustomer.name}}</div>
              <button class="btn btn-primary btn-sm" @click="showOrderModal=true"><i class="fa-solid fa-plus"></i> New Order</button>
            </div>
            <div class="card">
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Type</th><th>Title</th><th>Status</th><th>Amount</th><th>Date</th><th>Quotation</th><th>Actions</th></tr></thead>
                  <tbody>
                    <tr v-for="o in customerOrders" :key="o.id">
                      <td>
                        <span class="badge" :class="o.type==='bug'?'badge-danger':'badge-info'">
                          <i :class="o.type==='bug'?'fa-solid fa-bug':'fa-solid fa-cart-shopping'"></i>
                          {{o.type==='bug'?'Bug (Free)':'Request'}}
                        </span>
                      </td>
                      <td class="primary">
                        <div>{{o.title}}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{o.desc.slice(0,50)}}{{o.desc.length>50?'...':''}}</div>
                      </td>
                      <td>
                        <span class="badge" :class="o.status==='approved'?'badge-success':o.status==='resolved'?'badge-cyan':o.status==='pending'?'badge-warning':'badge-info'">{{o.status}}</span>
                      </td>
                      <td class="primary">{{o.type==='bug'?'Free':'\$'+o.amount.toLocaleString()}}</td>
                      <td style="font-size:12px">{{o.date}}</td>
                      <td style="font-size:12px;color:var(--accent)">{{o.quotationNo || '—'}}</td>
                      <td>
                        <button v-if="o.type==='request'" class="btn btn-ghost btn-sm" @click="openQuotation(o)"><i class="fa-solid fa-file-invoice"></i> Quotation</button>
                        <span v-else style="font-size:12px;color:var(--text-muted)">N/A</span>
                      </td>
                    </tr>
                    <tr v-if="!customerOrders.length"><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">No orders yet. Click "New Order" to add one.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: Tasks -->
          <div v-if="customerTab==='tasks'">
            <div class="page-header" style="margin-bottom:16px">
              <div style="font-size:15px;font-weight:600;color:var(--text-secondary)">Tasks linked to {{selectedCustomer.name}}</div>
            </div>
            <div v-for="t in tasks.filter(t=>t.customer===selectedCustomer.name)" :key="t.id" class="task-card">
              <div style="display:flex;gap:8px;margin-bottom:6px">
                <span class="badge" style="background:rgba(99,102,241,0.1);color:var(--accent);font-size:10px">{{t.type}}</span>
                <span class="badge" :class="priorityBadge(t.priority)">{{t.priority}}</span>
                <span class="badge" :class="t.status==='done'?'badge-success':t.status==='in-progress'?'badge-info':'badge-warning'">{{t.status}}</span>
              </div>
              <div class="task-title">{{t.title}}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px"><i class="fa-regular fa-calendar"></i> {{t.due}} &middot; {{t.assignee}}</div>
            </div>
            <div v-if="!tasks.filter(t=>t.customer===selectedCustomer.name).length" style="color:var(--text-muted);font-size:13px;padding:20px 0">No tasks assigned to this customer.</div>
          </div>
        </div>

        <!-- TASKS -->
        <div v-if="page === 'tasks'">
          <div class="page-header">
            <div><div class="page-title">Task Requests</div><div class="page-desc">Kanban-style task management</div></div>
            <button class="btn btn-primary" @click="showTaskModal=true"><i class="fa-solid fa-plus"></i> New Task</button>
          </div>
          <div class="filter-bar">
            <span style="font-size:13px;color:var(--text-secondary)">Filter by priority:</span>
            <button class="btn btn-sm" :class="taskFilter==='all'?'btn-primary':'btn-ghost'" @click="taskFilter='all'">All</button>
            <button class="btn btn-sm" :class="taskFilter==='high'?'btn-primary':'btn-ghost'" @click="taskFilter='high'">High</button>
            <button class="btn btn-sm" :class="taskFilter==='medium'?'btn-primary':'btn-ghost'" @click="taskFilter='medium'">Medium</button>
            <button class="btn btn-sm" :class="taskFilter==='low'?'btn-primary':'btn-ghost'" @click="taskFilter='low'">Low</button>
          </div>
          <div class="kanban">
            <div class="kanban-col" v-for="(col, key) in taskCols" :key="key">
              <div class="kanban-col-title">
                <span :style="{color: key==='todo'?'var(--warning)':key==='in-progress'?'var(--accent)':'var(--success)'}">
                  <i :class="key==='done'?'fa-solid fa-circle-check':'fa-solid fa-circle'"></i>
                  {{key==='todo'?'To Do':key==='in-progress'?'In Progress':'Done'}}
                </span>
                <span class="kanban-count">{{col.length}}</span>
              </div>
              <div class="task-card" v-for="t in col" :key="t.id" @click="viewTask(t)">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                  <span class="badge" :class="'badge-'+t.type.toLowerCase().replace(' ','-')" style="font-size:10px;background:rgba(99,102,241,0.1);color:var(--accent)">{{t.type}}</span>
                  <span class="badge" :class="priorityBadge(t.priority)">{{t.priority}}</span>
                </div>
                <div class="task-title">{{t.title}}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">{{t.desc}}</div>
                <div class="task-meta">
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="avatar avatar-sm" :style="{background:safeColor(t.assignee),width:'24px',height:'24px',fontSize:'10px'}">{{safeInitials(t.assignee)}}</div>
                    <span style="font-size:11px;color:var(--text-secondary)">{{t.assignee}}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span v-if="(t.attachments||[]).length" style="font-size:11px;color:var(--accent);display:inline-flex;align-items:center;gap:3px" title="Attached Files"><i class="fa-solid fa-paperclip"></i>{{t.attachments.length}}</span>
                    <span class="task-due"><i class="fa-regular fa-calendar"></i>{{t.due}}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Task Modal -->
          <div class="modal-overlay" v-if="showTaskModal" @click.self="showTaskModal=false">
            <div class="modal fade-in">
              <div class="modal-header">
                <div class="modal-title">Create Task Request</div>
                <button class="modal-close" @click="showTaskModal=false"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div class="modal-body">
                <div class="form-group"><label class="form-label">Title *</label><input class="form-control" v-model="taskForm.title" placeholder="Task title..." /></div>
                <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" v-model="taskForm.desc" placeholder="Describe the task..."></textarea></div>
                <div class="form-row">
                  <div class="form-group"><label class="form-label">Priority</label>
                    <select class="form-control" v-model="taskForm.priority"><option>high</option><option>medium</option><option>low</option></select>
                  </div>
                  <div class="form-group"><label class="form-label">Type</label>
                    <select class="form-control" v-model="taskForm.type"><option>Call</option><option>Demo</option><option>Email</option><option>Meeting</option><option>Proposal</option><option>Contract</option><option>Internal</option></select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group"><label class="form-label">Assignee</label>
                    <select class="form-control" v-model="taskForm.assignee"><option value="">Select...</option><option v-for="e in employees" :key="e.id">{{e.name}}</option></select>
                  </div>
                  <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" type="date" v-model="taskForm.due" /></div>
                </div>
                <div class="form-group"><label class="form-label">Customer</label>
                  <select class="form-control" v-model="taskForm.customer"><option value="">None</option><option v-for="c in customers" :key="c.id">{{c.name}}</option></select>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-ghost" @click="showTaskModal=false">Cancel</button>
                <button class="btn btn-primary" @click="addTask"><i class="fa-solid fa-plus"></i> Create Task</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SCHEDULE & GANTT CHART -->
        <div v-if="page === 'schedule'" class="fade-in">
          <!-- Summary Stats Header -->
          <div class="stats-grid">
            <div class="stat-card indigo">
              <div class="stat-icon indigo"><i class="fa-solid fa-list-check"></i></div>
              <div class="stat-value">{{tasks.length}}</div>
              <div class="stat-label">Total Scheduled Tasks</div>
              <div class="stat-change up"><i class="fa-solid fa-clock"></i> Active timeline view</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-icon purple"><i class="fa-solid fa-spinner"></i></div>
              <div class="stat-value">{{schedInProgressCount}}</div>
              <div class="stat-label">In Progress</div>
              <div class="stat-change up"><i class="fa-solid fa-play"></i> Active workflows</div>
            </div>
            <div class="stat-card cyan">
              <div class="stat-icon cyan"><i class="fa-solid fa-hourglass-half"></i></div>
              <div class="stat-value">{{schedTodoCount}}</div>
              <div class="stat-label">Pending / To Do</div>
              <div class="stat-change down"><i class="fa-solid fa-circle-exclamation"></i> Action required</div>
            </div>
            <div class="stat-card green">
              <div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
              <div class="stat-value">{{schedDoneCount}}</div>
              <div class="stat-label">Completed</div>
              <div class="stat-change up"><i class="fa-solid fa-check-double"></i> {{schedCompletionRate}}% completion rate</div>
            </div>
          </div>

          <!-- Controls & Filters -->
          <div class="page-header" style="margin-bottom:16px">
            <div>
              <div class="page-title">Project Schedule Timeline</div>
              <div class="page-desc">Gantt Chart tracking for pending, in-progress, and completed tasks</div>
            </div>
            <button class="btn btn-primary" @click="showTaskModal=true"><i class="fa-solid fa-plus"></i> New Scheduled Task</button>
          </div>

          <div class="filter-bar" style="margin-bottom:20px;flex-wrap:wrap">
            <div class="search-bar" style="flex:1;max-width:320px">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input class="form-control" v-model="schedSearch" placeholder="Search task or assignee..." />
            </div>

            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:13px;color:var(--text-secondary);margin-right:4px">Status:</span>
              <button class="btn btn-sm" :class="schedStatus==='all'?'btn-primary':'btn-ghost'" @click="schedStatus='all'">All ({{tasks.length}})</button>
              <button class="btn btn-sm" :class="schedStatus==='todo'?'btn-primary':'btn-ghost'" @click="schedStatus='todo'">
                <i class="fa-solid fa-hourglass-half" style="color:var(--warning)"></i> Pending ({{schedTodoCount}})
              </button>
              <button class="btn btn-sm" :class="schedStatus==='in-progress'?'btn-primary':'btn-ghost'" @click="schedStatus='in-progress'">
                <i class="fa-solid fa-spinner" style="color:var(--accent)"></i> In Progress ({{schedInProgressCount}})
              </button>
              <button class="btn btn-sm" :class="schedStatus==='done'?'btn-primary':'btn-ghost'" @click="schedStatus='done'">
                <i class="fa-solid fa-circle-check" style="color:var(--success)"></i> Completed ({{schedDoneCount}})
              </button>
            </div>

            <div style="display:flex;gap:8px;align-items:center">
              <span style="font-size:13px;color:var(--text-secondary)">Priority:</span>
              <select class="form-control" v-model="schedPriority" style="width:130px">
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <!-- Gantt Chart Container -->
          <div class="gantt-card">
            <div class="gantt-wrapper">
              
              <!-- Left Pane: Tasks List -->
              <div class="gantt-sidebar">
                <div class="gantt-sidebar-header">
                  <span>Task Name & Assignee</span>
                </div>
                <div class="gantt-sidebar-row" v-for="t in filteredSchedTasks" :key="'side-'+t.id" @click="viewTask(t)" title="Click to view/edit task">
                  <div class="avatar avatar-sm" :style="{background:safeColor(t.assignee),width:'28px',height:'28px',fontSize:'11px',flexShrink:0}">{{safeInitials(t.assignee)}}</div>
                  <div style="overflow:hidden;flex:1">
                    <div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden">{{t.title}}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
                      <span class="badge" :class="t.status==='done'?'badge-success':t.status==='in-progress'?'badge-info':'badge-warning'" style="font-size:9px">{{t.status}}</span>
                      <span style="font-size:11px;color:var(--text-muted)">{{t.assignee || 'Unassigned'}}</span>
                    </div>
                  </div>
                </div>
                <div v-if="!filteredSchedTasks.length" style="padding:40px 16px;text-align:center;color:var(--text-muted);font-size:13px">
                  No tasks match the filter criteria.
                </div>
              </div>

              <!-- Right Pane: Timeline Grid -->
              <div class="gantt-timeline-area">
                <!-- Date Headers -->
                <div class="gantt-dates-header">
                  <div class="gantt-date-col" v-for="d in ganttDates" :key="d.dateStr" :class="{'is-today':d.isToday, 'is-weekend':d.isWeekend}">
                    <div style="font-size:10px;text-transform:uppercase">{{d.dayName}}</div>
                    <div style="font-size:13px;font-weight:700;margin-top:1px">{{d.dayNum}}</div>
                  </div>
                </div>

                <!-- Grid Rows -->
                <div class="gantt-timeline-body">
                  <div class="gantt-grid-row" v-for="t in filteredSchedTasks" :key="'grid-'+t.id">
                    <div class="gantt-grid-cell" v-for="d in ganttDates" :key="'cell-'+t.id+'-'+d.dateStr" :class="{'is-today':d.isToday, 'is-weekend':d.isWeekend}"></div>
                    
                    <!-- Gantt Bar -->
                    <div class="gantt-task-bar"
                         :class="t.status==='done'?'bar-done':t.status==='in-progress'?'bar-in-progress':'bar-todo'"
                         :style="getGanttBarStyle(t)"
                         @click="viewTask(t)"
                         :title="t.title + ' (' + (t.progress||0) + '% complete) — Due: ' + t.due">
                      
                      <!-- Inner progress overlay -->
                      <div class="gantt-bar-fill" :style="{width:(t.progress||(t.status==='done'?100:30))+'%'}"></div>

                      <!-- Bar content label -->
                      <div style="position:relative;z-index:2;display:flex;align-items:center;gap:6px;overflow:hidden">
                        <i :class="t.status==='done'?'fa-solid fa-circle-check':t.status==='in-progress'?'fa-solid fa-spinner':'fa-solid fa-clock'" style="font-size:11px"></i>
                        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{t.title}}</span>
                      </div>
                      
                      <div style="position:relative;z-index:2;font-size:10px;font-weight:800;background:rgba(0,0,0,0.25);padding:2px 6px;border-radius:6px;margin-left:6px">
                        {{t.progress||(t.status==='done'?100:0)}}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- EMPLOYEES -->
        <div v-if="page === 'employees'">
          <div class="page-header">
            <div><div class="page-title">Employee Directory</div><div class="page-desc">{{employees.length}} team members</div></div>
            <button v-if="can('add_edit_employee')" class="btn btn-primary" @click="openAddEmployee"><i class="fa-solid fa-user-plus"></i> Create New Employee</button>
          </div>
          <div class="filter-bar">
            <div class="search-bar" style="flex:1;max-width:320px">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input class="form-control" v-model="empSearch" placeholder="Search employees..." />
            </div>
          </div>
          <div class="employee-grid">
            <div class="employee-card" v-for="e in filteredEmployees" :key="e.id" @click="viewEmployee(e)">
              <div class="avatar avatar-lg" style="margin:0 auto" :style="{background:getColor(e.id)}">{{initials(e.name)}}</div>
              <div class="employee-name">{{e.name}}</div>
              <div class="employee-dept">{{e.role}} &middot; {{e.dept}}</div>
              <div style="display:flex;gap:6px;justify-content:center;margin-bottom:14px;flex-wrap:wrap">
                <span class="badge" :class="e.status==='active'?'badge-success':e.status==='on-leave'?'badge-warning':'badge-secondary'">{{e.status}}</span>
                <span class="badge badge-info" v-if="e.accessLevel"><i class="fa-solid fa-shield-halved" style="font-size:10px;margin-right:3px"></i>{{e.accessLevel}}</span>
              </div>
              <div class="employee-stats">
                <div v-if="can('view_sales')"><div class="emp-stat-val">{{e.deals}}</div><div class="emp-stat-lbl">Deals</div></div>
                <div><div class="emp-stat-val">{{e.tasks}}</div><div class="emp-stat-lbl">Tasks</div></div>
              </div>
              <div style="margin-top:12px;font-size:11px;color:var(--text-muted)"><i class="fa-solid fa-envelope"></i> {{e.email}}</div>
              <div style="margin-top:8px"><span style="font-size:11px;color:var(--accent)"><i class="fa-solid fa-arrow-right"></i> View Profile</span></div>
            </div>
          </div>
        </div>

        <!-- EMPLOYEE DETAIL -->
        <div v-if="page === 'employee_detail' && selectedEmployee">
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <button class="btn btn-ghost btn-sm" @click="page='employees'"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button v-if="can('add_edit_employee')" class="btn btn-primary btn-sm" @click="openEditEmployee"><i class="fa-solid fa-pen-to-square"></i> Edit Employee</button>
          </div>

          <!-- Profile Header -->
          <div class="detail-header" style="margin-bottom:24px">
            <div class="avatar avatar-xl" :style="{background:getColor(selectedEmployee.id)}">{{initials(selectedEmployee.name)}}</div>
            <div class="detail-info">
              <div class="detail-name">{{selectedEmployee.name}}</div>
              <div class="detail-meta">
                <span><i class="fa-solid fa-briefcase"></i> {{selectedEmployee.role}}</span>
                <span><i class="fa-solid fa-building"></i> {{selectedEmployee.dept}}</span>
                <span><i class="fa-solid fa-envelope"></i> {{selectedEmployee.email}}</span>
                <span><i class="fa-solid fa-phone"></i> {{selectedEmployee.phone}}</span>
              </div>
              <div style="margin-top:12px">
                <span class="badge" :class="selectedEmployee.status==='active'?'badge-success':selectedEmployee.status==='on-leave'?'badge-warning':'badge-secondary'">{{selectedEmployee.status}}</span>
              </div>
            </div>
            <div style="display:flex;gap:20px;text-align:center">
              <div v-if="can('view_sales')" style="padding:16px 24px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:12px">
                <div style="font-size:28px;font-weight:800;color:var(--accent)">{{selectedEmployee.deals}}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Deals Closed</div>
              </div>
              <div style="padding:16px 24px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px">
                <div style="font-size:28px;font-weight:800;color:var(--success)">{{selectedEmployee.tasks}}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Open Tasks</div>
              </div>
              <div v-if="can('view_sales')" style="padding:16px 24px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);border-radius:12px">
                <div style="font-size:22px;font-weight:800;color:var(--accent-3)">{{'$'+(selectedEmployee.revenue/1000).toFixed(0)+'k'}}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Revenue</div>
              </div>
            </div>
          </div>


          <div class="grid-2">
            <!-- Info Card -->
            <div class="card">
              <div class="card-title" style="margin-bottom:16px">Employee Information</div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Department</div><div class="info-value">{{selectedEmployee.dept}}</div></div>
                <div class="info-item"><div class="info-label">Role</div><div class="info-value">{{selectedEmployee.role}}</div></div>
                <div class="info-item"><div class="info-label">Joined</div><div class="info-value">{{selectedEmployee.joined}}</div></div>
                <div class="info-item"><div class="info-label">Status</div>
                  <div class="info-value"><span class="badge" :class="selectedEmployee.status==='active'?'badge-success':selectedEmployee.status==='on-leave'?'badge-warning':'badge-secondary'">{{selectedEmployee.status}}</span></div>
                </div>
                <div class="info-item"><div class="info-label">Email</div><div class="info-value" style="word-break:break-all">{{selectedEmployee.email}}</div></div>
                <div class="info-item"><div class="info-label">Phone</div><div class="info-value">{{selectedEmployee.phone}}</div></div>
                <div class="info-item" style="grid-column:span 2"><div class="info-label">Access Level</div><div class="info-value"><span class="badge badge-info"><i class="fa-solid fa-shield-halved"></i> {{selectedEmployee.accessLevel || 'Standard'}}</span></div></div>
              </div>
            </div>

            <!-- Assigned Tasks -->
            <div class="card">
              <div class="card-header">
                <div class="card-title">Assigned Tasks</div>
                <span class="badge badge-info">{{tasks.filter(t=>t.assignee===selectedEmployee.name).length}} total</span>
              </div>
              <div v-if="!tasks.filter(t=>t.assignee===selectedEmployee.name).length" style="color:var(--text-muted);font-size:13px">No tasks assigned.</div>
              <div class="task-card" v-for="t in tasks.filter(t=>t.assignee===selectedEmployee.name)" :key="t.id">
                <div style="display:flex;gap:8px;margin-bottom:6px">
                  <span class="badge" style="background:rgba(99,102,241,0.1);color:var(--accent);font-size:10px">{{t.type}}</span>
                  <span class="badge" :class="priorityBadge(t.priority)">{{t.priority}}</span>
                  <span class="badge" :class="t.status==='done'?'badge-success':t.status==='in-progress'?'badge-info':'badge-warning'">{{t.status}}</span>
                </div>
                <div class="task-title">{{t.title}}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:5px">
                  <i class="fa-regular fa-calendar"></i> Due: {{t.due}}
                  <span v-if="t.customer" style="margin-left:8px"><i class="fa-solid fa-user"></i> {{t.customer}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SETTINGS -->
        <div v-if="page === 'settings'" class="fade-in">
          <div class="grid-2">
            <!-- Profile Settings Card -->
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title"><i class="fa-solid fa-user-gear" style="color:var(--accent)"></i> Edit Profile</div>
                  <div class="card-subtitle">Update your personal profile information</div>
                </div>
              </div>

              <div v-if="profileSuccessMsg" style="padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:10px;color:var(--success);font-size:13px;margin-bottom:16px;display:flex;align-items:center;gap:8px">
                <i class="fa-solid fa-circle-check"></i> {{profileSuccessMsg}}
              </div>

              <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding:14px;background:var(--glass);border-radius:12px;border:1px solid var(--glass-border)">
                <div class="avatar avatar-lg" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">{{userProfile.initials}}</div>
                <div>
                  <div style="font-size:16px;font-weight:700">{{userProfile.name}}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">{{userProfile.role}} &middot; {{userProfile.department}}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{userProfile.email}}</div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" v-model="profileForm.name" /></div>
                <div class="form-group"><label class="form-label">Email Address *</label><input class="form-control" type="email" v-model="profileForm.email" /></div>
              </div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" v-model="profileForm.phone" /></div>
                <div class="form-group"><label class="form-label">Role / Title</label>
                  <select class="form-control" v-model="profileForm.role" @change="switchRole(profileForm.role)">
                    <option v-for="r in systemRoles" :key="r" :value="r">{{r}}</option>
                  </select>
                </div>
              </div>

              <div class="form-group"><label class="form-label">Department</label><input class="form-control" v-model="profileForm.department" /></div>
              <div class="form-group"><label class="form-label">Bio / Notes</label><textarea class="form-control" v-model="profileForm.bio" rows="3"></textarea></div>

              <div style="text-align:right">
                <button class="btn btn-primary" @click="saveProfile"><i class="fa-solid fa-floppy-disk"></i> Save Profile</button>
              </div>
            </div>

            <!-- Appearance & Theme Card -->
            <div>
              <div class="card" style="margin-bottom:20px">
                <div class="card-header">
                  <div>
                    <div class="card-title"><i class="fa-solid fa-palette" style="color:var(--accent)"></i> Appearance & Theme</div>
                    <div class="card-subtitle">Choose your preferred UI theme interface</div>
                  </div>
                </div>

                <div class="theme-select-grid">
                  <!-- Dark Theme Card (Current Default) -->
                  <div class="theme-card" :class="{active: currentTheme==='dark'}" @click="switchTheme('dark')">
                    <div class="theme-preview dark-prev">
                      <div class="prev-side"></div>
                      <div class="prev-body"><div class="prev-bar"></div><div class="prev-card"></div></div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <div>
                        <div style="font-size:14px;font-weight:600;color:var(--text-primary)"><i class="fa-solid fa-moon"></i> Dark Theme</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Current dark glassmorphism</div>
                      </div>
                      <i v-if="currentTheme==='dark'" class="fa-solid fa-circle-check" style="color:var(--accent);font-size:18px"></i>
                    </div>
                  </div>

                  <!-- Light Theme Card -->
                  <div class="theme-card" :class="{active: currentTheme==='light'}" @click="switchTheme('light')">
                    <div class="theme-preview light-prev">
                      <div class="prev-side"></div>
                      <div class="prev-body"><div class="prev-bar"></div><div class="prev-card"></div></div>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <div>
                        <div style="font-size:14px;font-weight:600;color:var(--text-primary)"><i class="fa-solid fa-sun"></i> Light Theme</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Clean & bright glassmorphism</div>
                      </div>
                      <i v-if="currentTheme==='light'" class="fa-solid fa-circle-check" style="color:var(--accent);font-size:18px"></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notifications Preferences Card -->
              <div class="card">
                <div class="card-header">
                  <div>
                    <div class="card-title"><i class="fa-solid fa-sliders" style="color:var(--accent)"></i> Preferences</div>
                    <div class="card-subtitle">System notifications & default view</div>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:14px">
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--glass);border-radius:10px;border:1px solid var(--glass-border)">
                    <div>
                      <div style="font-size:13px;font-weight:600">Email Notifications</div>
                      <div style="font-size:11px;color:var(--text-muted)">Receive email digests for order updates</div>
                    </div>
                    <input type="checkbox" checked style="accent-color:var(--accent);width:16px;height:16px;cursor:pointer" />
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--glass);border-radius:10px;border:1px solid var(--glass-border)">
                    <div>
                      <div style="font-size:13px;font-weight:600">Task Due Alerts</div>
                      <div style="font-size:11px;color:var(--text-muted)">Show popups when assigned tasks are due</div>
                    </div>
                    <input type="checkbox" checked style="accent-color:var(--accent);width:16px;height:16px;cursor:pointer" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- ADD / EDIT CUSTOMER MODAL -->
    <div class="modal-overlay" v-if="showCustomerModal" @click.self="showCustomerModal=false">
      <div class="modal fade-in">
        <div class="modal-header">
          <div class="modal-title">{{editingCustomer ? 'Edit Customer' : 'Add New Customer'}}</div>
          <button class="modal-close" @click="showCustomerModal=false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" v-model="customerForm.name" placeholder="John Smith" /></div>
            <div class="form-group"><label class="form-label">Email *</label><input class="form-control" type="email" v-model="customerForm.email" placeholder="john@company.com" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Phone</label><input class="form-control" v-model="customerForm.phone" placeholder="+1 555-0000" /></div>
            <div class="form-group"><label class="form-label">Company</label><input class="form-control" v-model="customerForm.company" placeholder="Acme Corp" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Status</label>
              <select class="form-control" v-model="customerForm.status"><option>active</option><option>prospect</option><option>inactive</option></select>
            </div>
            <div class="form-group"><label class="form-label">Industry</label><input class="form-control" v-model="customerForm.industry" placeholder="Technology" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Deal Value ($)</label><input class="form-control" type="number" v-model.number="customerForm.value" placeholder="0" /></div>
            <div class="form-group"><label class="form-label">Deal / Plan</label><input class="form-control" v-model="customerForm.deal" placeholder="Enterprise Suite" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City</label><input class="form-control" v-model="customerForm.city" placeholder="San Francisco" /></div>
            <div class="form-group"><label class="form-label">Country</label><input class="form-control" v-model="customerForm.country" placeholder="USA" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Owner</label>
              <select class="form-control" v-model="customerForm.owner"><option value="">Select owner...</option><option v-for="e in employees" :key="e.id">{{e.name}}</option></select>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" v-model="customerForm.notes" placeholder="Any additional notes..."></textarea></div>
          <div v-if="!customerForm.name || !customerForm.email" style="font-size:12px;color:var(--text-muted);margin-bottom:4px"><i class="fa-solid fa-circle-info"></i> Name and Email are required.</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showCustomerModal=false">Cancel</button>
          <button class="btn btn-primary" @click="saveCustomer" :disabled="!customerForm.name||!customerForm.email" :style="{opacity:!customerForm.name||!customerForm.email?0.5:1}">
            <i :class="editingCustomer?'fa-solid fa-floppy-disk':'fa-solid fa-plus'"></i>
            {{editingCustomer ? 'Save Changes' : 'Add Customer'}}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD / EDIT EMPLOYEE MODAL -->
    <div class="modal-overlay" v-if="showEmployeeModal" @click.self="showEmployeeModal=false">
      <div class="modal fade-in" style="max-width:580px">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-user-plus" style="color:var(--accent);margin-right:8px"></i>
            {{editingEmployee ? 'Edit Employee Account' : 'Create New Employee Account'}}
          </div>
          <button class="modal-close" @click="showEmployeeModal=false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <!-- Personal & Credentials -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--accent);margin-bottom:10px">
            <i class="fa-solid fa-user"></i> Personal Details & Credentials
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Full Name *</label><input class="form-control" v-model="employeeForm.name" placeholder="e.g. Sarah Connor" /></div>
            <div class="form-group"><label class="form-label">Email Address *</label><input class="form-control" type="email" v-model="employeeForm.email" placeholder="s.connor@hnfcrm.com" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Phone Number</label><input class="form-control" v-model="employeeForm.phone" placeholder="+1 555-0199" /></div>
            <div class="form-group">
              <label class="form-label">Initial Account Password <span v-if="!editingEmployee" style="color:var(--danger)">*</span></label>
              <input class="form-control" type="password" v-model="employeeForm.password" placeholder="e.g. emp12345" />
            </div>
          </div>

          <!-- Role & Organization -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--accent);margin-top:14px;margin-bottom:10px">
            <i class="fa-solid fa-briefcase"></i> Role & Organization
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Job Position / Role *</label>
              <select class="form-control" v-model="employeeForm.role">
                <option>Account Executive</option>
                <option>Sales Manager</option>
                <option>Senior AE</option>
                <option>CRM Specialist</option>
                <option>Support Lead</option>
                <option>Marketing Manager</option>
                <option>Software Engineer</option>
                <option>System Administrator</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Department *</label>
              <select class="form-control" v-model="employeeForm.dept">
                <option>Sales</option>
                <option>Operations</option>
                <option>Customer Success</option>
                <option>Marketing</option>
                <option>Engineering</option>
                <option>Finance</option>
              </select>
            </div>
          </div>

          <!-- Access Level & Status -->
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--accent);margin-top:14px;margin-bottom:10px">
            <i class="fa-solid fa-shield-halved"></i> Access Level & Status
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">System Access Level</label>
              <select class="form-control" v-model="employeeForm.accessLevel">
                <option value="Admin">Admin (Full System Access)</option>
                <option value="Manager">Manager (Team & Performance Access)</option>
                <option value="Standard">Standard (Basic Operational Access)</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Account Status</label>
              <select class="form-control" v-model="employeeForm.status">
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-row" v-if="editingEmployee">
            <div class="form-group"><label class="form-label">Deals Closed</label><input class="form-control" type="number" v-model.number="employeeForm.deals" /></div>
            <div class="form-group"><label class="form-label">Revenue ($)</label><input class="form-control" type="number" v-model.number="employeeForm.revenue" /></div>
          </div>

          <div v-if="!employeeForm.name||!employeeForm.email" style="font-size:12px;color:var(--text-muted);margin-top:6px"><i class="fa-solid fa-circle-info"></i> Full Name and Email Address are required.</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showEmployeeModal=false">Cancel</button>
          <button class="btn btn-primary" @click="saveEmployee" :disabled="!employeeForm.name||!employeeForm.email" :style="{opacity:!employeeForm.name||!employeeForm.email?0.5:1}">
            <i :class="editingEmployee?'fa-solid fa-floppy-disk':'fa-solid fa-user-plus'"></i>
            {{editingEmployee ? 'Save Account Changes' : 'Create Employee Account'}}
          </button>
        </div>
      </div>
    </div>

    <!-- TASK DETAIL / EDIT MODAL -->
    <div class="modal-overlay" v-if="showTaskDetailModal && selectedTask" @click.self="showTaskDetailModal=false">
      <div class="modal fade-in" style="max-width:580px">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{taskEditMode ? 'Edit Task' : 'Task Detail'}}</div>
            <div style="font-size:12px;margin-top:4px" v-if="!taskEditMode">
              <span class="badge" :class="selectedTask.status==='done'?'badge-success':selectedTask.status==='in-progress'?'badge-info':'badge-warning'" style="margin-right:6px">{{selectedTask.status}}</span>
              <span class="badge" :class="priorityBadge(selectedTask.priority)">{{selectedTask.priority}}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button v-if="!taskEditMode" class="btn btn-primary btn-sm" @click="taskEditMode=true"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
            <button class="modal-close" @click="showTaskDetailModal=false"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body" v-if="!taskEditMode">
          <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:18px;margin-bottom:16px">
            <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:8px">{{selectedTask.title}}</div>
            <div style="font-size:14px;color:var(--text-secondary);line-height:1.7">{{selectedTask.desc || 'No description provided.'}}</div>
          </div>
          <div class="info-grid" style="margin-bottom:16px">
            <div class="info-item"><div class="info-label">Type</div><div class="info-value"><span class="badge" style="background:rgba(99,102,241,0.12);color:var(--accent)">{{selectedTask.type}}</span></div></div>
            <div class="info-item"><div class="info-label">Priority</div><div class="info-value"><span class="badge" :class="priorityBadge(selectedTask.priority)">{{selectedTask.priority}}</span></div></div>
            <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="badge" :class="selectedTask.status==='done'?'badge-success':selectedTask.status==='in-progress'?'badge-info':'badge-warning'">{{selectedTask.status}}</span></div></div>
            <div class="info-item"><div class="info-label">Due Date</div><div class="info-value">{{selectedTask.due || '—'}}</div></div>
            <div class="info-item"><div class="info-label">Assignee</div>
              <div class="info-value" style="display:flex;align-items:center;gap:8px">
                <div class="avatar" :style="{background:safeColor(selectedTask.assignee),width:'22px',height:'22px',fontSize:'9px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',color:'#fff'}">{{safeInitials(selectedTask.assignee)}}</div>
                {{selectedTask.assignee || 'Unassigned'}}
              </div>
            </div>
            <div class="info-item"><div class="info-label">Customer</div><div class="info-value">{{selectedTask.customer || '—'}}</div></div>
          </div>
          <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;padding:14px">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.8px;font-weight:600">Quick Status Change</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-sm" :class="selectedTask.status==='todo'?'btn-primary':'btn-ghost'" @click="selectedTask.status='todo'"><i class="fa-solid fa-circle"></i> To Do</button>
              <button class="btn btn-sm" :class="selectedTask.status==='in-progress'?'btn-primary':'btn-ghost'" @click="selectedTask.status='in-progress'"><i class="fa-solid fa-spinner"></i> In Progress</button>
              <button class="btn btn-sm" :class="selectedTask.status==='done'?'btn-primary':'btn-ghost'" @click="selectedTask.status='done'"><i class="fa-solid fa-circle-check"></i> Done</button>
            </div>
          </div>

          <!-- Attachments Section -->
          <div style="margin-top:16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div style="font-size:13px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-paperclip" style="color:var(--accent)"></i> Attachments
                <span class="badge badge-info" style="font-size:10px">{{(selectedTask.attachments || []).length}}</span>
              </div>
              <label class="btn btn-primary btn-sm" style="cursor:pointer;margin:0">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload File
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" @change="e => handleFileUpload(e, selectedTask)" style="display:none" />
              </label>
            </div>

            <!-- List of Attached Files -->
            <div v-if="(selectedTask.attachments || []).length" style="display:flex;flex-direction:column;gap:8px">
              <div v-for="att in selectedTask.attachments" :key="att.id" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);border-radius:8px">
                <div style="display:flex;align-items:center;gap:10px;overflow:hidden">
                  <div v-if="['jpg','jpeg','png','gif','webp'].includes((att.original_name||att.file_name).split('.').pop().toLowerCase())" style="width:36px;height:36px;border-radius:6px;overflow:hidden;background:#000;flex-shrink:0;border:1px solid var(--glass-border)">
                    <img :src="att.file_path" style="width:100%;height:100%;object-fit:cover" />
                  </div>
                  <div v-else style="width:36px;height:36px;border-radius:6px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:16px;flex-shrink:0">
                    <i :class="'fa-solid ' + fileIcon(att.original_name||att.file_name, att.file_type)"></i>
                  </div>
                  <div style="overflow:hidden">
                    <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden">{{att.original_name || att.file_name}}</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px">{{fmtFileSize(att.file_size)}} &middot; {{att.created_at}}</div>
                  </div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
                  <button class="btn btn-ghost btn-sm" @click="downloadAttachment(att)" title="Download File"><i class="fa-solid fa-download" style="color:var(--success)"></i></button>
                  <button class="btn btn-ghost btn-sm" @click="removeAttachment(att, selectedTask)" title="Delete File"><i class="fa-solid fa-trash-can" style="color:var(--danger)"></i></button>
                </div>
              </div>
            </div>
            <div v-else style="font-size:12px;color:var(--text-muted);padding:12px;text-align:center;border:1px dashed var(--glass-border);border-radius:8px">
              No files attached yet. Supported: Images (PNG, JPG), PDF, DOC, DOCX.
            </div>
          </div>

        </div>
        <div class="modal-body" v-else>
          <div class="form-group"><label class="form-label">Title *</label><input class="form-control" v-model="taskEditForm.title" placeholder="Task title..." /></div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" v-model="taskEditForm.desc" placeholder="Describe the task..."></textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Status</label>
              <select class="form-control" v-model="taskEditForm.status"><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="done">Done</option></select>
            </div>
            <div class="form-group"><label class="form-label">Priority</label>
              <select class="form-control" v-model="taskEditForm.priority"><option>high</option><option>medium</option><option>low</option></select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Type</label>
              <select class="form-control" v-model="taskEditForm.type"><option>Call</option><option>Demo</option><option>Email</option><option>Meeting</option><option>Proposal</option><option>Contract</option><option>Internal</option></select>
            </div>
            <div class="form-group"><label class="form-label">Due Date</label><input class="form-control" type="date" v-model="taskEditForm.due" /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Assignee</label>
              <select class="form-control" v-model="taskEditForm.assignee"><option value="">Unassigned</option><option v-for="e in employees" :key="e.id">{{e.name}}</option></select>
            </div>
            <div class="form-group"><label class="form-label">Customer</label>
              <select class="form-control" v-model="taskEditForm.customer"><option value="">None</option><option v-for="c in customers" :key="c.id">{{c.name}}</option></select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button v-if="taskEditMode" class="btn btn-ghost" @click="taskEditMode=false">Cancel Edit</button>
          <button v-else class="btn btn-ghost" @click="showTaskDetailModal=false">Close</button>
          <button v-if="taskEditMode" class="btn btn-primary" @click="saveTaskEdit" :disabled="!taskEditForm.title" :style="{opacity:!taskEditForm.title?0.5:1}">
            <i class="fa-solid fa-floppy-disk"></i> Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- ADD ORDER MODAL -->
    <div class="modal-overlay" v-if="showOrderModal" @click.self="showOrderModal=false">
      <div class="modal fade-in">
        <div class="modal-header">
          <div class="modal-title">New Order / Request</div>
          <button class="modal-close" @click="showOrderModal=false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <!-- Type selector -->
          <div class="form-group">
            <label class="form-label">Order Type</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div @click="orderForm.type='request'" :style="{cursor:'pointer',padding:'16px',borderRadius:'12px',border:'2px solid '+(orderForm.type==='request'?'var(--accent)':'var(--glass-border)'),background:orderForm.type==='request'?'rgba(99,102,241,0.1)':'var(--glass)',textAlign:'center'}">
                <i class="fa-solid fa-cart-shopping" :style="{fontSize:'22px',color:orderForm.type==='request'?'var(--accent)':'var(--text-muted)'}"></i>
                <div style="font-size:13px;font-weight:600;margin-top:8px" :style="{color:orderForm.type==='request'?'var(--accent)':'var(--text-secondary)'}">Request</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Paid service / feature</div>
              </div>
              <div @click="orderForm.type='bug'" :style="{cursor:'pointer',padding:'16px',borderRadius:'12px',border:'2px solid '+(orderForm.type==='bug'?'var(--danger)':'var(--glass-border)'),background:orderForm.type==='bug'?'rgba(239,68,68,0.08)':'var(--glass)',textAlign:'center'}">
                <i class="fa-solid fa-bug" :style="{fontSize:'22px',color:orderForm.type==='bug'?'var(--danger)':'var(--text-muted)'}"></i>
                <div style="font-size:13px;font-weight:600;margin-top:8px" :style="{color:orderForm.type==='bug'?'var(--danger)':'var(--text-secondary)'}">Bug Report</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Free — no charge</div>
              </div>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Title *</label><input class="form-control" v-model="orderForm.title" placeholder="Brief description..." /></div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" v-model="orderForm.desc" placeholder="Detailed description of the request or bug..."></textarea></div>
          <div class="form-row" v-if="orderForm.type==='request'">
            <div class="form-group"><label class="form-label">Amount (USD) *</label><input class="form-control" type="number" v-model.number="orderForm.amount" placeholder="0.00" /></div>
            <div class="form-group"><label class="form-label">Assigned To</label>
              <select class="form-control" v-model="orderForm.assignee"><option value="">Select...</option><option v-for="e in employees" :key="e.id">{{e.name}}</option></select>
            </div>
          </div>
          <div class="form-group" v-if="orderForm.type==='bug'"><label class="form-label">Assigned To</label>
            <select class="form-control" v-model="orderForm.assignee"><option value="">Select...</option><option v-for="e in employees" :key="e.id">{{e.name}}</option></select>
          </div>
          <div v-if="orderForm.type==='bug'" style="padding:10px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;font-size:12px;color:var(--success)">
            <i class="fa-solid fa-circle-check"></i> Bug reports are handled at <strong>no cost</strong> to the customer.
          </div>
          <div v-if="orderForm.type==='request'" style="padding:10px 14px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:8px;font-size:12px;color:var(--accent)">
            <i class="fa-solid fa-file-invoice"></i> A quotation will be automatically generated for this request.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showOrderModal=false">Cancel</button>
          <button class="btn btn-primary" @click="addOrder" :disabled="!orderForm.title" :style="{opacity:!orderForm.title?0.5:1}">
            <i :class="orderForm.type==='bug'?'fa-solid fa-bug':'fa-solid fa-cart-shopping'"></i>
            {{orderForm.type==='bug'?'Submit Bug Report':'Submit Request'}}
          </button>
        </div>
      </div>
    </div>

    <!-- QUOTATION MODAL -->
    <div class="modal-overlay" v-if="showQuotationModal && quotationOrder" @click.self="showQuotationModal=false">
      <div class="modal fade-in" style="max-width:640px">
        <div class="modal-header">
          <div class="modal-title"><i class="fa-solid fa-file-invoice" style="color:var(--accent)"></i> Quotation — {{quotationOrder.quotationNo}}</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" @click="printQuotation"><i class="fa-solid fa-print"></i> Print / PDF</button>
            <button class="modal-close" @click="showQuotationModal=false"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div class="modal-body">
          <div id="quotation-print" style="color:var(--text-primary)">
            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid var(--glass-border)">
              <div>
                <div style="font-size:22px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">HNF CRM</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">123 Business Avenue, Tech City<br/>support@hnfcrm.com</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:20px;font-weight:700;color:var(--accent)">QUOTATION</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">{{quotationOrder.quotationNo}}</div>
                <div style="font-size:12px;color:var(--text-muted)">Date: {{quotationOrder.date}}</div>
              </div>
            </div>
            <!-- Bill To -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
              <div style="padding:14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;font-weight:600">Bill To</div>
                <div style="font-weight:600;font-size:14px">{{quotationOrder.customerName}}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px" v-if="selectedCustomer">
                  {{selectedCustomer.company}}<br/>{{selectedCustomer.email}}<br/>{{selectedCustomer.city}}, {{selectedCustomer.country}}
                </div>
              </div>
              <div style="padding:14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;font-weight:600">Prepared By</div>
                <div style="font-weight:600;font-size:14px">{{quotationOrder.assignee || 'HNF CRM Team'}}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">HNF CRM Support<br/>support@hnfcrm.com</div>
              </div>
            </div>
            <!-- Items Table -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <thead>
                <tr style="background:rgba(99,102,241,0.1)">
                  <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);border-bottom:1px solid var(--glass-border)">#</th>
                  <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);border-bottom:1px solid var(--glass-border)">Description</th>
                  <th style="padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);border-bottom:1px solid var(--glass-border)">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding:14px;font-size:13px;border-bottom:1px solid var(--glass-border);color:var(--text-muted)">01</td>
                  <td style="padding:14px;border-bottom:1px solid var(--glass-border)">
                    <div style="font-size:14px;font-weight:600;color:var(--text-primary)">{{quotationOrder.title}}</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;line-height:1.6">{{quotationOrder.desc}}</div>
                  </td>
                  <td style="padding:14px;text-align:right;font-size:15px;font-weight:700;color:var(--accent);border-bottom:1px solid var(--glass-border)">\${{quotationOrder.amount.toLocaleString()}}</td>
                </tr>
              </tbody>
            </table>
            <!-- Totals -->
            <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
              <div style="min-width:240px">
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--glass-border)"><span>Subtotal</span><span>\${{quotationOrder.amount.toLocaleString()}}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--glass-border)"><span>Tax (0%)</span><span>\$0</span></div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:800;color:var(--accent)"><span>Total</span><span>\${{quotationOrder.amount.toLocaleString()}}</span></div>
              </div>
            </div>
            <!-- Status -->
            <div style="padding:12px 16px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass);display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:12px;color:var(--text-muted)">Quotation Status:</span>
              <span class="badge" :class="quotationOrder.status==='approved'?'badge-success':quotationOrder.status==='pending'?'badge-warning':'badge-info'">{{quotationOrder.status}}</span>
            </div>
            <div style="margin-top:20px;font-size:11px;color:var(--text-muted);text-align:center;line-height:1.8">
              This quotation is valid for 30 days from the date of issue.<br/>
              Payment terms: 50% upfront, 50% on delivery. Contact us at support@hnfcrm.com for any queries.
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
  `
}).mount('#app');
