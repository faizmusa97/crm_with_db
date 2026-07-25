// ===== MOCK DATA =====
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];
const getColor = (i) => COLORS[i % COLORS.length];
const initials = (name) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2);

const SYSTEM_ROLES = [
  'HOD IT',
  'Software Developer',
  'IT Support',
  'Technical Support',
  'System Analysis',
  'Devops',
  'Finance',
  'Marketing'
];

const ROLE_PERMISSIONS = {
  'HOD IT':             { view_sales: true,  add_edit_customer: true,  add_edit_task: true, add_edit_employee: true,  view_employees: true },
  'Software Developer': { view_sales: true,  add_edit_customer: true,  add_edit_task: true, add_edit_employee: true,  view_employees: true },
  'IT Support':         { view_sales: false, add_edit_customer: false, add_edit_task: true, add_edit_employee: false, view_employees: true },
  'Technical Support':  { view_sales: false, add_edit_customer: false, add_edit_task: true, add_edit_employee: false, view_employees: true },
  'Devops':             { view_sales: false, add_edit_customer: false, add_edit_task: true, add_edit_employee: false, view_employees: true },
  'System Analysis':    { view_sales: false, add_edit_customer: true,  add_edit_task: true, add_edit_employee: false, view_employees: true },
  'Finance':            { view_sales: true,  add_edit_customer: true,  add_edit_task: true, add_edit_employee: false, view_employees: true },
  'Marketing':          { view_sales: true,  add_edit_customer: true,  add_edit_task: true, add_edit_employee: false, view_employees: true },
};


const customers = [
  { id:1, name:'Ariel Santos', email:'ariel@techvision.com', phone:'+1 555-0101', company:'TechVision Inc.', status:'active', value:42500, deal:'Enterprise Suite', owner:'Jamie Rivera', city:'San Francisco', country:'USA', joined:'2024-01-15', industry:'Technology', notes:'Key enterprise account. CEO-level contact.' },
  { id:2, name:'Maria Reyes', email:'m.reyes@bluepeak.io', phone:'+1 555-0102', company:'BluePeak Solutions', status:'active', value:28900, deal:'Pro Plan', owner:'Alex Morgan', city:'Austin', country:'USA', joined:'2024-03-08', industry:'Finance', notes:'Renewed annually. Interested in add-ons.' },
  { id:3, name:'James Lim', email:'j.lim@cloudnova.sg', phone:'+65 555-0103', company:'CloudNova', status:'prospect', value:15000, deal:'Starter Package', owner:'Jamie Rivera', city:'Singapore', country:'SG', joined:'2024-06-01', industry:'SaaS', notes:'In evaluation stage. Demo scheduled.' },
  { id:4, name:'Sophie Müller', email:'s.mueller@dataspark.de', phone:'+49 555-0104', company:'DataSpark GmbH', status:'active', value:67200, deal:'Enterprise+', owner:'Sam Chen', city:'Berlin', country:'DE', joined:'2023-11-20', industry:'Analytics', notes:'High-value account. Monthly check-ins.' },
  { id:5, name:'David Park', email:'d.park@nexwave.kr', phone:'+82 555-0105', company:'NexWave Corp', status:'inactive', value:9800, deal:'Basic Plan', owner:'Alex Morgan', city:'Seoul', country:'KR', joined:'2024-02-14', industry:'E-commerce', notes:'Contract expired. Re-engagement needed.' },
  { id:6, name:'Priya Sharma', email:'priya@innovatex.in', phone:'+91 555-0106', company:'InnovateX', status:'active', value:33400, deal:'Growth Plan', owner:'Sam Chen', city:'Mumbai', country:'IN', joined:'2024-04-22', industry:'Consulting', notes:'Fast-growing startup. Expanding team.' },
  { id:7, name:'Lucas Durand', email:'l.durand@webcraft.fr', phone:'+33 555-0107', company:'WebCraft Paris', status:'prospect', value:12000, deal:'Agency Bundle', owner:'Jamie Rivera', city:'Paris', country:'FR', joined:'2024-07-10', industry:'Design', notes:'Referred by DataSpark. High intent.' },
  { id:8, name:'Aisha Mohammed', email:'aisha@finedge.ae', phone:'+971 555-0108', company:'FinEdge UAE', status:'active', value:89000, deal:'Enterprise Suite', owner:'Sam Chen', city:'Dubai', country:'AE', joined:'2023-09-05', industry:'Finance', notes:'Top account. Quarterly executive meetings.' },
];

