/** Slóð á frétta vefþjónustu */
const NEWS_API = 'https://vef2-2021-ruv-rss-json-proxy.herokuapp.com';

/**
 * Hlutur sem heldur utan um in-memory „cache“ af gögnum í minni á client (í vafra).
 * Nýtir það að þegar forrit er keyrt mun `fetchNews` fallið *alltaf* keyra þar sem `cache` er í
 * scope, og það verður alltaf sami hluturinn. Við getum því bætt við niðurstöðum í hlutinn með
 * vel þekktum „lykli“ (cache key), við næstu köll getum við athugað hvort hlutur innihaldi þennan
 * lykil og skilað þá þeirri niðurstöðu í stað þess að gera sama kall aftur.
 */
const cache = {};

/**
 * Sækir fréttir frá vefþjónustu. Geymir í in-memory cache gögn eftir `id`.
 * @param {string} [id=''] ID á fréttaflokk til að sækja, sjálgefið tómi (grunn) flokkurinn
 * @returns {Promise<Array<object> | null>} Promise sem verður uppfyllt með fylki af fréttum.
 *           Skilar `null` ef villa kom upp við að sækja gögn.
 */
export async function fetchNews(id = '') {
  const cacheKey = id || 'root';

  if (cacheKey in cache) {
    console.info(`${cacheKey} is in cache`);
    return cache[cacheKey];
  }
  const url = new URL(id, NEWS_API);
  let json;

  try {
    const result = await fetch(url);

    if (!result.ok) throw new Error('Result not ok');

    json = await result.json();
  } catch (e) {
    console.warn('unable to fetch news', id, e);
    return null;
  }

  cache[cacheKey] = json;

  return json;
}
