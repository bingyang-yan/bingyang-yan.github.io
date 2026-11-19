(() => {
  const grid = document.getElementById('travel-grid');
  const country = document.getElementById('travel-country');
  const year = document.getElementById('travel-year');
  const status = document.getElementById('travel-status');
  const template = document.getElementById('travel-card-template');
  let entries = [];
  let selectedCountry = '';
  let selectedYear = '';

  const yearOf = (entry) => entry.date?.slice(0, 4);
  const matchesCountry = (entry) => !selectedCountry || entry.country === selectedCountry;
  const matchesYear = (entry) => !selectedYear || yearOf(entry) === selectedYear;

  function locationOf(entry) {
    return [...new Set([entry.city, entry.country].filter(Boolean))].join(', ');
  }

  function render() {
    const visible = entries.filter((entry) => matchesCountry(entry) && matchesYear(entry));
    updateFilters(country, selectedCountry, entries.filter(matchesYear), (entry) => entry.country);
    updateFilters(year, selectedYear, entries.filter(matchesCountry), yearOf);
    const cards = visible.map((entry, index) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.href = entry.url;
      const photo = card.querySelector('img');
      if (entry.cover) {
        photo.loading = index < 3 ? 'eager' : 'lazy';
        photo.src = entry.cover;
      } else {
        photo.remove();
      }
      card.querySelector('strong').textContent = entry.name;
      card.querySelector('small').textContent =
        [locationOf(entry), yearOf(entry)].filter(Boolean).join(' · ');
      return card;
    });
    grid.replaceChildren(...cards);
    status.textContent = visible.length
      ? visible.length + (visible.length === 1 ? ' place' : ' places')
      : 'No places match these filters.';
  }

  function addFilters(group, allLabel, values, select) {
    const options = ['', ...new Set(values.filter(Boolean))];
    group.replaceChildren(...options.map((value) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = value || allLabel;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => {
        select(value);
        render();
      });
      return button;
    }));
  }

  function updateFilters(group, selected, records, valueOf) {
    for (const button of group.children) {
      const value = button.value;
      const count = value ? records.filter((entry) => valueOf(entry) === value).length : records.length;
      button.setAttribute('aria-pressed', String(value === selected));
      button.lastElementChild.textContent = count;
    }
  }
  const embedded = document.getElementById('travel-data');
  const data = embedded ? Promise.resolve().then(() => JSON.parse(embedded.textContent)) :
    fetch('./travel-data.json').then((response) => {
      if (!response.ok) throw new Error('Travel records unavailable');
      return response.json();
    });
  data.then((records) => {
    entries = records;
    addFilters(country, 'All countries', entries.map((entry) => entry.country).filter(Boolean).sort((a, b) => a.localeCompare(b)), (value) => {
      selectedCountry = value;
    });
    addFilters(year, 'All years', entries.map(yearOf).filter(Boolean).sort().reverse(), (value) => {
      selectedYear = value;
    });
    render();
  }).catch(() => { status.textContent = 'Travel records are currently unavailable.'; });
})();
