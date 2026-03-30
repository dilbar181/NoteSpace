/**
 * NoteSpace — Personal Notepad
 * script.js
 *
 * Arsitektur: State-driven vanilla JS
 * Data disimpan di localStorage dengan key "notespace_notes"
 */

// ============================================================
// 1. STATE & CONSTANTS
// ============================================================

const STORAGE_KEY = 'notespace_notes';
const THEME_KEY   = 'notespace_theme';
const DEBOUNCE_MS = 700; // delay auto-save setelah berhenti mengetik

/** State aplikasi terpusat */
let state = {
  notes:          [],   // array of note objects
  activeNoteId:   null, // id catatan yang sedang dibuka
  searchQuery:    '',   // teks pencarian saat ini
  isEditing:      false // apakah sedang mengetik (untuk autosave indicator)
};

let autosaveTimer = null; // timer debounce auto-save

// ============================================================
// 2. SELECTORS (DOM references)
// ============================================================

const $ = id => document.getElementById(id);

const DOM = {
  notesList:         $('notesList'),
  notesCount:        $('notesCount'),
  emptySidebar:      $('emptySidebar'),
  editorWrap:        $('editorWrap'),
  emptyMain:         $('emptyMain'),
  editorTitle:       $('editorTitle'),
  editorBody:        $('editorBody'),
  editorMeta:        $('editorMeta'),
  autosaveIndicator: $('autosaveIndicator'),
  autosaveLabel:     $('autosaveLabel'),
  searchInput:       $('searchInput'),
  searchClear:       $('searchClear'),
  themeToggle:       $('themeToggle'),
  themeIcon:         $('themeIcon'),
  btnNew:            $('btnNew'),
  btnDelete:         $('btnDelete'),
  btnEmptyCreate:    $('btnEmptyCreate'),
  dialogOverlay:     $('dialogOverlay'),
  btnCancel:         $('btnCancel'),
  btnConfirm:        $('btnConfirm'),
  toast:             $('toast'),
};

// ============================================================
// 3. STORAGE HELPERS
// ============================================================

/** Muat catatan dari localStorage */
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Simpan semua catatan ke localStorage */
function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
}

/** Muat preferensi tema */
function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

/** Simpan preferensi tema */
function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ============================================================
// 4. NOTE UTILITIES
// ============================================================

