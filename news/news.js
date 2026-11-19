(() => {
  const grid = document.getElementById('news-grid');
  const categoryGroup = document.getElementById('news-category');
  const yearGroup = document.getElementById('news-year');
  const status = document.getElementById('news-status');
  const template = document.getElementById('news-card-template');
  const dateFormat = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC',
  });
  const yearOf = (entry) => entry.date?.slice(0, 4);
  let entries = [];
  let selectedCategory = 'Work';
  let cards = [];
  let pendingFrame = 0;
  let alignTimer;

  function addFilters(group, options, select) {
    group.replaceChildren(...options.map(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = label;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => select(value));
      return button;
    }));
  }

  function updateFilters(group, selected, records, valueOf, hideEmpty = false) {
    for (const button of group.children) {
      const { value } = button;
      const count = value ? records.filter((entry) => valueOf(entry) === value).length : records.length;
      button.hidden = Boolean(value && hideEmpty && !count);
      button.setAttribute('aria-pressed', String(value === selected));
      button.lastElementChild.textContent = count;
    }
  }

  function makeCard(entry, index) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.year = yearOf(entry) ?? '';
    const headline = card.querySelector('.news-card-title');
    headline.href = entry.url;
    headline.textContent = entry.title;

    const photo = card.querySelector('.news-card-photo');
    if (entry.cover) {
      photo.href = entry.url;
      const image = photo.querySelector('img');
      image.loading = index < 4 ? 'eager' : 'lazy';
      image.src = entry.cover;
    } else {
      photo.remove();
    }

    const date = card.querySelector('time');
    if (entry.date) {
      date.dateTime = entry.date;
      date.textContent = dateFormat.format(new Date(entry.date));
    } else {
      date.remove();
    }

    const links = card.querySelector('.news-card-links');
    for (const { label, url } of entry.links) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = label;
      item.append(link);
      links.append(item);
    }
    return card;
  }

  function visibleCards() {
    const left = grid.getBoundingClientRect().left + grid.clientLeft;
    const right = left + grid.clientWidth;
    return cards.filter(({ card }) => {
      const bounds = card.getBoundingClientRect();
      return bounds.right > left + 1 && bounds.left < right - 1;
    });
  }

  function updateVisibleYear() {
    pendingFrame = 0;
    const currentYear = visibleCards()[0]?.card.dataset.year;
    for (const button of yearGroup.children) {
      const pressed = String(button.value === currentYear);
      if (button.getAttribute('aria-pressed') !== pressed) {
        button.setAttribute('aria-pressed', pressed);
      }
    }
  }

  function alignVisiblePhotos() {
    clearTimeout(alignTimer);
    const height = Math.max(0, ...visibleCards().map(({ copy }) => copy.offsetHeight)) + 'px';
    if (grid.style.getPropertyValue('--news-visible-copy-height') !== height) {
      grid.style.setProperty('--news-visible-copy-height', height);
    }
  }

  function updateAfterScroll() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateVisibleYear);
    // Keep card geometry steady while the trackpad or touch scroll is still moving.
    clearTimeout(alignTimer);
    alignTimer = setTimeout(alignVisiblePhotos, 180);
  }

  grid.addEventListener('scroll', updateAfterScroll, { passive: true });
  window.addEventListener('resize', () => {
    alignVisiblePhotos();
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateVisibleYear);
  });

  function jumpToYear(year) {
    const target = cards.find(({ card }) => card.dataset.year === year)?.card;
    if (!target) return;
    grid.scrollLeft = target.getBoundingClientRect().left - cards[0].card.getBoundingClientRect().left;
    alignVisiblePhotos();
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateVisibleYear);
  }

  function render() {
    const visible = entries.filter((entry) => !selectedCategory || entry.category === selectedCategory);
    updateFilters(categoryGroup, selectedCategory, entries, (entry) => entry.category);
    updateFilters(yearGroup, '', visible, yearOf, true);
    cards = visible.map((entry, index) => {
      const card = makeCard(entry, index);
      return { card, copy: card.querySelector('.news-card-copy-content') };
    });
    grid.replaceChildren(...cards.map(({ card }) => card));
    grid.scrollLeft = 0;
    alignVisiblePhotos();
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateVisibleYear);
    status.textContent = visible.length ? '' : 'No news matches these filters.';
  }

  fetch(new URL('./data.json', document.currentScript.src))
    .then((response) => {
      if (!response.ok) throw new Error('News records unavailable');
      return response.json();
    })
    .then((records) => {
      entries = records;
      const years = [...new Set(entries.map(yearOf).filter(Boolean))].sort().reverse();
      addFilters(categoryGroup, [['', 'All categories'], ['Work', 'Work'], ['Life', 'Life']], (value) => {
        selectedCategory = value;
        render();
      });
      addFilters(yearGroup, years.map((year) => [year, year]), jumpToYear);
      render();
    })
    .catch(() => { status.textContent = 'News records are currently unavailable.'; });
})();
