// Basic state
const favoritesGrid = document.getElementById('favoritesGrid');
const playerEl = document.getElementById('player');
const playerSection = document.getElementById('playerSection');
const closePlayer = document.getElementById('closePlayer');
const toggleAutoplay = document.getElementById('toggleAutoplay');
const prevFav = document.getElementById('prevFav');
const nextFav = document.getElementById('nextFav');
const toggleSearch = document.getElementById('toggleSearch');
const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsEl = document.getElementById('results');
const strictMode = document.getElementById('strictMode');
const whitelistOnly = document.getElementById('whitelistOnly');
const parentGate = document.getElementById('parentGate');
const searchArea = document.getElementById('searchArea');
const gateSubmit = document.getElementById('gateSubmit');
const gateAnswer = document.getElementById('gateAnswer');
const breakBanner = document.getElementById('breakBanner');
const dismissBreak = document.getElementById('dismissBreak');
const sessionMins = document.getElementById('sessionMins');
const startTimer = document.getElementById('startTimer');
const timeLeft = document.getElementById('timeLeft');
const openSettings = document.getElementById('openSettings');
const settingsDialog = document.getElementById('settingsDialog');
const allowedChannels = document.getElementById('allowedChannels');
const saveSettings = document.getElementById('saveSettings');
const disableAutoplay = document.getElementById('disableAutoplay');
const toggleTheme = document.getElementById('toggleTheme');
const gameArea = document.getElementById('gameArea');
const memoryGameBtn = document.getElementById('memoryGameBtn');
const patternGameBtn = document.getElementById('patternGameBtn');

let currentFavIndex = 0;
let autoplay = false;
let timerHandle = null;
let countdownHandle = null;

const settings = {
  allowedChannels: [],
  disableAutoplay: true,
  theme: 'dark'
};

// Load saved settings
(function initSettings(){
  const raw = localStorage.getItem('kiddo_settings');
  if(raw){
    try{
      const s = JSON.parse(raw);
      if(Array.isArray(s.allowedChannels)) settings.allowedChannels = s.allowedChannels;
      if(typeof s.disableAutoplay === 'boolean') settings.disableAutoplay = s.disableAutoplay;
      if(s.theme) settings.theme = s.theme;
    }catch(e){}
  }
  applyTheme(settings.theme);
  allowedChannels.value = settings.allowedChannels.join(',');
  disableAutoplay.checked = settings.disableAutoplay;
})();

function saveSettings(){
  localStorage.setItem('kiddo_settings', JSON.stringify(settings));
}

function applyTheme(t){
  document.body.classList.toggle('light', t === 'light');
}

