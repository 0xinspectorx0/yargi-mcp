/**
 * Yargı MCP Mobile Web & PWA Client Application
 * Optimized for mobile touch, offline caching, and responsive legal research.
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    query: '',
    court: 'ALL',
    daire: 'ALL',
    dateStart: '',
    dateEnd: '',
    page: 1,
    pageSize: 10,
    totalPages: 1,
    activeDecision: null,
    bookmarks: [],
    theme: 'dark',
    readerFontSize: 16,
    readerFontFamily: 'sans',
    deferredInstallPrompt: null,
    isLoading: false
  };

  // --- DOM ELEMENTS ---
  const el = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    bookmarksNavBtn: document.getElementById('bookmarks-nav-btn'),
    bookmarkBadge: document.getElementById('bookmark-badge'),
    guideNavBtn: document.getElementById('guide-nav-btn'),
    brandHomeBtn: document.getElementById('brand-home-btn'),
    
    // Install Banner
    pwaInstallBanner: document.getElementById('pwa-install-banner'),
    pwaInstallBtn: document.getElementById('pwa-install-btn'),
    
    // Search Form
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    voiceSearchBtn: document.getElementById('voice-search-btn'),
    openFilterBtn: document.getElementById('open-filter-btn'),
    filterIndicator: document.getElementById('filter-indicator'),
    activeCourtLabel: document.getElementById('active-court-label'),
    
    // Court Tabs
    courtTabs: document.getElementById('court-tabs'),
    
    // Results
    resultsHeader: document.getElementById('results-header'),
    resultsCountText: document.getElementById('results-count-text'),
    resultsSourceTag: document.getElementById('results-source-tag'),
    loadingBox: document.getElementById('loading-box'),
    resultsList: document.getElementById('results-list'),
    initialStateBox: document.getElementById('initial-state-box'),
    
    // Bottom Nav
    bnavSearch: document.getElementById('bnav-search'),
    bnavBookmarks: document.getElementById('bnav-bookmarks'),
    bnavFilter: document.getElementById('bnav-filter'),
    bnavGuide: document.getElementById('bnav-guide'),
    
    // Modals
    filterModal: document.getElementById('filter-modal'),
    closeFilterModalBtn: document.getElementById('close-filter-modal-btn'),
    filterCourtSelect: document.getElementById('filter-court-select'),
    filterDaireSelect: document.getElementById('filter-daire-select'),
    filterDateStart: document.getElementById('filter-date-start'),
    filterDateEnd: document.getElementById('filter-date-end'),
    filterResetBtn: document.getElementById('filter-reset-btn'),
    filterApplyBtn: document.getElementById('filter-apply-btn'),
    
    bookmarksModal: document.getElementById('bookmarks-modal'),
    closeBookmarksModalBtn: document.getElementById('close-bookmarks-modal-btn'),
    bookmarksList: document.getElementById('bookmarks-list'),
    
    guideModal: document.getElementById('guide-modal'),
    closeGuideModalBtn: document.getElementById('close-guide-modal-btn'),
    guideOkBtn: document.getElementById('guide-ok-btn'),
    
    // Reader Modal
    readerModal: document.getElementById('reader-modal'),
    readerBackBtn: document.getElementById('reader-back-btn'),
    readerFontDecBtn: document.getElementById('reader-font-dec-btn'),
    readerFontIncBtn: document.getElementById('reader-font-inc-btn'),
    readerFontFamilyBtn: document.getElementById('reader-font-family-btn'),
    readerCopyCitationBtn: document.getElementById('reader-copy-citation-btn'),
    tabBtnText: document.getElementById('tab-btn-text'),
    tabBtnAi: document.getElementById('tab-btn-ai'),
    readerContentText: document.getElementById('reader-content-text'),
    readerContentAi: document.getElementById('reader-content-ai'),
    readerTextBody: document.getElementById('reader-text-body'),
    aiSummaryBody: document.getElementById('ai-summary-body'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
  };

  // --- INITIALIZATION ---
  function init() {
    loadPreferences();
    setupPWA();
    setupSpeechRecognition();
    setupEventListeners();
    updateBookmarkBadge();
  }

  // --- PREFERENCES & LOCALSTORAGE ---
  function loadPreferences() {
    // Theme
    const savedTheme = localStorage.getItem('yargi_theme');
    if (savedTheme) {
      state.theme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      state.theme = 'light';
    }
    applyTheme(state.theme);

    // Bookmarks
    try {
      const savedBookmarks = localStorage.getItem('yargi_bookmarks');
      if (savedBookmarks) {
        state.bookmarks = JSON.parse(savedBookmarks);
      }
    } catch (e) {
      state.bookmarks = [];
    }

    // Reader Font
    const savedFontSize = localStorage.getItem('yargi_reader_font_size');
    if (savedFontSize) {
      state.readerFontSize = parseInt(savedFontSize, 10);
      updateReaderFontSize();
    }
  }

  function applyTheme(theme) {
    state.theme = theme;
    el.html.setAttribute('data-theme', theme);
    localStorage.setItem('yargi_theme', theme);
    el.themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }

  // --- PWA & SERVICE WORKER ---
  function setupPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js').catch((err) => {
          console.log('SW registration error:', err);
        });
      });
    }

    // Capture install prompt on Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (el.pwaInstallBanner) {
        el.pwaInstallBanner.style.display = 'flex';
      }
    });

    if (el.pwaInstallBtn) {
      el.pwaInstallBtn.addEventListener('click', async () => {
        if (state.deferredInstallPrompt) {
          state.deferredInstallPrompt.prompt();
          const { outcome } = await state.deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            el.pwaInstallBanner.style.display = 'none';
          }
          state.deferredInstallPrompt = null;
        } else {
          openModal(el.guideModal);
        }
      });
    }
  }

  // --- SPEECH RECOGNITION (VOICE SEARCH) ---
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && el.voiceSearchBtn) {
      el.voiceSearchBtn.style.display = 'flex';
      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.interimResults = false;

      el.voiceSearchBtn.addEventListener('click', () => {
        showToast('Dinleniyor... Konuşun 🎙️');
        el.voiceSearchBtn.style.color = '#ef4444';
        try {
          recognition.start();
        } catch (e) {
          recognition.stop();
        }
      });

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        el.searchInput.value = transcript;
        el.clearSearchBtn.style.display = 'flex';
        el.voiceSearchBtn.style.color = '';
        showToast(`"${transcript}" aranıyor...`);
        performSearch();
      };

      recognition.onerror = () => {
        el.voiceSearchBtn.style.color = '';
        showToast('Ses anlaşılamadı, tekrar deneyin.');
      };

      recognition.onend = () => {
        el.voiceSearchBtn.style.color = '';
      };
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme toggle
    el.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Brand logo returns to home view
    el.brandHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetHomeView();
    });

    // Search input typing
    el.searchInput.addEventListener('input', () => {
      el.clearSearchBtn.style.display = el.searchInput.value.trim() ? 'flex' : 'none';
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      el.clearSearchBtn.style.display = 'none';
      el.searchInput.focus();
    });

    // Search submit
    el.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch();
    });

    // Court pills
    el.courtTabs.addEventListener('click', (e) => {
      const chip = e.target.closest('.court-chip');
      if (!chip) return;
      document.querySelectorAll('.court-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.court = chip.getAttribute('data-court');
      state.page = 1;
      updateCourtLabel();
      if (state.query) {
        performSearch();
      }
    });

    // Suggestion chips
    document.querySelectorAll('.chip-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const q = tag.getAttribute('data-query');
        el.searchInput.value = q;
        el.clearSearchBtn.style.display = 'flex';
        performSearch();
      });
    });

    // Bottom Navigation Bar
    el.bnavSearch.addEventListener('click', () => {
      closeAllModals();
      setBottomNavActive(el.bnavSearch);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    el.bnavBookmarks.addEventListener('click', () => {
      setBottomNavActive(el.bnavBookmarks);
      renderBookmarksModal();
      openModal(el.bookmarksModal);
    });

    el.bookmarksNavBtn.addEventListener('click', () => {
      renderBookmarksModal();
      openModal(el.bookmarksModal);
    });

    el.bnavFilter.addEventListener('click', () => {
      setBottomNavActive(el.bnavFilter);
      openFilterModal();
    });

    el.openFilterBtn.addEventListener('click', () => {
      openFilterModal();
    });

    el.bnavGuide.addEventListener('click', () => {
      setBottomNavActive(el.bnavGuide);
      openModal(el.guideModal);
    });

    el.guideNavBtn.addEventListener('click', () => {
      openModal(el.guideModal);
    });

    // Modals close buttons
    el.closeFilterModalBtn.addEventListener('click', () => closeModal(el.filterModal));
    el.closeBookmarksModalBtn.addEventListener('click', () => closeModal(el.bookmarksModal));
    el.closeGuideModalBtn.addEventListener('click', () => closeModal(el.guideModal));
    el.guideOkBtn.addEventListener('click', () => closeModal(el.guideModal));

    // Overlay click to close
    [el.filterModal, el.bookmarksModal, el.guideModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // Filter Apply & Reset
    el.filterApplyBtn.addEventListener('click', () => {
      state.court = el.filterCourtSelect.value;
      state.daire = el.filterDaireSelect.value;
      state.dateStart = el.filterDateStart.value;
      state.dateEnd = el.filterDateEnd.value;
      state.page = 1;
      
      // Sync court pills
      document.querySelectorAll('.court-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-court') === state.court);
      });
      updateCourtLabel();
      updateFilterIndicator();
      closeModal(el.filterModal);
      if (state.query) {
        performSearch();
      }
    });

    el.filterResetBtn.addEventListener('click', () => {
      el.filterCourtSelect.value = 'ALL';
      el.filterDaireSelect.value = 'ALL';
      el.filterDateStart.value = '';
      el.filterDateEnd.value = '';
      state.court = 'ALL';
      state.daire = 'ALL';
      state.dateStart = '';
      state.dateEnd = '';
      document.querySelectorAll('.court-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-court') === 'ALL');
      });
      updateCourtLabel();
      updateFilterIndicator();
    });

    // Reader controls
    el.readerBackBtn.addEventListener('click', () => {
      el.readerModal.classList.remove('open');
      document.body.style.overflow = '';
    });

    el.readerFontDecBtn.addEventListener('click', () => {
      if (state.readerFontSize > 12) {
        state.readerFontSize -= 2;
        updateReaderFontSize();
      }
    });

    el.readerFontIncBtn.addEventListener('click', () => {
      if (state.readerFontSize < 28) {
        state.readerFontSize += 2;
        updateReaderFontSize();
      }
    });

    el.readerFontFamilyBtn.addEventListener('click', () => {
      if (state.readerFontFamily === 'sans') {
        state.readerFontFamily = 'serif';
        el.readerFontFamilyBtn.textContent = 'Sans';
        document.documentElement.style.setProperty('--reader-font', 'var(--font-serif)');
      } else {
        state.readerFontFamily = 'sans';
        el.readerFontFamilyBtn.textContent = 'Serif';
        document.documentElement.style.setProperty('--reader-font', 'var(--font-sans)');
      }
    });

    el.readerCopyCitationBtn.addEventListener('click', () => {
      if (state.activeDecision && state.activeDecision.citation) {
        copyToClipboard(state.activeDecision.citation, '📋 Hukuki atıf kopyalandı!');
      }
    });

    // Reader tabs (Text vs AI)
    el.tabBtnText.addEventListener('click', () => {
      el.tabBtnText.classList.add('active');
      el.tabBtnAi.classList.remove('active');
      el.readerContentText.style.display = 'block';
      el.readerContentAi.style.display = 'none';
    });

    el.tabBtnAi.addEventListener('click', () => {
      el.tabBtnAi.classList.add('active');
      el.tabBtnText.classList.remove('active');
      el.readerContentText.style.display = 'none';
      el.readerContentAi.style.display = 'block';
      loadAISummary();
    });
  }

  function setBottomNavActive(target) {
    document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
    target.classList.add('active');
  }

  function updateCourtLabel() {
    const courtLabels = {
      'ALL': 'Tüm Mahkemeler',
      'YARGITAY': 'Yargıtay (Adli Temyiz)',
      'DANISTAY': 'Danıştay (İdari Temyiz)',
      'ANAYASA': 'Anayasa Mahkemesi',
      'EMSAL': 'Emsal Kararlar (UYAP)',
      'KIK': 'Kamu İhale Kurulu',
      'REKABET': 'Rekabet Kurumu',
      'SAYISTAY': 'Sayıştay',
      'KVKK': 'KVKK & BDDK'
    };
    el.activeCourtLabel.textContent = courtLabels[state.court] || 'Tüm Mahkemeler';
  }

  function updateFilterIndicator() {
    const hasFilter = state.court !== 'ALL' || state.daire !== 'ALL' || state.dateStart || state.dateEnd;
    el.filterIndicator.style.display = hasFilter ? 'inline-block' : 'none';
  }

  function updateReaderFontSize() {
    document.documentElement.style.setProperty('--reader-font-size', state.readerFontSize + 'px');
    localStorage.setItem('yargi_reader_font_size', state.readerFontSize);
  }

  function openFilterModal() {
    el.filterCourtSelect.value = state.court;
    el.filterDaireSelect.value = state.daire;
    el.filterDateStart.value = state.dateStart;
    el.filterDateEnd.value = state.dateEnd;
    openModal(el.filterModal);
  }

  function openModal(modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    setBottomNavActive(el.bnavSearch);
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }

  function resetHomeView() {
    el.searchInput.value = '';
    state.query = '';
    state.court = 'ALL';
    state.daire = 'ALL';
    state.dateStart = '';
    state.dateEnd = '';
    el.clearSearchBtn.style.display = 'none';
    document.querySelectorAll('.court-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-court') === 'ALL');
    });
    updateCourtLabel();
    updateFilterIndicator();
    el.resultsHeader.style.display = 'none';
    el.resultsList.innerHTML = '';
    el.resultsList.appendChild(el.initialStateBox);
    el.initialStateBox.style.display = 'flex';
  }

  // --- SEARCH EXECUTION ---
  async function performSearch() {
    const query = el.searchInput.value.trim();
    if (!query) {
      showToast('Lütfen arama terimi girin.');
      el.searchInput.focus();
      return;
    }

    state.query = query;
    state.isLoading = true;

    // UI Loading state
    el.initialStateBox.style.display = 'none';
    el.loadingBox.style.display = 'flex';
    el.resultsList.querySelectorAll('.decision-card').forEach(c => c.remove());
    el.resultsHeader.style.display = 'none';

    // Build API query parameters
    const params = new URLSearchParams({
      q: state.query,
      court: state.court,
      daire: state.daire,
      page: state.page,
      page_size: state.pageSize
    });
    if (state.dateStart) params.append('date_start', state.dateStart);
    if (state.dateEnd) params.append('date_end', state.dateEnd);

    try {
      const response = await fetch(`/api/mobile/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Arama sunucusuna bağlanılamadı');
      }
      const data = await response.json();
      renderResults(data);
    } catch (error) {
      console.error('Search error:', error);
      el.loadingBox.style.display = 'none';
      renderSearchError(error.message);
    } finally {
      state.isLoading = false;
    }
  }

  // --- RENDER SEARCH RESULTS ---
  function renderResults(data) {
    el.loadingBox.style.display = 'none';
    el.resultsList.innerHTML = '';

    const results = data.results || [];
    const total = data.total || 0;

    el.resultsHeader.style.display = 'flex';
    el.resultsCountText.textContent = `${total} karar bulundu`;
    el.resultsSourceTag.textContent = data.source === 'live_api' ? '⚡ Canlı Adalet API' : '🏛️ Emsal Arşivi';

    if (results.length === 0) {
      el.resultsList.innerHTML = `
        <div class="state-box">
          <div class="state-icon">🔍</div>
          <div class="state-title">Eşleşen Karar Bulunamadı</div>
          <div class="state-desc">Arama terimlerinizi basitleştirin veya filtreleri temizleyip tekrar deneyin.</div>
        </div>
      `;
      return;
    }

    results.forEach(dec => {
      const card = document.createElement('div');
      card.className = 'decision-card';
      
      const isBookmarked = state.bookmarks.some(b => b.id === dec.id);
      const courtClass = getCourtBadgeClass(dec.court);
      const highlightedSnippet = highlightKeywords(dec.snippet || dec.konu, state.query);

      card.innerHTML = `
        <div class="card-top">
          <div class="card-badges">
            <span class="badge-court ${courtClass}">${dec.court_name || dec.court}</span>
            <span class="badge-daire">${dec.daire || 'Daire'}</span>
          </div>
          <span class="card-date">📅 ${dec.karar_tarihi_str || dec.karar_tarihi || ''}</span>
        </div>
        
        <div class="card-numbers">
          <span>Esas: ${dec.esas_no || '-'}</span>
          <span>Karar: ${dec.karar_no || '-'}</span>
        </div>

        <div class="card-title">${dec.konu || 'Hukuki Uyuşmazlık'}</div>
        <div class="card-snippet">${highlightedSnippet}</div>

        <div class="card-footer">
          <div class="card-actions">
            <button type="button" class="btn-card btn-read-main open-reader-btn" data-id="${dec.id}">
              📖 Tam Metin
            </button>
            <button type="button" class="btn-card copy-citation-card-btn" data-id="${dec.id}" title="Atıf Kopyala">
              📋
            </button>
            <button type="button" class="btn-card share-card-btn" data-id="${dec.id}" title="Paylaş">
              🔗
            </button>
          </div>
          <button type="button" class="btn-card btn-bookmark-card ${isBookmarked ? 'active' : ''}" data-id="${dec.id}" title="Kaydet">
            ${isBookmarked ? '★ Kaydedildi' : '☆ Kaydet'}
          </button>
        </div>
      `;

      // Event listeners for card buttons
      card.querySelector('.open-reader-btn').addEventListener('click', () => openDecisionReader(dec.id));
      card.querySelector('.copy-citation-card-btn').addEventListener('click', () => {
        const citation = `${dec.court_name || 'Mahkeme'} ${dec.daire || ''}, E. ${dec.esas_no || ''}, K. ${dec.karar_no || ''}, T. ${dec.karar_tarihi_str || ''}`;
        copyToClipboard(citation, '📋 Hukuki atıf kopyalandı!');
      });
      card.querySelector('.share-card-btn').addEventListener('click', () => shareDecision(dec));
      
      const bookmarkBtn = card.querySelector('.btn-bookmark-card');
      bookmarkBtn.addEventListener('click', () => toggleBookmark(dec, bookmarkBtn));

      el.resultsList.appendChild(card);
    });
  }

  function renderSearchError(msg) {
    el.resultsList.innerHTML = `
      <div class="state-box">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Arama Gerçekleştirilemedi</div>
        <div class="state-desc">${msg}. Lütfen bağlantınızı kontrol edip tekrar deneyin.</div>
      </div>
    `;
  }

  function getCourtBadgeClass(court) {
    if (!court) return '';
    const c = court.toUpperCase();
    if (c.includes('YARGITAY')) return 'court-yargitay';
    if (c.includes('DANISTAY')) return 'court-danistay';
    if (c.includes('ANAYASA') || c.includes('AYM')) return 'court-aym';
    if (c.includes('KIK')) return 'court-kik';
    if (c.includes('REKABET')) return 'court-rekabet';
    if (c.includes('SAYISTAY')) return 'court-sayistay';
    return '';
  }

  function highlightKeywords(text, query) {
    if (!text || !query) return text || '';
    const words = query.trim().split(/\s+/).filter(w => w.length > 2);
    if (!words.length) return text;
    let safeText = escapeHTML(text);
    words.forEach(w => {
      const reg = new RegExp(`(${escapeRegExp(w)})`, 'gi');
      safeText = safeText.replace(reg, '<mark>$1</mark>');
    });
    return safeText;
  }

  // --- DECISION READER VIEW ---
  async function openDecisionReader(docId) {
    // Open reader modal
    el.readerModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Reset tabs
    el.tabBtnText.click();

    // Show loading in reader body
    el.readerTextBody.innerHTML = `
      <div class="state-box">
        <div class="spinner"></div>
        <div class="state-title">Karar metni yükleniyor...</div>
      </div>
    `;

    try {
      const res = await fetch(`/api/mobile/decision/${docId}`);
      if (!res.ok) throw new Error('Karar metni getirilemedi');
      const data = await res.json();
      state.activeDecision = data.decision;
      renderDecisionMarkdown(data.decision);
    } catch (err) {
      el.readerTextBody.innerHTML = `
        <div class="state-box">
          <div class="state-icon">❌</div>
          <div class="state-title">Belge Yüklenemedi</div>
          <div class="state-desc">${err.message}</div>
        </div>
      `;
    }
  }

  function renderDecisionMarkdown(dec) {
    const rawMd = dec.markdown || dec.snippet || '';
    el.readerTextBody.innerHTML = markdownToHTML(rawMd);
  }

  // Simple, fast Markdown-to-HTML parser for legal texts
  function markdownToHTML(md) {
    if (!md) return '';
    let html = escapeHTML(md);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Horizontal Rule
    html = html.replace(/^---$/gim, '<hr>');

    // Blockquote
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Paragraphs
    const lines = html.split(/\n\n+/);
    return lines.map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<h') || line.startsWith('<hr') || line.startsWith('<blockquote')) {
        return line;
      }
      return `<p>${line.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  // --- AI SUMMARY TAB ---
  async function loadAISummary() {
    if (!state.activeDecision) return;

    el.aiSummaryBody.innerHTML = `
      <div class="state-box">
        <div class="spinner"></div>
        <div class="state-title">Yapay Zeka Kararı Analiz Ediyor...</div>
        <div class="state-desc">Dava konusu, hukuki sorun ve mahkeme gerekçesi çıkarılıyor.</div>
      </div>
    `;

    try {
      const res = await fetch('/api/mobile/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: state.activeDecision.id,
          content: state.activeDecision.markdown
        })
      });

      if (!res.ok) throw new Error('AI analizi üretilemedi');
      const data = await res.json();
      renderAISummary(data);
    } catch (err) {
      el.aiSummaryBody.innerHTML = `
        <div class="state-box">
          <div class="state-icon">⚠️</div>
          <div class="state-title">Analiz Hazırlanamadı</div>
          <div class="state-desc">${err.message}</div>
        </div>
      `;
    }
  }

  function renderAISummary(data) {
    const mevzuatBadges = (data.mevzuat_maddeleri || []).map(m => `<span class="badge-daire" style="margin-right:4px;">${m}</span>`).join('');

    el.aiSummaryBody.innerHTML = `
      <div class="ai-card">
        <div class="ai-card-title">📌 Dava Konusu ve Olay</div>
        <div class="ai-card-body">${data.dava_konusu}</div>
      </div>

      <div class="ai-card">
        <div class="ai-card-title">⚖️ Hukuki Uyuşmazlık</div>
        <div class="ai-card-body">${data.hukuki_sorun}</div>
      </div>

      <div class="ai-card">
        <div class="ai-card-title">🏛️ Mahkemenin Hukuki Gerekçesi</div>
        <div class="ai-card-body">${data.mahkeme_gerekcesi}</div>
      </div>

      <div class="ai-card">
        <div class="ai-card-title">📜 Hüküm ve Karar Sonucu</div>
        <div class="ai-card-body"><strong>${data.hukum_sonucu}</strong></div>
      </div>

      <div class="ai-tip-box">
        <div class="ai-tip-title">💡 Avukatlar ve Uygulayıcılar İçin Not</div>
        <div class="ai-card-body">${data.pratik_ipucu}</div>
      </div>

      <div class="ai-card">
        <div class="ai-card-title">📚 İlgili Mevzuat Dayanakları</div>
        <div style="margin-top:6px;">${mevzuatBadges || 'Genel Kanun Hükümleri'}</div>
      </div>
    `;
  }

  // --- BOOKMARKS & OFFLINE STORAGE ---
  function toggleBookmark(dec, btnEl) {
    const idx = state.bookmarks.findIndex(b => b.id === dec.id);
    if (idx >= 0) {
      state.bookmarks.splice(idx, 1);
      if (btnEl) {
        btnEl.classList.remove('active');
        btnEl.textContent = '☆ Kaydet';
      }
      showToast('Karar favorilerden çıkarıldı.');
    } else {
      state.bookmarks.unshift({
        id: dec.id,
        court: dec.court,
        court_name: dec.court_name,
        daire: dec.daire,
        esas_no: dec.esas_no,
        karar_no: dec.karar_no,
        karar_tarihi_str: dec.karar_tarihi_str,
        konu: dec.konu,
        saved_at: new Date().toISOString()
      });
      if (btnEl) {
        btnEl.classList.add('active');
        btnEl.textContent = '★ Kaydedildi';
      }
      showToast('📑 Karar kaydedildi! İnternetsiz okunabilir.');
    }

    localStorage.setItem('yargi_bookmarks', JSON.stringify(state.bookmarks));
    updateBookmarkBadge();
  }

  function updateBookmarkBadge() {
    const count = state.bookmarks.length;
    if (count > 0) {
      el.bookmarkBadge.textContent = count;
      el.bookmarkBadge.style.display = 'flex';
    } else {
      el.bookmarkBadge.style.display = 'none';
    }
  }

  function renderBookmarksModal() {
    if (state.bookmarks.length === 0) {
      el.bookmarksList.innerHTML = `
        <div class="state-box">
          <div class="state-icon">📑</div>
          <div class="state-title">Henüz Karar Kaydetmediniz</div>
          <div class="state-desc">Arama sonuçlarındaki "Kaydet" butonuna dokunarak kararları bu listeye ekleyebilir, çevrimdışı okuyabilirsiniz.</div>
        </div>
      `;
      return;
    }

    el.bookmarksList.innerHTML = '';
    state.bookmarks.forEach(dec => {
      const item = document.createElement('div');
      item.className = 'decision-card';
      item.style.padding = '12px';
      item.innerHTML = `
        <div class="card-top">
          <span class="badge-court">${dec.court_name || dec.court}</span>
          <span class="card-date">${dec.karar_tarihi_str || ''}</span>
        </div>
        <div class="card-numbers">
          <span>E: ${dec.esas_no}</span>
          <span>K: ${dec.karar_no}</span>
        </div>
        <div class="card-title" style="font-size:14px;">${dec.konu || 'Hukuki Karar'}</div>
        <div class="card-footer" style="padding-top:6px;">
          <button type="button" class="btn-card btn-read-main open-bookmarked-btn" data-id="${dec.id}">
            Oku
          </button>
          <button type="button" class="btn-card delete-bookmark-btn" data-id="${dec.id}" style="color:var(--accent-red);">
            🗑️ Sil
          </button>
        </div>
      `;

      item.querySelector('.open-bookmarked-btn').addEventListener('click', () => {
        closeModal(el.bookmarksModal);
        openDecisionReader(dec.id);
      });

      item.querySelector('.delete-bookmark-btn').addEventListener('click', () => {
        toggleBookmark(dec);
        renderBookmarksModal();
      });

      el.bookmarksList.appendChild(item);
    });
  }

  // --- SHARE FUNCTIONALITY ---
  async function shareDecision(dec) {
    const title = `${dec.court_name || 'Yargı Kararı'} (${dec.esas_no || ''} - ${dec.karar_no || ''})`;
    const text = `${dec.konu}\n${dec.snippet || ''}`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User dismissed share
      }
    } else {
      copyToClipboard(`${title}\n${text}\n${url}`, '🔗 Karar bilgisi panoya kopyalandı!');
    }
  }

  // --- UTILS ---
  function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(successMessage);
    }
  }

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toastMessage.textContent = msg;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2800);
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);
})();