const employees = [
  { id:1, name:'Jamie Rivera', role:'HOD IT', dept:'IT', email:'j.rivera@hnfcrm.com', phone:'+1 555-1001', status:'active', accessLevel:'Manager', deals:24, revenue:183000, tasks:8, joined:'2022-03-01' },
  { id:2, name:'Alex Morgan', role:'Software Developer', dept:'Engineering', email:'a.morgan@hnfcrm.com', phone:'+1 555-1002', status:'active', accessLevel:'Standard', deals:18, revenue:124500, tasks:5, joined:'2022-07-15' },
  { id:3, name:'Sam Chen', role:'IT Support', dept:'IT Support', email:'s.chen@hnfcrm.com', phone:'+1 555-1003', status:'active', accessLevel:'Standard', deals:31, revenue:265000, tasks:11, joined:'2021-11-20' },
  { id:4, name:'Taylor Nguyen', role:'Technical Support', dept:'Operations', email:'t.nguyen@hnfcrm.com', phone:'+1 555-1004', status:'active', accessLevel:'Standard', deals:0, revenue:0, tasks:14, joined:'2023-02-10' },
  { id:5, name:'Jordan Lee', role:'System Analysis', dept:'Systems', email:'j.lee@hnfcrm.com', phone:'+1 555-1005', status:'active', accessLevel:'Manager', deals:6, revenue:42000, tasks:9, joined:'2023-05-08' },
  { id:6, name:'Casey Wong', role:'Devops', dept:'Infrastructure', email:'c.wong@hnfcrm.com', phone:'+1 555-1006', status:'on-leave', accessLevel:'Standard', deals:0, revenue:0, tasks:3, joined:'2022-09-01' },
  { id:7, name:'Marcus Brody', role:'Finance', dept:'Finance', email:'m.brody@hnfcrm.com', phone:'+1 555-1007', status:'active', accessLevel:'Standard', deals:12, revenue:95000, tasks:4, joined:'2023-01-10' },
  { id:8, name:'Elena Rostova', role:'Marketing', dept:'Marketing', email:'e.rostova@hnfcrm.com', phone:'+1 555-1008', status:'active', accessLevel:'Standard', deals:15, revenue:110000, tasks:7, joined:'2023-04-18' },
];


const tasks = [
  { id:1, title:'Follow-up call with Aisha Mohammed', desc:'Discuss Q4 renewal terms and new features.', status:'todo', priority:'high', startDate:'2026-07-20', due:'2026-07-26', progress:25, assignee:'Jamie Rivera', customer:'Aisha Mohammed', type:'Call', attachments:[{ id:1, task_id:1, file_name:'sample_contract.pdf', original_name:'Q4_Renewal_Proposal.pdf', file_type:'application/pdf', file_size:245000, file_path:'api/uploads/sample_contract.pdf', created_at:'2026-07-20 10:00:00' }] },
  { id:2, title:'Send proposal to Lucas Durand', desc:'Prepare customized Agency Bundle proposal.', status:'todo', priority:'medium', startDate:'2026-07-18', due:'2026-07-23', progress:10, assignee:'Jamie Rivera', customer:'Lucas Durand', type:'Proposal', attachments:[] },
  { id:3, title:'Product demo for James Lim', desc:'CloudNova starter package walkthrough.', status:'in-progress', priority:'high', startDate:'2026-07-16', due:'2026-07-22', progress:75, assignee:'Alex Morgan', customer:'James Lim', type:'Demo', attachments:[{ id:2, task_id:3, file_name:'demo_screenshot.png', original_name:'Product_Demo_Screenshot.png', file_type:'image/png', file_size:512000, file_path:'https://picsum.photos/400/250', created_at:'2026-07-16 14:30:00' }] },
  { id:4, title:'Re-engage David Park', desc:'Send re-activation email campaign.', status:'in-progress', priority:'medium', startDate:'2026-07-19', due:'2026-07-24', progress:50, assignee:'Alex Morgan', customer:'David Park', type:'Email', attachments:[] },
  { id:5, title:'Quarterly review — Sophie Müller', desc:'Executive QBR presentation prep.', status:'done', priority:'high', startDate:'2026-07-13', due:'2026-07-18', progress:100, assignee:'Sam Chen', customer:'Sophie Müller', type:'Meeting', attachments:[] },
  { id:6, title:'Onboarding Maria Reyes', desc:'New feature onboarding session completed.', status:'done', priority:'low', startDate:'2026-07-10', due:'2026-07-15', progress:100, assignee:'Jordan Lee', customer:'Maria Reyes', type:'Onboarding', attachments:[] },
  { id:7, title:'Update Priya Sharma contract', desc:'Growth plan annual renewal documents.', status:'todo', priority:'medium', startDate:'2026-07-23', due:'2026-07-29', progress:0, assignee:'Sam Chen', customer:'Priya Sharma', type:'Contract', attachments:[] },
  { id:8, title:'CRM data cleanup', desc:'Remove duplicate entries, update missing fields.', status:'in-progress', priority:'low', startDate:'2026-07-21', due:'2026-07-31', progress:40, assignee:'Taylor Nguyen', customer:null, type:'Internal', attachments:[] },
];


