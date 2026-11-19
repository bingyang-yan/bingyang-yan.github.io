(() => {
  const section = document.getElementById('awards');
  const controls = section.querySelector('.travel-filters');
  const status = section.querySelector('[role="status"]');
  const yearGroups = [...section.querySelectorAll('.awards-year')].map((group) => ({
    group,
    cards: [...group.querySelectorAll('.award-card')],
  }));
  const cards = yearGroups.flatMap((yearGroup) => yearGroup.cards);

  const levelOrder = ['National Level', 'School Level', 'University Level', 'Misc'];
  const filters = [...controls.querySelectorAll('[data-filter]')].map((group) => {
    const key = group.dataset.filter;
    const values = [...new Set(cards.map((card) => card.dataset[key]))].sort();
    const orderedValues = key === 'level'
      ? [...levelOrder.filter((level) => values.includes(level)), ...values.filter((level) => !levelOrder.includes(level))]
      : key === 'year' ? values.reverse() : values;
    return {
      group,
      key,
      value: '',
      options: [['', group.dataset.all], ...orderedValues.map((value) => [value, value])],
    };
  });

  function matches(card, filter) {
    return !filter.value || card.dataset[filter.key] === filter.value;
  }

  function render() {
    let visible = 0;
    for (const yearGroup of yearGroups) {
      let groupVisible = 0;
      for (const card of yearGroup.cards) {
        card.hidden = !filters.every((filter) => matches(card, filter));
        if (!card.hidden) groupVisible++;
      }
      yearGroup.group.hidden = groupVisible === 0;
      visible += groupVisible;
    }

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

    status.textContent = visible === 1 ? '1 award shown.' : `${visible} awards shown.`;
  }

  for (const filter of filters) {
    for (const [value, label] of filter.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = label;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => {
        filter.value = filter.value === value ? '' : value;
        render();
      });
      filter.group.append(button);
    }
  }
  render();
  controls.hidden = false;
})();
