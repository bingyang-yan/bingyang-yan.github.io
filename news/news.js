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
  let selectedYear = '';

  function addFilters(group, options, select) {
    group.replaceChildren(...options.map(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = label;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => {
        const anchorYear = select(value);
        render(anchorYear);
      });
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

  function updateVisibleYear() {
    const left = grid.getBoundingClientRect().left;
    const firstVisible = [...grid.children].find((card) => {
      const bounds = card.getBoundingClientRect();
      return bounds.right > left + Math.min(bounds.width / 2, 32);
    });
    const currentYear = selectedYear || firstVisible?.dataset.year;
    for (const button of yearGroup.children) {
      if (currentYear && button.value === currentYear) button.setAttribute('aria-current', 'date');
      else button.removeAttribute('aria-current');
    }
  }

  grid.addEventListener('scroll', updateVisibleYear, { passive: true });

  function render(anchorYear) {
    const categoryRecords = entries.filter((entry) => !selectedCategory || entry.category === selectedCategory);
    if (selectedYear && !categoryRecords.some((entry) => yearOf(entry) === selectedYear)) selectedYear = '';
    const matchesYear = (entry) => !selectedYear || yearOf(entry) === selectedYear;
    updateFilters(categoryGroup, selectedCategory, entries.filter(matchesYear), (entry) => entry.category);
    updateFilters(yearGroup, selectedYear, categoryRecords, yearOf, true);
    const visible = categoryRecords.filter(matchesYear);
    const cards = visible.map(makeCard);
    grid.replaceChildren(...cards);
    const anchorIndex = anchorYear ? visible.findIndex((entry) => yearOf(entry) === anchorYear) : 0;
    const anchor = cards[anchorIndex];
    grid.scrollLeft = anchor && anchorIndex > 0
      ? anchor.getBoundingClientRect().left - cards[0].getBoundingClientRect().left
      : 0;
    updateVisibleYear();
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
      });
      addFilters(yearGroup, [['', 'All years'], ...years.map((year) => [year, year])], (value) => {
        const anchorYear = value || selectedYear;
        selectedYear = value;
        return anchorYear;
      });
      render();
    })
    .catch(() => { status.textContent = 'News records are currently unavailable.'; });
})();