const activities = [
  { id:1, text:'Aisha Mohammed signed Enterprise Suite renewal', time:'2 hours ago', color:'#10b981', icon:'fa-file-signature' },
  { id:2, text:'James Lim demo scheduled for tomorrow', time:'4 hours ago', color:'#6366f1', icon:'fa-calendar-check' },
  { id:3, text:'New lead: Lucas Durand from WebCraft Paris', time:'6 hours ago', color:'#06b6d4', icon:'fa-user-plus' },
  { id:4, text:'David Park account marked inactive', time:'1 day ago', color:'#f59e0b', icon:'fa-user-minus' },
  { id:5, text:'Sophie Müller QBR completed successfully', time:'2 days ago', color:'#8b5cf6', icon:'fa-handshake' },
];

const chartData = [40, 65, 48, 72, 55, 80, 67, 90, 75, 95, 82, 100];

// type: 'bug' = free | 'request' = paid
let orderIdSeq = 100;
const orders = [
  { id:101, customerId:1, customerName:'Ariel Santos', type:'request', title:'API Integration Module', desc:'Build REST API integration with third-party ERP system.', status:'approved', amount:4500, date:'2026-06-10', quotationNo:'QT-2026-001', assignee:'Sam Chen' },
  { id:102, customerId:1, customerName:'Ariel Santos', type:'bug',     title:'Dashboard crash on refresh', desc:'Dashboard throws 500 error when user refreshes the page.', status:'resolved', amount:0, date:'2026-06-18', quotationNo:null, assignee:'Taylor Nguyen' },
  { id:103, customerId:1, customerName:'Ariel Santos', type:'request', title:'Custom Reporting Feature', desc:'Monthly revenue report export to PDF.', status:'pending', amount:2800, date:'2026-07-01', quotationNo:'QT-2026-008', assignee:'Jamie Rivera' },
  { id:104, customerId:2, customerName:'Maria Reyes',  type:'bug',     title:'Login loop on mobile', desc:'Users are redirected back to login page after successful auth on iOS.', status:'in-progress', amount:0, date:'2026-06-25', quotationNo:null, assignee:'Taylor Nguyen' },
  { id:105, customerId:2, customerName:'Maria Reyes',  type:'request', title:'Two-Factor Authentication', desc:'Add SMS-based 2FA to user accounts.', status:'approved', amount:1500, date:'2026-07-05', quotationNo:'QT-2026-010', assignee:'Sam Chen' },
  { id:106, customerId:4, customerName:'Sophie Müller',type:'request', title:'Data Analytics Dashboard', desc:'Advanced analytics with drill-down charts.', status:'approved', amount:12000, date:'2026-05-20', quotationNo:'QT-2026-003', assignee:'Sam Chen' },
  { id:107, customerId:4, customerName:'Sophie Müller',type:'bug',     title:'Export CSV encoding issue', desc:'German umlauts corrupted in CSV export.', status:'resolved', amount:0, date:'2026-06-30', quotationNo:null, assignee:'Taylor Nguyen' },
  { id:108, customerId:6, customerName:'Priya Sharma', type:'request', title:'White-label Branding', desc:'Custom logo and color scheme for client portal.', status:'pending', amount:3200, date:'2026-07-08', quotationNo:'QT-2026-012', assignee:'Jamie Rivera' },
  { id:109, customerId:8, customerName:'Aisha Mohammed',type:'request',title:'Multi-currency Support', desc:'Enable AED and USD transaction processing.', status:'approved', amount:8500, date:'2026-06-01', quotationNo:'QT-2026-005', assignee:'Sam Chen' },
  { id:110, customerId:8, customerName:'Aisha Mohammed',type:'bug',    title:'Notification emails delayed', desc:'Email alerts arriving 30+ minutes late.', status:'in-progress', amount:0, date:'2026-07-12', quotationNo:null, assignee:'Taylor Nguyen' },
];
