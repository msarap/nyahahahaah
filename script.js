document.addEventListener('DOMContentLoaded', () => {

  // Progress is intentionally NOT saved between visits — every time
  // this page is opened it should start fresh at the cover page with
  // all gifts locked except the first one.
  function loadState() {
    return { openedGifts: [], sawCover: false, sawGifts: false };
  }
  function saveState() {}
  let state = loadState();

  const book = document.getElementById('book');
  const btnStart = document.getElementById('btnStart');
  const btnBack = document.getElementById('btnBack');
  const btnNextPage = document.getElementById('btnNextPage');
  const btnBackCourt = document.getElementById('btnBackCourt');

  function goToGiftsPage() { book.classList.add('flipped'); state.sawCover = true; saveState(); }
  function goToCoverPage() { book.classList.remove('flipped'); }
  function goToCourtPage() {
    if (![1,2,3,4].every(isOpened)) return; // page 3 stays locked until all gifts are opened
    book.classList.add('court-open');
    state.sawGifts = true;
    saveState();
  }
  function goBackFromCourtPage() { book.classList.remove('court-open'); }

  btnStart.addEventListener('click', () => {
    spawnFloaties(btnStart, ['💜', '✨', '⭐'], 6);
    setTimeout(goToGiftsPage, 150);
  });
  btnBack.addEventListener('click', goToCoverPage);
  btnNextPage.addEventListener('click', goToCourtPage);
  btnBackCourt.addEventListener('click', goBackFromCourtPage);

  const giftEls = {
    1: document.getElementById('gift1'),
    2: document.getElementById('gift2'),
    3: document.getElementById('gift3'),
    4: document.getElementById('gift4'),
  };
  const dots = document.querySelectorAll('.dot');

  function isOpened(n) { return state.openedGifts.includes(n); }
  function isUnlocked(n) { if (n === 1) return true; return isOpened(n - 1); }

  function renderGifts(justUnlockedNum) {
    [1,2,3,4].forEach(n => {
      const el = giftEls[n];
      el.classList.remove('locked', 'opened', 'just-unlocked');
      const unlocked = isUnlocked(n);
      if (isOpened(n)) el.classList.add('opened');
      else if (!unlocked) el.classList.add('locked');
      // hard-disable the button itself when locked — this blocks
      // clicks, taps, and keyboard activation at the browser level,
      // not just in the JS check above
      el.disabled = !unlocked;
      if (n === justUnlockedNum) el.classList.add('just-unlocked');
    });
    dots.forEach(dot => {
      const n = Number(dot.dataset.dot);
      dot.classList.toggle('done', isOpened(n));
    });

    // page 3 (the court page) stays locked until every gift is opened
    const allGiftsOpened = [1,2,3,4].every(isOpened);
    btnNextPage.disabled = !allGiftsOpened;
    btnNextPage.classList.toggle('locked', !allGiftsOpened);
    btnNextPage.textContent = allGiftsOpened ? 'next page' : '🔒 next page';
  }

  function openGift(n) {
    if (!isUnlocked(n)) return;
    const el = giftEls[n];
    el.classList.add('opening');
    spawnFloaties(el, ['🎉', '💫', '💜'], 5);

    setTimeout(() => {
      el.classList.remove('opening');
      const wasAlreadyOpened = isOpened(n);
      if (!wasAlreadyOpened) { state.openedGifts.push(n); saveState(); }
      openModal('modal' + n);
      if (!wasAlreadyOpened) setTimeout(() => renderGifts(n + 1), 300);
      else renderGifts();
    }, 280);
  }

  [1,2,3,4].forEach(n => giftEls[n].addEventListener('click', () => openGift(n)));
  renderGifts();

  // ============================================================
  // PAGE 3: COURT QUESTION
  // ============================================================
  const courtFrame = document.getElementById('courtFrame');
  const btnCourtYes = document.getElementById('btnCourtYes');
  const btnCourtNo = document.getElementById('btnCourtNo');
  const courtSadSticker = document.getElementById('courtSadSticker');
  const courtCheer = document.getElementById('courtCheer');

  const YES_SCALE_STEP = 0.35;   // how much bigger the yes button gets per "no" click
  const YES_SCALE_MAX = 2.3;     // cap so it never breaks the layout
  const SAD_STICKER_AFTER = 2;   // number of "no" clicks before the sad sticker shows
  let noClickCount = 0;

  btnCourtNo.addEventListener('click', () => {
    noClickCount++;
    const newScale = Math.min(1 + noClickCount * YES_SCALE_STEP, YES_SCALE_MAX);
    btnCourtYes.style.setProperty('--yes-scale', newScale);

    if (noClickCount >= SAD_STICKER_AFTER) {
      // remove + re-add so the pop animation replays every extra click
      courtSadSticker.classList.remove('pop');
      void courtSadSticker.offsetWidth;
      courtSadSticker.classList.add('pop');
    }
  });

  btnCourtYes.addEventListener('click', () => {
    // spawn the burst while the button is still visible/positioned,
    // THEN hide the question+choices and reveal the celebration
    spawnFloaties(btnCourtYes, ['🎉', '💜', '✨', '💕', '🎀'], 10);
    courtFrame.classList.add('answered');
    courtCheer.classList.add('show');
    setTimeout(() => spawnFloaties(courtCheer, ['🎉', '💫', '💖'], 8), 300);
    setTimeout(() => spawnFloaties(courtCheer, ['✨', '💜', '🌟'], 8), 600);
  });

  function openModal(id) {
    const overlay = document.getElementById(id);
    overlay.classList.add('open');
    if (id === 'modal2') {
      const bouquet = document.getElementById('bouquetDisplay');
      bouquet.classList.remove('bloom');
      void bouquet.offsetWidth;
      bouquet.classList.add('bloom');
    }
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'modal3') pauseSong();
  }
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay.id); });
  });

  const audio = document.getElementById('audioPlayer');
  const btnPlay = document.getElementById('btnPlay');
  const disc = document.getElementById('playerDisc');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressKnob = document.getElementById('progressKnob');
  const timeCurrent = document.getElementById('timeCurrent');
  const timeTotal = document.getElementById('timeTotal');
  const btnRewind = document.getElementById('btnRewind');
  const btnForward = document.getElementById('btnForward');

  /* ADD AUDIO SRC HERE (alternative to editing the <video> tag above):
     audio.src = "balang-araw.mp4"; */

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  function playSong() {
    if (!audio.src) { alert('add your audio file! see the comment above the <video> tag 🎵'); return; }
    audio.play().catch(() => {});
    btnPlay.textContent = '⏸';
    disc.classList.add('spinning');
  }
  function pauseSong() {
    audio.pause();
    btnPlay.textContent = '▶';
    disc.classList.remove('spinning');
  }
  btnPlay.addEventListener('click', () => { if (audio.paused) playSong(); else pauseSong(); });
  btnRewind.addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 5); });
  btnForward.addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5); });
  audio.addEventListener('loadedmetadata', () => { timeTotal.textContent = formatTime(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressFill.style.width = pct + '%';
    progressKnob.style.left = pct + '%';
    timeCurrent.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('ended', pauseSong);
  progressBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  const LIST_ITEMS = [
    [2, "i like how you laugh at my jokes"],
    [3, "i like how you make me smile every time we talk"],
    [4, "i like how your birthday is in july por"],
    [5, "i like how you love aot"],
    [6, "i like it when you bash me"],
    [7, "i like it when you disagree with me"],
    [8, "i like it when u play with me every day"],
    [9, "i like how iyakin u are"],
    [10, "i like how u are blind"],
    [11, "i like it when we talk everyday"],
    [12, "i like it when nagpupuyat tayo while chatting"],
    [13, "i like that we have the same birth month #julyontop"],
    [14, "i like your humor"],
    [15, "i like it when u said u like cats"],
    [16, "i like it when u said u like dogs"],
    [17, "i like how u are the antagonist of my life"],
    [18, "i like how u are my top 1 basher"],
    [19, "i like how mean u are to me"],
    [20, "i like how u call me demonyo"],
    [21, "i like it when u like my story"],
    [22, "i like it when u reply to my notes"],
    [23, "i like it when u send reels/tiktoks to me"],
    [24, "i like how u think"],
    [25, "i like your political stand"],
    [26, "i like u"],
    [27, "i like how u make time go faster when we are talking"],
    [28, "i like the way u care for dogs"],
    [29, "i like it when u make me smile"],
    [30, "i like how genuine u are"],
    [31, "i like it when u let me play with your friends"],
    [32, "i like how unique u are"],
    [33, "i like u sobra"],
    [34, "i like every conversation we have"],
    [35, "i like the person u are today"],
    [36, "i like the person u are becoming"],
    [37, "i like how u make me excited for ur replies"],
    [38, "i like u so much"],
    [39, "i like how u react to all the reels/tiktoks i send you"],
    ["41-99", "i like getting to know you better, okay?"],
    [100, "i like it when u are simply you"],
  ];
  // This note only shows up once you've scrolled past #100 — it's the
  // very last thing in the scrollable list, on purpose.
  const LIST_FOOTER = "don't worry, the number one isn't missing okayy? andito kasi ako sa bahay namin HWHAHAHHAHA.";

  const thingsScroll = document.getElementById('thingsScroll');
  LIST_ITEMS.forEach(([num, text]) => {
    const item = document.createElement('div');
    item.className = 'thing-item';
    item.innerHTML = `<span class="thing-num">${num}.</span><span>${text}</span>`;
    thingsScroll.appendChild(item);
  });
  const footerEl = document.createElement('p');
  footerEl.className = 'things-footer';
  footerEl.textContent = LIST_FOOTER;
  thingsScroll.appendChild(footerEl);
  document.getElementById('btn100Things').addEventListener('click', () => openModal('modal100'));

  const floatiesLayer = document.getElementById('floatiesLayer');
  function spawnFloaties(anchorEl, emojis, count) {
    const rect = anchorEl.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'floaty';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width;
      const y = rect.top + rect.height / 2;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.animationDelay = (Math.random() * 0.2) + 's';
      floatiesLayer.appendChild(el);
      setTimeout(() => el.remove(), 2200);
    }
  }

});
