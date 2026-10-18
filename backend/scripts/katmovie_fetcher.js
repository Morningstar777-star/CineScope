// KatMovieHD Fast SvelteKit Content Fetcher & Parser
const https = require('https');

function fetchPage(page) {
  return new Promise((resolve) => {
    const url = 'https://new.katmoviehd.top/?page=' + page;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const prefix = 'resolve({id:1,data:';
        const start = data.indexOf(prefix);
        if (start === -1) return resolve([]);
        const jsonStart = start + prefix.length;
        const end = data.indexOf(',error:void 0})</script>', jsonStart);
        if (end === -1) return resolve([]);
        try {
          const rawJs = data.slice(jsonStart, end);
          const parsed = new Function('return ' + rawJs)();
          resolve(parsed.data?.items || []);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.on('timeout', () => { req.destroy(); resolve([]); });
  });
}

function cleanTitle(raw) {
  if (!raw) return null;
  const unescaped = raw.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').replace(/&#8217;/g, "'").trim();
  if (/updated on|katdrama|pikahd|join our|announcement/i.test(unescaped)) return null;

  const isSeries = /season\s*\d+|series|episode/i.test(unescaped);
  
  // Year extraction: (2026), [2017-2019], etc.
  let year = null;
  const yearMatch = unescaped.match(/(?:\(|\[)(\d{4})(?:[–\-]\d{4})?(?:\)|\])/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }

  // Extract Season number if present
  let season = null;
  const seasonMatch = unescaped.match(/season\s*(\d+)/i);
  if (seasonMatch) {
    season = parseInt(seasonMatch[1]);
  }

  let title = unescaped;
  const patterns = [
    /\s*\(Season\s*\d+.*$/i,
    /\s*\((?:19|20)\d{2}.*$/i,
    /\s*\[(?:19|20)\d{2}.*$/i,
    /\s*Hindi\s+Dubbed.*$/i,
    /\s*Hindi\s+Studio\s+Dub.*$/i,
    /\s*Dual\s+Audio.*$/i,
    /\s*WEB-DL.*$/i,
    /\s*BluRay.*$/i,
    /\s*Full\s+Movie.*$/i,
    /\s*\|\s*.*$/i,
    /\s*Episode\s*\d+.*$/i,
    /\s*All\s+Episodes.*$/i,
    /\s*-\s*1XBET.*$/i,
    /\s*\(ORG\).*$/i,
    /\s*\(DD\s*5\.1\).*$/i,
    /\s*aka\s+.*$/i
  ];
  for (const p of patterns) {
    title = title.replace(p, '');
  }
  title = title.replace(/[\s\-_|:]+$/, '').trim();
  return { title, year, season, isSeries, raw: unescaped };
}

async function scrapePages(startPage = 1, endPage = 1) {
  const results = [];
  const seenTitles = new Set();

  for (let p = startPage; p <= endPage; p++) {
    const rawItems = await fetchPage(p);
    for (const it of rawItems) {
      const cleaned = cleanTitle(it.post_title);
      if (cleaned && cleaned.title.length > 1) {
        const key = cleaned.title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          results.push({
            id: it.id,
            slug: it.slug,
            raw_title: it.post_title,
            clean_title: cleaned.title,
            year: cleaned.year,
            season: cleaned.season,
            media_type: cleaned.isSeries ? 'series' : 'movie',
            poster_url: it.thumbnail_image || null,
            categories: it.categories || [],
            source_page: p
          });
        }
      }
    }
  }
  return results;
}

// CLI handler
const args = process.argv.slice(2);
const startPage = parseInt(args[0]) || 1;
const endPage = parseInt(args[1]) || startPage;

scrapePages(startPage, endPage).then(items => {
  process.stdout.write(JSON.stringify(items, null, 2));
}).catch(err => {
  console.error(err);
  process.stdout.write(JSON.stringify([]));
});
