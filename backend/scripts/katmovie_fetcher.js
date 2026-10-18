// KatMovieHD Ultra-Fast Concurrent SvelteKit Content Fetcher & Parser
const https = require('https');

function fetchPage(page, attempt = 1) {
  return new Promise((resolve) => {
    const url = 'https://new.katmoviehd.top/?page=' + page;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://new.katmoviehd.top/'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const prefix = 'resolve({id:1,data:';
        const start = data.indexOf(prefix);
        if (start === -1) {
          if (attempt < 2) {
            setTimeout(() => fetchPage(page, attempt + 1).then(resolve), 500);
          } else {
            resolve([]);
          }
          return;
        }
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
    req.on('error', () => {
      if (attempt < 2) {
        setTimeout(() => fetchPage(page, attempt + 1).then(resolve), 500);
      } else {
        resolve([]);
      }
    });
    req.on('timeout', () => {
      req.destroy();
      if (attempt < 2) {
        setTimeout(() => fetchPage(page, attempt + 1).then(resolve), 500);
      } else {
        resolve([]);
      }
    });
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

async function scrapePagesPool(startPage = 1, endPage = 1, concurrency = 8) {
  const pages = [];
  for (let p = startPage; p <= endPage; p++) {
    pages.push(p);
  }

  const results = [];
  const seenTitles = new Set();
  let completed = 0;

  // Process in chunks of concurrency
  for (let i = 0; i < pages.length; i += concurrency) {
    const chunk = pages.slice(i, i + concurrency);
    const chunkPromises = chunk.map(p => fetchPage(p).then(items => ({ page: p, items })));
    const chunkResults = await Promise.all(chunkPromises);

    for (const { page, items } of chunkResults) {
      completed++;
      for (const it of items) {
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
              source_page: page
            });
          }
        }
      }
    }
    process.stderr.write(`\r[KatmovieFetcher] Scraped pages: ${completed}/${pages.length} (${results.length} unique titles found)`);
    if (i + concurrency < pages.length) {
      await new Promise(r => setTimeout(r, 60));
    }
  }
  process.stderr.write('\n');
  return results;
}

// CLI handler
const fs = require('fs');
const args = process.argv.slice(2);
const startPage = parseInt(args[0]) || 1;
const endPage = parseInt(args[1]) || startPage;
const concurrency = parseInt(args[2]) || 8;
const outputFile = args[3] || null;

scrapePagesPool(startPage, endPage, concurrency).then(items => {
  let finalItems = items;
  if (outputFile && fs.existsSync(outputFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      const seen = new Set(items.map(it => it.clean_title.toLowerCase()));
      let added = 0;
      for (const ex of existing) {
        const k = ex.clean_title.toLowerCase();
        if (!seen.has(k)) {
          seen.add(k);
          finalItems.push(ex);
          added++;
        }
      }
      process.stderr.write(`[KatmovieFetcher] Merged with ${added} previously harvested catalog titles (Total: ${finalItems.length})\n`);
    } catch (e) {
      // ignore parse error, overwrite
    }
  }

  const jsonStr = JSON.stringify(finalItems, null, 2);
  if (outputFile) {
    fs.writeFileSync(outputFile, jsonStr, 'utf8');
    process.stderr.write(`[KatmovieFetcher] Successfully saved ${finalItems.length} total titles to ${outputFile}\n`);
  } else {
    process.stdout.write(jsonStr);
  }
}).catch(err => {
  console.error(err);
  if (outputFile) {
    fs.writeFileSync(outputFile, '[]', 'utf8');
  } else {
    process.stdout.write(JSON.stringify([]));
  }
});