// Favorites
function renderFavorites(){
  favoritesGrid.innerHTML = '';
  window.KID_FAVORITES.forEach((v, idx)=>{
    const card = document.createElement('button');
    card.className = 'tile';
    card.innerHTML = \`
      <img class="tile-thumb" src="https://i.ytimg.com/vi/\${v.id}/hqdefault.jpg" alt="thumbnail">
      <div class="tile-title">\${v.title}</div>\`;
    card.addEventListener('click', ()=> playFavorite(idx));
    favoritesGrid.appendChild(card);
  });
}

function playFavorite(idx){
  currentFavIndex = idx;
  const vid = window.KID_FAVORITES[idx].id;
  openPlayer(vid);
}

function openPlayer(videoId){
  playerEl.src = \`https://www.youtube.com/embed/\${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1\`;
  playerSection.hidden = false;
}

function closePlayerFn(){
  playerEl.src = '';
  playerSection.hidden = true;
}

// Autoplay & navigation
toggleAutoplay.addEventListener('click', ()=>{
  autoplay = !autoplay;
  toggleAutoplay.setAttribute('aria-pressed', String(autoplay));
  toggleAutoplay.textContent = 'Autoplay: ' + (autoplay ? 'On' : 'Off');
});
prevFav.addEventListener('click', ()=>{
  currentFavIndex = (currentFavIndex - 1 + window.KID_FAVORITES.length) % window.KID_FAVORITES.length;
  playFavorite(currentFavIndex);
});
nextFav.addEventListener('click', ()=>{
  currentFavIndex = (currentFavIndex + 1) % window.KID_FAVORITES.length;
  playFavorite(currentFavIndex);
});
closePlayer.addEventListener('click', closePlayerFn);

// Search & parent gate
toggleSearch.addEventListener('click', ()=>{
  const expanded = toggleSearch.getAttribute('aria-expanded') === 'true';
  toggleSearch.setAttribute('aria-expanded', String(!expanded));
  searchPanel.hidden = expanded;
});

gateSubmit.addEventListener('click', ()=>{
  if(Number(gateAnswer.value) === 7){
    parentGate.hidden = true;
    searchArea.hidden = false;
  } else {
    alert('Wrong answer');
  }
});

async function runSearch(){
  const q = (searchInput.value || '').trim();
  if(!q) return;
  const params = new URLSearchParams({ q });
  if(strictMode.checked) params.append('strict', '1');
  if(whitelistOnly.checked) params.append('whitelistOnly', '1');
  const base = window.__API_BASE__ || '';
  const res = await fetch(\`\${base}/search?\${params.toString()}\`);
  const data = await res.json();
  resultsEl.innerHTML = '';
  data.items.forEach(item=>{
    const card = document.createElement('button');
    card.className = 'result-card';
    card.innerHTML = \`
      <img src="\${item.thumb}" alt="thumbnail">
      <div class="tile-title">\${item.title}</div>\`;
    card.addEventListener('click', ()=> openPlayer(item.id));
    resultsEl.appendChild(card);
  });
}

searchBtn.addEventListener('click', runSearch);
searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ runSearch(); }});

// Eye break timer (20-20-20 rule-ish prompt)
let breakInterval = setInterval(()=>{
  breakBanner.hidden = false;
}, 20 * 60 * 1000);
dismissBreak.addEventListener('click', ()=> breakBanner.hidden = true);

// Session timer
startTimer.addEventListener('click', ()=>{
  if(timerHandle) clearTimeout(timerHandle);
  if(countdownHandle) clearInterval(countdownHandle);
  const mins = Number(sessionMins.value||20);
  let secs = mins * 60;
  countdownHandle = setInterval(()=>{
    secs--;
    const m = Math.max(0, Math.floor(secs/60));
    const s = Math.max(0, secs%60);
    timeLeft.textContent = \`\${m}:\${String(s).padStart(2,'0')}\`;
    if(secs<=0){
      clearInterval(countdownHandle);
      timeLeft.textContent = 'Time!';
      closePlayerFn();
      alert('Great job! Screen break time. How about a quick game?');
    }
  }, 1000);
});

// Settings
openSettings.addEventListener('click', ()=> settingsDialog.showModal());
saveSettings.addEventListener('click', (e)=>{
  e.preventDefault();
  const channels = allowedChannels.value.split(',').map(s=>s.trim()).filter(Boolean);
  settings.allowedChannels = channels;
  settings.disableAutoplay = disableAutoplay.checked;
  saveSettings();
  settingsDialog.close();
});

// Theme
toggleTheme.addEventListener('click', ()=>{
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  applyTheme(settings.theme);
  saveSettings();
});

// Games
memoryGameBtn.addEventListener('click', ()=> startMemoryGame());
patternGameBtn.addEventListener('click', ()=> startPatternGame());

function startMemoryGame(){
  const emojis = ['🦈','🦆','🐱','🐶','🐼','🦄','🐵','🐸'];
  const deck = [...emojis, ...emojis].sort(()=>Math.random()-0.5);
  let open = [];
  let matched = new Set();
  gameArea.innerHTML = '<h3>Memory Match</h3>';
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(4, 60px)';
  grid.style.gap = '10px';
  deck.forEach((emoji, idx)=>{
    const btn = document.createElement('button');
    btn.style.height = '60px';
    btn.style.fontSize = '28px';
    btn.textContent = '❓';
    btn.addEventListener('click', ()=>{
      if(matched.has(idx) || open.includes(idx) || open.length===2) return;
      btn.textContent = emoji;
      open.push(idx);
      if(open.length===2){
        const [a,b] = open;
        const ea = deck[a], eb = deck[b];
        setTimeout(()=>{
          if(ea===eb){
            matched.add(a); matched.add(b);
            if(matched.size===deck.length) alert('Great memory!');
          } else {
            grid.children[a].textContent='❓';
            grid.children[b].textContent='❓';
          }
          open = [];
        }, 500);
      }
    });
    grid.appendChild(btn);
  });
  gameArea.appendChild(grid);
}

function startPatternGame(){
  gameArea.innerHTML = '<h3>Pattern Tap</h3>';
  const pads = ['A','B','C','D'];
  const padWrap = document.createElement('div');
  padWrap.style.display='grid'; padWrap.style.gridTemplateColumns='repeat(4,60px)'; padWrap.style.gap='10px';
  const btns = pads.map(p=>{
    const b = document.createElement('button');
    b.textContent = p;
    b.style.height='60px'; b.style.fontSize='22px';
    padWrap.appendChild(b);
    return b;
  });
  const seq = [];
  let idx = 0;
  function nextRound(){
    const n = Math.floor(Math.random()*4);
    seq.push(n); idx=0;
    // flash
    let i=0;
    const flashing = setInterval(()=>{
      if(i>=seq.length){ clearInterval(flashing); return; }
      const b = btns[seq[i]]; const old = b.style.transform;
      b.style.transform='scale(1.1)';
      setTimeout(()=> b.style.transform=old||'', 250);
      i++;
    }, 500);
  }
  btns.forEach((b,i)=>{
    b.addEventListener('click', ()=>{
      if(i===seq[idx]){
        idx++;
        if(idx===seq.length){
          nextRound();
        }
      } else {
        alert('Nice try! Score: ' + (seq.length-1));
        seq.length = 0; idx=0; nextRound();
      }
    });
  });
  gameArea.appendChild(padWrap);
  nextRound();
}

// Init
renderFavorites();
