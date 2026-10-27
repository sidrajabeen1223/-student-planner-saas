const $ = (id) => document.getElementById(id);
const TASK_KEY = 'studyflow_tasks_v1';
const SESSION_KEY = 'studyflow_sessions_v1';
let tasks = load(TASK_KEY);
let sessions = load(SESSION_KEY);
function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function save() { localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); localStorage.setItem(SESSION_KEY, JSON.stringify(sessions)); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function localDate(date) { const d = new Date(date); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
const now = new Date();
$('today').textContent = now.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric', year:'numeric'});
$('greeting').textContent = `${now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'}! 👋`;
$('sessionDate').value = localDate(now);
function renderTasks() {
  const list = $('taskList');
  list.innerHTML = '';
  $('emptyState').hidden = tasks.length > 0;
  tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = `task-item ${task.done ? 'done' : ''}`;
    row.innerHTML = `<input type="checkbox" aria-label="Mark task complete" ${task.done?'checked':''}><span class="task-name">${escapeHTML(task.name)}</span><span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span><button class="delete-btn" aria-label="Delete task">×</button>`;
    row.querySelector('input').addEventListener('change', e => { task.done = e.target.checked; save(); renderTasks(); });
    row.querySelector('.delete-btn').addEventListener('click', () => { tasks = tasks.filter(t => t.id !== task.id); save(); renderTasks(); });
    list.appendChild(row);
  });
  const done = tasks.filter(t => t.done).length;
  $('completedCount').textContent = done;
  $('remainingCount').textContent = tasks.length - done;
  $('taskPill').textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
}
$('taskForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('taskInput').value.trim();
  if (!name) return;
  tasks.unshift({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, priority: $('priorityInput').value, done:false});
  $('taskInput').value = '';
  save(); renderTasks();
});
function renderSessions() {
  sessions.sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  $('sessionList').innerHTML = '';
  const upcoming = sessions.filter(s => s.date >= localDate(now));
  $('sessionCount').textContent = upcoming.filter(s => s.date === localDate(now)).length;
  if (!upcoming.length) {
    $('sessionList').innerHTML = '<div class="empty-state"><span>◷</span><strong>No sessions planned yet</strong><p>Add a study session above.</p></div>';
    return;
  }
  upcoming.slice(0,6).forEach(session => {
    const d = new Date(`${session.date}T12:00:00`);
    const row = document.createElement('div');
    row.className = 'session-item';
    row.innerHTML = `<div class="session-date"><strong>${d.getDate()}</strong><small>${d.toLocaleDateString(undefined,{month:'short'})}</small></div><div class="session-info"><strong>${escapeHTML(session.title)}</strong><small>${d.toLocaleDateString(undefined,{weekday:'short'})} · ${escapeHTML(session.time)}</small></div><button class="delete-btn" aria-label="Delete session">×</button>`;
    row.querySelector('.delete-btn').addEventListener('click', () => { sessions = sessions.filter(s => s.id !== session.id); save(); renderSessions(); });
    $('sessionList').appendChild(row);
  });
}
$('sessionForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('sessionTitle').value.trim(), date = $('sessionDate').value, time = $('sessionTime').value;
  if (!title || !date || !time) return;
  if (date < localDate(now)) { alert('Please choose today or a future date.'); return; }
  sessions.push({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, date, time});
  $('sessionTitle').value = '';
  save(); renderSessions();
});
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  const target = button.dataset.view;
  if (target === 'tasks') $('taskInput').focus();
  if (target === 'schedule') $('sessionTitle').focus();
  if (target === 'overview') window.scrollTo({top:0,behavior:'smooth'});
}));
renderTasks(); renderSessions();
