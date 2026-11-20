(() => {
  const section = document.getElementById('awards');
  const grid = section.querySelector('#awards-grid');
  const controls = section.querySelector('.travel-filters');
  const yearPicker = controls.querySelector('[data-filter="year"]');
  const status = section.querySelector('#awards-status');
  const photoDialog = section.querySelector('#awards-photo-dialog');
  const enlargedPhoto = photoDialog.querySelector('img');
  const cards = [...grid.querySelectorAll('.award-card')];
  const levelOrder = ['National Level', 'School Level', 'University Level', 'Misc'];
  const filters = [...controls.querySelectorAll('[data-all]')].map((group) => {
    const { filter: key, all } = group.dataset;
    const values = [...new Set(cards.map((card) => card.dataset[key]))].sort();
    const options = key === 'level'
      ? [...levelOrder.filter((level) => values.includes(level)), ...values.filter((level) => !levelOrder.includes(level))]
      : values;
    return {
      group,
      key,
      value: key === 'type' ? 'featured' : '',
      options: [['', all], ...(key === 'type' ? [['featured', 'Featured']] : []),
        ...options.map((value) => [value, value])],
    };
  });

  let shownCards = cards;
  let scrollFrame = 0;
  let alignTimer;

  function matches(card, key, value) {
    if (key === 'type' && value === 'featured') return card.dataset.featured === 'true';
    return !value || card.dataset[key] === value;
  }

  function makeButton(value, label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'travel-filter';
    button.value = value;
    button.textContent = label;
    button.append(document.createElement('span'));
    button.addEventListener('click', onClick);
    return button;
  }

  function visibleCards() {
    const left = grid.getBoundingClientRect().left + grid.clientLeft;
    const right = left + grid.clientWidth;
    return shownCards.filter((card) => {
      const bounds = card.getBoundingClientRect();
      return bounds.right > left + 1 && bounds.left < right - 1;
    });
  }

  function updateVisibleYear() {
    scrollFrame = 0;
    const year = visibleCards()[0]?.dataset.year;
    for (const button of yearPicker.children) {
      const pressed = String(button.value === year);
      if (button.getAttribute('aria-pressed') !== pressed) {
        button.setAttribute('aria-pressed', pressed);
      }
    }
  }

  function alignPhotos() {
    clearTimeout(alignTimer);
    const copyHeights = visibleCards().map((card) =>
      card.querySelector('.news-card-copy-content').offsetHeight
    );
    grid.style.setProperty('--news-visible-copy-height', Math.max(0, ...copyHeights) + 'px');
  }

  function scheduleVisibleYear() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateVisibleYear);
  }

  function render() {
    shownCards = cards.filter((card) => filters.every(({ key, value }) => matches(card, key, value)));
    for (const card of cards) card.hidden = !shownCards.includes(card);
    grid.hidden = shownCards.length === 0;
    grid.scrollLeft = 0;

    for (const filter of filters) {
      const candidates = cards.filter((card) =>
        filters.every((other) => other === filter || matches(card, other.key, other.value))
      );
      for (const button of filter.group.children) {
        const count = candidates.filter((card) => matches(card, filter.key, button.value)).length;
        button.setAttribute('aria-pressed', String(button.value === filter.value));
        button.hidden = !count && button.value !== filter.value && button.value !== 'featured';
        button.lastElementChild.textContent = count;
      }
    }

    for (const button of yearPicker.children) {
      const count = shownCards.filter((card) => card.dataset.year === button.value).length;
      button.hidden = !count;
      button.lastElementChild.textContent = count;
    }

    alignPhotos();
    scheduleVisibleYear();
    status.textContent = shownCards.length
      ? `${shownCards.length} ${shownCards.length === 1 ? 'award' : 'awards'} shown.`
      : 'No awards match these filters.';
    status.classList.toggle('award-status', shownCards.length > 0);
  }

  for (const filter of filters) {
    for (const [value, label] of filter.options) {
      filter.group.append(makeButton(value, label, () => {
        filter.value = filter.value === value ? '' : value;
        render();
      }));
    }
  }

  for (const year of new Set(cards.map((card) => card.dataset.year))) {
    yearPicker.append(makeButton(year, year, () => {
      const target = shownCards.find((card) => card.dataset.year === year);
      if (!target) return;
      grid.scrollLeft = target.getBoundingClientRect().left - shownCards[0].getBoundingClientRect().left;
      alignPhotos();
      scheduleVisibleYear();
    }));
  }

  grid.addEventListener('scroll', () => {
    scheduleVisibleYear();
    // Align covers after scrolling stops so the card geometry stays steady during a swipe.
    clearTimeout(alignTimer);
    alignTimer = setTimeout(alignPhotos, 180);
  }, { passive: true });

  window.addEventListener('resize', () => {
    alignPhotos();
    scheduleVisibleYear();
  });

  grid.addEventListener('mousedown', (event) => {
    if (event.button === 0 && event.target.closest('.news-card-photo')) {
      event.preventDefault();
    }
  });

  grid.addEventListener('click', (event) => {
    const cover = event.target.closest('.news-card-photo');
    if (!cover) return;
    const image = cover.querySelector('img');
    enlargedPhoto.src = image.currentSrc || image.src;
    enlargedPhoto.alt = cover.closest('.award-card').querySelector('.news-card-title').textContent;
    photoDialog.showModal();
  });

  photoDialog.addEventListener('click', (event) => {
    if (event.target === photoDialog) photoDialog.close();
  });

  render();
  controls.hidden = false;
})();
