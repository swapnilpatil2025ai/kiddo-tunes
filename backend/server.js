// Simple Express backend to proxy YouTube Search safely
// Usage: set YT_API_KEY in environment. Run: npm i && node server.js
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

const app = express();
app.use(cors());
app.get('/health', (_req,res)=> res.json({ok:true}));

// Basic whitelist of safe channels (editable). These are YouTube channel IDs.
const DEFAULT_WHITELIST = [
  // Pinkfong, Super Simple, Cocomelon, LittleBabyBum, Mother Goose Club, etc.
  'UCcdwLMPsaU2ezNSJU1nFoBQ', // Pinkfong Baby Shark - Kids' Songs & Stories
  'UCHkJdcT7G_djYZOwG4K1-_A', // Super Simple Songs - Kids Songs
  'UCbCmjCuTUZos6Inko4u57UQ', // Cocomelon - Nursery Rhymes
  'UCpEhnqL0y41EpW2TvWAHD7Q', // Little Baby Bum
  'UCFYlqmeS0Me9h1p6wD2V9oQ'  // Mother Goose Club
];

function isKidSafeTitle(t){
  const bad = /(remix|nightcore|18\+|nsfw|prank|challenge|meme|parody|scary|horror|shoot|kill|gun|kiss|hot|sexy|fight|blood)/i;
  return !bad.test(t||'');
}

app.get('/search', async (req, res) => {
  try{
    const key = process.env.YT_API_KEY;
    if(!key) return res.status(500).json({error:'Missing YT_API_KEY'});
    const q = (req.query.q || '').toString();
    const strict = !!req.query.strict;
    const whitelistOnly = !!req.query.whitelistOnly;
    const allowed = (process.env.ALLOWED_CHANNELS || '').split(',').map(s=>s.trim()).filter(Boolean);
    const whitelist = allowed.length ? allowed : DEFAULT_WHITELIST;

    // YouTube Data API v3 search
    const params = new URLSearchParams({
      key,
      q,
      part: 'snippet',
      type: 'video',
      maxResults: '12',
      safeSearch: 'strict'
    });
    const url = 'https://www.googleapis.com/youtube/v3/search?' + params.toString();
    const r = await fetch(url);
    const j = await r.json();
    if(j.error) return res.status(400).json(j);

    let items = (j.items || []).map(it => ({
      id: it.id.videoId,
      title: it.snippet.title,
      channelId: it.snippet.channelId,
      channelTitle: it.snippet.channelTitle,
      thumb: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url
    }));

    if(strict){
      items = items.filter(x => isKidSafeTitle(x.title));
    }
    if(whitelistOnly){
      items = items.filter(x => whitelist.includes(x.channelId));
    } else if(strict){
      // Prefer whitelisted channels by boosting them to the top
      const wl = []; const rest = [];
      for(const it of items){
        (whitelist.includes(it.channelId) ? wl : rest).push(it);
      }
      items = wl.concat(rest);
    }

    res.json({ items });
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Search failed'});
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log('API on :' + PORT));