/** Generate ID unik sederhana */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Format timestamp ke string yang enak dibaca */
function formatDate(isoString) {
  const d   = new Date(isoString);
  const now = new Date();
  const diffMs   = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)   return 'Baru saja';
  if (diffMins < 60)  return `${diffMins} menit lalu`;
  if (diffHrs < 24)   return `${diffHrs} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7)   return `${diffDays} hari lalu`;

  // Lebih dari seminggu: tampilkan tanggal lengkap
  return d.toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

/** Format ISO ke tanggal + jam untuk metadata editor */
function formatFullDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  });
}

/** Buat objek catatan baru */
function createNote(title = '', body = '') {
  const now = new Date().toISOString();
  return {
    id:         generateId(),
    title,
    body,
    created_at: now,
    updated_at: now,
  };
}

/** Cari catatan berdasarkan ID */
function findNoteById(id) {
  return state.notes.find(n => n.id === id) || null;
}

/** Catatan yang telah difilter dan diurutkan (untuk tampilan) */
function getFilteredNotes() {
  const q = state.searchQuery.trim().toLowerCase();

  return state.notes
    .filter(n => {
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

// ============================================================
// 5. RENDER FUNCTIONS
// ============================================================

/**
 * Render ulang seluruh daftar catatan di sidebar.
 * Dipanggil setiap kali state berubah.
 */
function renderNotesList() {
  const filtered = getFilteredNotes();
  const q        = state.searchQuery.trim().toLowerCase();

  // Update jumlah catatan
  const total = state.notes.length;
  DOM.notesCount.textContent =
    total === 0 ? '0 catatan'
    : total === 1 ? '1 catatan'
    : `${total} catatan`;

  // Kosongkan list
  DOM.notesList.innerHTML = '';

  if (filtered.length === 0) {
    DOM.emptySidebar.style.display = 'flex';
    return;
  }

  DOM.emptySidebar.style.display = 'none';

  filtered.forEach(note => {
    const li = document.createElement('li');
    li.className = 'note-item' + (note.id === state.activeNoteId ? ' active' : '');
    li.dataset.id = note.id;

    // Highlight pencarian pada judul & preview
    const titleText   = note.title || 'Tanpa Judul';
    const previewText = note.body.replace(/\n+/g, ' ').slice(0, 80) || 'Tidak ada isi';

    li.innerHTML = `
      <div class="note-item-title">${highlight(titleText, q)}</div>
      <div class="note-item-preview">${highlight(previewText, q)}</div>
      <div class="note-item-date">${formatDate(note.updated_at)}</div>
    `;

    li.addEventListener('click', () => openNote(note.id));
    DOM.notesList.appendChild(li);
  });
}

/**
 * Render area editor untuk catatan yang aktif.
 */
function renderEditor() {
  const note = findNoteById(state.activeNoteId);

  if (!note) {
    // Tidak ada catatan dipilih → tampilkan empty state
    DOM.editorWrap.style.display = 'none';
    DOM.emptyMain.style.display  = 'flex';
    return;
  }

  // Tampilkan editor
  DOM.emptyMain.style.display  = 'none';
  DOM.editorWrap.style.display = 'flex';

  // Isi field (hanya jika berbeda agar cursor tidak melompat)
  if (DOM.editorTitle.value !== note.title) {
    DOM.editorTitle.value = note.title;
  }
  if (DOM.editorBody.value !== note.body) {
    DOM.editorBody.value = note.body;
  }

  // Meta info
  DOM.editorMeta.innerHTML = `
    <span>Dibuat: ${formatFullDate(note.created_at)}</span>
    <span>Diubah: ${formatFullDate(note.updated_at)}</span>
  `;

  // Set autosave ke "Tersimpan"
  setAutosaveStatus('saved');
}

/**
 * Highlight teks yang cocok dengan query pencarian.
 */
function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeRegex(query);
  const re      = new RegExp(`(${escaped})`, 'gi');
  return escapeHtml(text).replace(re, '<mark>$1</mark>');
}

/** Escape HTML untuk mencegah XSS */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape karakter khusus RegExp */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// 6. CORE ACTIONS
// ============================================================

/** Buka / pilih catatan */
function openNote(id) {
  if (state.activeNoteId === id) return;
  state.activeNoteId = id;
  renderNotesList();
  renderEditor();
  // Fokus ke body editor
  DOM.editorBody.focus();
}

/** Buat catatan baru dan langsung buka */
function newNote() {
  const note = createNote();
  state.notes.push(note);
  saveNotes();
  state.activeNoteId = note.id;
  renderNotesList();
  renderEditor();
  // Fokus ke judul agar langsung bisa mengetik
  DOM.editorTitle.focus();
}

/** Hapus catatan yang sedang aktif */
function deleteActiveNote() {
  const id = state.activeNoteId;
  if (!id) return;

  state.notes = state.notes.filter(n => n.id !== id);
  saveNotes();

  // Pilih catatan berikutnya (yang pertama setelah difilter)
  const filtered = getFilteredNotes();
  state.activeNoteId = filtered.length > 0 ? filtered[0].id : null;

  renderNotesList();
  renderEditor();
  showToast('Catatan dihapus');
}

/**
 * Auto-save: simpan konten editor ke catatan aktif.
 * Dipanggil setelah debounce delay.
 */
function autoSave() {
  const note = findNoteById(state.activeNoteId);
  if (!note) return;

  const newTitle = DOM.editorTitle.value;
  const newBody  = DOM.editorBody.value;

  // Cek apakah ada perubahan
  if (note.title === newTitle && note.body === newBody) {
    setAutosaveStatus('saved');
    return;
  }

  note.title      = newTitle;
  note.body       = newBody;
  note.updated_at = new Date().toISOString();

  saveNotes();
  renderNotesList(); // update preview & tanggal di sidebar
  setAutosaveStatus('saved');

  // Update meta tanpa re-render penuh editor
  DOM.editorMeta.innerHTML = `
    <span>Dibuat: ${formatFullDate(note.created_at)}</span>
    <span>Diubah: ${formatFullDate(note.updated_at)}</span>
  `;
}

// ============================================================
// 7. AUTOSAVE INDICATOR
// ============================================================

/** Tampilkan status autosave: 'saving' | 'saved' */
function setAutosaveStatus(status) {
  if (status === 'saving') {
    DOM.autosaveIndicator.classList.add('saving');
    DOM.autosaveLabel.textContent = 'Menyimpan…';
  } else {
    DOM.autosaveIndicator.classList.remove('saving');
    DOM.autosaveLabel.textContent = 'Tersimpan';
  }
}

// ============================================================
// 8. THEME
// ============================================================

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  DOM.themeIcon.textContent = theme === 'dark' ? '◑' : '◐';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveTheme(next);
}

// ============================================================
// 9. TOAST NOTIFICATION
// ============================================================

let toastTimer = null;

function showToast(message, duration = 2200) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, duration);
}

// ============================================================
// 10. DIALOG (Konfirmasi Hapus)
// ============================================================

function openDialog() {
  DOM.dialogOverlay.classList.add('open');
}

function closeDialog() {
  DOM.dialogOverlay.classList.remove('open');
}

// ============================================================
// 11. EVENT LISTENERS
// ============================================================

function attachEvents() {

  // Tombol catatan baru
  DOM.btnNew.addEventListener('click', newNote);
  DOM.btnEmptyCreate.addEventListener('click', newNote);

  // Toggle tema
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Input editor — debounce auto-save
  DOM.editorTitle.addEventListener('input', () => {
    setAutosaveStatus('saving');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autoSave, DEBOUNCE_MS);
  });

  DOM.editorBody.addEventListener('input', () => {
    setAutosaveStatus('saving');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(autoSave, DEBOUNCE_MS);
  });

  // Pencarian real-time
  DOM.searchInput.addEventListener('input', () => {
    state.searchQuery = DOM.searchInput.value;
    // Tampilkan / sembunyikan tombol clear
    DOM.searchClear.classList.toggle('visible', state.searchQuery.length > 0);
    renderNotesList();
  });

  // Clear pencarian
  DOM.searchClear.addEventListener('click', () => {
    DOM.searchInput.value = '';
    state.searchQuery     = '';
    DOM.searchClear.classList.remove('visible');
    DOM.searchInput.focus();
    renderNotesList();
  });

  // Tombol hapus catatan → buka dialog konfirmasi
  DOM.btnDelete.addEventListener('click', () => {
    if (state.activeNoteId) openDialog();
  });

  // Dialog: batal
  DOM.btnCancel.addEventListener('click', closeDialog);

  // Dialog: konfirmasi hapus
  DOM.btnConfirm.addEventListener('click', () => {
    closeDialog();
    deleteActiveNote();
  });

  // Tutup dialog saat klik overlay
  DOM.dialogOverlay.addEventListener('click', e => {
    if (e.target === DOM.dialogOverlay) closeDialog();
  });

  // Keyboard shortcut: Escape = tutup dialog
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDialog();

    // Ctrl/Cmd + N = catatan baru
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      newNote();
    }

    // Ctrl/Cmd + F = fokus ke search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      DOM.searchInput.focus();
      DOM.searchInput.select();
    }
  });
}

// ============================================================
// 12. INIT
// ============================================================

function init() {
  // Muat data
  state.notes = loadNotes();

  // Terapkan tema tersimpan
  const savedTheme = loadTheme();
  applyTheme(savedTheme);

  // Pilih catatan pertama secara default (jika ada)
  if (state.notes.length > 0) {
    const sorted = [...state.notes].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
    state.activeNoteId = sorted[0].id;
  }

  // Render awal
  renderNotesList();
  renderEditor();

  // Pasang event listener
  attachEvents();

  console.log(
    '%cNoteSpace initialized ✦',
    'color: #c8b89a; font-weight: bold; font-size: 14px;'
  );
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', init);
