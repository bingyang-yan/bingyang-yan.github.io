/* Navigation adapted from breadli428/breadli428.github.io.
   MIT license and copyright notice: navigation.LICENSE.txt. */

const nav = document.querySelector('.gnav');
const menuButton = nav.querySelector('.gnav-menu-btn');
const menuLinks = nav.querySelector('.gnav-links');
const compact = window.matchMedia('(max-width: 900px)');
const dialog = document.querySelector('.search-modal');
const searchField = dialog.querySelector('input');
const searchResults = dialog.querySelector('.search-results');
const searchStatus = dialog.querySelector('[role="status"]');

function setMenuOpen(open) {
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuLinks.inert = compact.matches && !open;
}

menuButton.addEventListener('click', () => setMenuOpen(!nav.classList.contains('is-open')));
menuLinks.addEventListener('click', (event) => {
  if (!event.target.closest('a')) return;
  if (nav.classList.contains('is-open')) menuButton.focus({ preventScroll: true });
  setMenuOpen(false);
});
compact.addEventListener('change', () => setMenuOpen(false));
window.addEventListener('pageshow', () => setMenuOpen(false));
setMenuOpen(false);

const sectionLinks = [...menuLinks.querySelectorAll('[data-section]')].flatMap((label) => {
  const section = document.getElementById(label.dataset.section);
  if (!section) return [];
  const link = document.createElement('a');
  link.textContent = label.textContent;
  link.href = '#' + encodeURIComponent(section.id);
  label.replaceWith(link);
  return [{ section, link }];
});

const hero = document.querySelector('.hero');
let frame = 0;
function updateNavigation() {
  frame = 0;
  const scroll = window.scrollY;
  nav.classList.toggle('is-scrolled', scroll > 4);
  nav.classList.toggle('is-over-hero', Boolean(hero && scroll < hero.offsetHeight * .25));
  const line = window.innerHeight * .3;
  const active = sectionLinks.findLast(({ section }) => section.getBoundingClientRect().top <= line);

  for (const item of sectionLinks) {
    item.link.classList.toggle('is-active', item === active);
    if (item === active) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
}

function scheduleUpdate() {
  if (!frame) frame = requestAnimationFrame(updateNavigation);
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
updateNavigation();

const pages = [
  { title: 'Work', href: '/' },
  { title: 'Life', href: '/Life/index.html' },
  ...sectionLinks.map(({ link }) => ({ title: link.textContent, href: link.href })),
];

function updateResults() {
  const query = searchField.value.trim().toLowerCase();
  const matches = pages.filter(({ title }) => title.toLowerCase().includes(query));
  searchResults.replaceChildren(...matches.map(({ title, href }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = href;
    link.textContent = title;
    item.append(link);
    return item;
  }));
  searchStatus.textContent = matches.length ? '' : 'No results.';
}

function openSearch() {
  setMenuOpen(false);
  if (!dialog.open) dialog.showModal();
  updateResults();
  searchField.focus();
}

nav.querySelector('[data-search]').addEventListener('click', openSearch);
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog || event.target.closest('.search-results a')) dialog.close();
});
searchField.addEventListener('input', updateResults);

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  }

  if (event.key === 'Escape' && !dialog.open && nav.classList.contains('is-open')) {
    setMenuOpen(false);
    menuButton.focus();
  }
});
