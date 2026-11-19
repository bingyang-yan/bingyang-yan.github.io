(() => {
  const section = document.getElementById('awards');
  const pageSize = 2;
  const yearRail = section.querySelector('.awards-years');
  const controls = section.querySelector('.travel-filters');
  const yearPicker = controls.querySelector('[data-filter="year"]');
  const status = section.querySelector('[role="status"]');
  const yearGroups = [...section.querySelectorAll('.awards-year')].map((group) => ({
    group,
    limit: pageSize,
    moreButton: group.querySelector('.award-load-more'),
    cards: [...group.querySelectorAll('.award-card')],
  }));
  const cards = yearGroups.flatMap((yearGroup) => yearGroup.cards);

  const levelOrder = ['National Level', 'School Level', 'University Level', 'Misc'];
  const filters = [...controls.querySelectorAll('[data-filter]:not([data-filter="year"])')].map((group) => {
    const key = group.dataset.filter;
    const values = [...new Set(cards.map((card) => card.dataset[key]))].sort();
    const orderedValues = key === 'level'
      ? [...levelOrder.filter((level) => values.includes(level)), ...values.filter((level) => !levelOrder.includes(level))]
      : values;
    return {
      group,
      key,
      value: '',
      options: [['', group.dataset.all], ...orderedValues.map((value) => [value, value])],
    };
  });

  let pendingFrame = 0;

  function updateVisibleYear() {
    pendingFrame = 0;
    const left = yearRail.getBoundingClientRect().left + yearRail.clientLeft;
    const right = left + yearRail.clientWidth;
    const firstVisibleYear = yearGroups.find(({ group }) => {
      if (group.hidden) return false;
      const bounds = group.getBoundingClientRect();
      return bounds.right > left + 1 && bounds.left < right - 1;
    });
    for (const { button } of yearGroups) {
      button.setAttribute('aria-pressed', String(button === firstVisibleYear?.button));
    }
  }

  function scheduleVisibleYear() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(updateVisibleYear);
  }

  function jumpToYear(target) {
    const first = yearGroups.find(({ group }) => !group.hidden)?.group;
    if (!first || target.hidden) return;
    yearRail.scrollLeft = target.getBoundingClientRect().left - first.getBoundingClientRect().left;
    scheduleVisibleYear();
  }

  function matches(card, filter) {
    return !filter.value || card.dataset[filter.key] === filter.value;
  }

  function renderYear(yearGroup) {
    const matchingCards = yearGroup.cards.filter((card) =>
      filters.every((filter) => matches(card, filter))
    );
    const shownCards = matchingCards.slice(0, yearGroup.limit);
    for (const card of yearGroup.cards) {
      card.hidden = !shownCards.includes(card);
    }
    yearGroup.group.hidden = matchingCards.length === 0;
    yearGroup.button.hidden = yearGroup.group.hidden;
    yearGroup.button.lastElementChild.textContent = matchingCards.length;
    yearGroup.moreButton.hidden = matchingCards.length <= yearGroup.limit;
    return shownCards;
  }

  function render() {
    const visible = yearGroups.reduce((total, yearGroup) => total + renderYear(yearGroup).length, 0);

    for (const filter of filters) {
      const candidates = cards.filter((card) =>
        filters.every((other) => other === filter || matches(card, other))
      );
      for (const button of filter.group.children) {
        const { value } = button;
        const count = value
          ? candidates.filter((card) => card.dataset[filter.key] === value).length
          : candidates.length;
        button.setAttribute('aria-pressed', String(value === filter.value));
        button.hidden = count === 0 && value !== filter.value;
        button.lastElementChild.textContent = count;
      }
    }

    scheduleVisibleYear();
    status.textContent = visible === 1 ? '1 award shown.' : `${visible} awards shown.`;
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

  for (const filter of filters) {
    for (const [value, label] of filter.options) {
      filter.group.append(makeButton(value, label, () => {
        filter.value = filter.value === value ? '' : value;
        for (const yearGroup of yearGroups) yearGroup.limit = pageSize;
        render();
        yearRail.scrollLeft = 0;
      }));
    }
  }
  for (const yearGroup of yearGroups) {
    const year = yearGroup.cards[0].dataset.year;
    yearGroup.button = makeButton(year, year, () => jumpToYear(yearGroup.group));
    yearPicker.append(yearGroup.button);
    yearGroup.moreButton.addEventListener('click', () => {
      const previousLimit = yearGroup.limit;
      yearGroup.limit += pageSize;
      render();
      const nextCard = yearGroup.cards.filter((card) => !card.hidden)[previousLimit];
      if (nextCard) {
        nextCard.tabIndex = -1;
        nextCard.focus();
      }
    });
  }

  yearRail.addEventListener('scroll', scheduleVisibleYear, { passive: true });
  window.addEventListener('resize', scheduleVisibleYear);

  render();
  controls.hidden = false;
})();
