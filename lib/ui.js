import { fetchNews } from './news.js';
import { el, empty } from './helpers.js';

/**
 * Föll sem sjá um að kalla í `fetchNews` og birta viðmót:
 * - Loading state meðan gögn eru sótt
 * - Villu state ef villa kemur upp við að sækja gögn
 * - Birta gögnin ef allt OK
 * Fyrir gögnin eru líka búnir til takkar sem leyfa að fara milli forsíðu og
 * flokks *án þess* að nota sjálfgefna <a href> virkni—við tökum yfir og sjáum
 * um sjálf með History API.
 */

/**
 * Sér um smell á flokk og birtir flokkinn *á sömu síðu* og við erum á.
 * Þarf að:
 * - Stoppa sjálfgefna hegðun <a href>
 * - Tæma `container` þ.a. ekki sé verið að setja efni ofan í annað efni
 * - Útbúa link sem fer til baka frá flokk á forsíðu, þess vegna þarf `newsItemLimit`
 * - Sækja og birta flokk
 * - Bæta við færslu í `history` þ.a. back takki virki
 *
 * Notum lokun þ.a. við getum útbúið föll fyrir alla flokka með einu falli. Notkun:
 * ```
 * link.addEventListener('click', handleCategoryClick(categoryId, container, newsItemLimit));
 * ```
 *
 * @param {string} id ID á flokk sem birta á eftir að smellt er
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleCategoryClick(id, container, newsItemLimit) {
  return (e) => {
    e.preventDefault();

    empty(container);

    const backLink = createCategoryBackLink(container, newsItemLimit);

    fetchAndRenderCategory(id, container, backLink);
    window.history.pushState({}, '', `/?category=${id}`);
    // TODO útfæra
  };
}

/**
 * Eins og `handleCategoryClick`, nema býr til link sem fer á forsíðu.
 *
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {function} Fall sem bundið er við click event á link/takka
 */
function handleBackClick(container, newsItemLimit) {
  return (e) => {
    e.preventDefault();

    empty(container);

    window.history.pushState({}, '', '/');

    fetchAndRenderLists(container, newsItemLimit);

    // TODO útfæra
  };
}

/**
 * Útbýr takka sem fer á forsíðu.
 * @param {HTMLElement} container Element sem á að birta fréttirnar í
 * @param {number} newsItemLimit Hámark frétta sem á að birta
 * @returns {HTMLElement} Element með takka sem fer á forsíðu
 */
export function createCategoryBackLink(container, newsItemLimit) {
  const link = el('a', 'Til baka');
  link.setAttribute('href', '/');
  link.classList.add('news__link');
  link.addEventListener('click', handleBackClick(container, newsItemLimit));

  return link;
  // TODO útfæra
}

/**
 * Sækir grunnlista af fréttum, síðan hvern flokk fyrir sig og birtir nýjustu
 * N fréttir úr þeim flokk með `fetchAndRenderCategory()`
 * @param {HTMLElement} container Element sem mun innihalda allar fréttir
 * @param {number} newsItemLimit Hámark fjöldi frétta sem á að birta í yfirliti
 */
export async function fetchAndRenderLists(container, newsItemLimit) {
  // Byrjum á að birta loading skilaboð
  const loadingElement = el('p', 'Sæki lista af fréttum');

  // Birtum þau beint á container
  container.appendChild(loadingElement);

  // Sækjum yfirlit með öllum flokkum, hér þarf að hugsa um Promises!
  const newsIndex = await fetchNews();

  // Fjarlægjum loading skilaboð
  container.removeChild(loadingElement);

  // Athugum hvort villa hafi komið upp => fetchNews skilaði null
  if (!newsIndex) {
    const noNewsElement = el('p', 'Villa kom upp');
    container.appendChild(noNewsElement);
  }

  // Athugum hvort engir fréttaflokkar => fetchNews skilaði tómu fylki
  if (newsIndex.length === 0) {
    const noNewsElement = el('p', 'Engar fréttir.');
    container.appendChild(noNewsElement);
  }

  // Búum til <section> sem heldur utan um allt
  const listElement = el('div');
  listElement.classList.add('newsList__list');
  const sectionElement = el('section', listElement);
  sectionElement.classList.add('newsList');
  container.appendChild(sectionElement);

  // Höfum ekki-tómt fylki af fréttaflokkum! Ítrum í gegn og birtum
  for (const category of newsIndex) {
    const itemElement = el('div');
    itemElement.classList.add('newsList__item');
    listElement.appendChild(itemElement);

    const link = el('a', 'Allar fréttir');
    link.setAttribute('href', `/?category=${category.id}`);
    link.classList.add('news__link');

    // Þegar það er smellt á flokka link, þá sjáum við um að birta fréttirnar, ekki default virknin
    link.addEventListener(
      'click',
      handleCategoryClick(category.id, container, newsItemLimit)
    );

    fetchAndRenderCategory(category.id, itemElement, link, newsItemLimit);
  }
}

/**
 * Sækir gögn fyrir flokk og birtir í DOM.
 * @param {string} id ID á category sem við erum að sækja
 * @param {HTMLElement} parent Element sem setja á flokkinn í
 * @param {HTMLELement | null} [link=null] Linkur sem á að setja eftir fréttum
 * @param {number} [limit=Infinity] Hámarks fjöldi frétta til að sýna
 */
export async function fetchAndRenderCategory(
  id,
  parent,
  link = null,
  limit = Infinity
) {
  // Búum til <section> sem heldur utan um flokkinn
  const container = el('section');
  container.classList.add('news');

  // Bætum við parent og þannig DOM, allar breytingar héðan í frá fara gegnum
  // container sem er tengt parent
  parent.appendChild(container);

  // Setjum inn loading skilaboð fyrir flokkinn
  const loadingElement = el('p', 'Sæki gögn ...');
  container.appendChild(loadingElement);

  // Sækjum gögn fyrir flokkinn og bíðum
  const news = await fetchNews(id);

  // Fjarlægjum loading skilaboð
  container.removeChild(loadingElement);

  // Ef það er linkur, bæta honum við
  if (link) {
    const links = el('div', link);
    link.classList.add('news__links');
    container.appendChild(links);
  }

  // Villuskilaboð ef villa og hættum
  if (!news) {
    const errorElement = el('p', 'Villa kom upp');
    container.appendChild(errorElement);
    return;
  }

  // Skilaboð ef engar fréttir og hættum
  if (news.length === 0) {
    const noNewsElement = el('p', 'Engar fréttir.');
    container.appendChild(noNewsElement);
    return;
  }

  // Bætum við titli
  const title = el('h2', news.title);
  title.classList.add('news__title');
  container.appendChild(title);

  const ul = el('ul');
  ul.classList.add('news__list');
  container.appendChild(ul);

  // Höfum fréttir! Ítrum og bætum við <ul>
  for (let i = 0; i < Math.min(news.items.length, limit); i++) {
    const item = news.items[i];
    const a = el('a', item.title);
    a.setAttribute('href', item.link);
    const li = el('li', a);
    li.classList.add('news__item');
    ul.appendChild(li);
  }
}
