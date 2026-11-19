(() => {
  const grid = document.getElementById('travel-grid');
  const country = document.getElementById('travel-country');
  const year = document.getElementById('travel-year');
  const status = document.getElementById('travel-status');
  const template = document.getElementById('travel-card-template');
  let entries = [];

  function locationOf(entry) {
    return [...new Set([entry.city, entry.country].filter(Boolean))].join(', ');
  }

  function render() {
    const visible = entries.filter((entry) =>
      (!country.value || entry.country === country.value) &&
      (!year.value || entry.date?.slice(0, 4) === year.value));
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
        [locationOf(entry), entry.date?.slice(0, 4)].filter(Boolean).join(' · ');
      return card;
    });
    grid.replaceChildren(...cards);
    status.textContent = visible.length
      ? visible.length + (visible.length === 1 ? ' place' : ' places')
      : 'No places match these filters.';
  }

  function addOptions(select, values) {
    select.append(...[...new Set(values.filter(Boolean))].map((value) => new Option(value, value)));
  }

  country.addEventListener('change', render);
  year.addEventListener('change', render);
  const embedded = document.getElementById('travel-data');
  const data = embedded ? Promise.resolve().then(() => JSON.parse(embedded.textContent)) :
    fetch('./travel-data.json').then((response) => {
      if (!response.ok) throw new Error('Travel records unavailable');
      return response.json();
    });
  data.then((records) => {
    entries = records;
    addOptions(country, entries.map((entry) => entry.country).filter(Boolean).sort((a, b) => a.localeCompare(b)));
    addOptions(year, entries.map((entry) => entry.date?.slice(0, 4)).filter(Boolean).sort().reverse());
    render();
  }).catch(() => { status.textContent = 'Travel records are currently unavailable.'; });
})();
