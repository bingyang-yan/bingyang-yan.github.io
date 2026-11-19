(() => {
  const grid = document.getElementById('travel-grid');
  const country = document.getElementById('travel-country');
  const city = document.getElementById('travel-city');
  const year = document.getElementById('travel-year');
  const status = document.getElementById('travel-status');
  const template = document.getElementById('travel-card-template');
  const dataUrl = new URL('./travel-data.json?v=2', document.currentScript.src);
  let entries = [];
  const featuredFilter = 'featured';
  let selectedCountry = featuredFilter;
  let selectedCity = '';
  let selectedYear = '';

  const yearOf = (entry) => entry.date?.slice(0, 4);
  const matchesPlaceFilter = (entry, value) =>
    value === featuredFilter ? entry.featured === true : entry.country === value;
  const matchesCountry = (entry) => !selectedCountry || matchesPlaceFilter(entry, selectedCountry);
  const cityIs = (entry, value) => entry.city === value;
  const yearIs = (entry, value) => yearOf(entry) === value;
  const matchesCity = (entry) => !selectedCity || cityIs(entry, selectedCity);
  const matchesYear = (entry) => !selectedYear || yearIs(entry, selectedYear);

  function locationOf(entry) {
    return [...new Set([entry.city, entry.country].filter(Boolean))].join(', ');
  }

  function render() {
    const featured = selectedCountry === featuredFilter;
    grid.classList.toggle('travel-grid--featured', featured);
    const countryRecords = entries.filter(matchesCountry);
    const locationRecords = countryRecords.filter(matchesCity);
    const visible = locationRecords.filter(matchesYear);
    updateFilters(country, selectedCountry, entries.filter(matchesCity).filter(matchesYear), matchesPlaceFilter);
    updateFilters(city, selectedCity, countryRecords.filter(matchesYear), cityIs);
    updateFilters(year, selectedYear, locationRecords, yearIs);
    const cards = visible.map((entry, index) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.href = entry.url;
      const photo = card.querySelector('img');
      if (entry.cover) {
        photo.loading = index < 3 ? 'eager' : 'lazy';
        photo.src = new URL(entry.cover, dataUrl);
      } else {
        photo.remove();
      }
      const location = locationOf(entry);
      const visitYear = yearOf(entry);
      card.querySelector('strong').textContent = featured && entry.city ? entry.city : entry.name;
      card.querySelector('.travel-card-country').textContent = featured ? (entry.country ?? '') : '';
      card.querySelector('small').textContent = [featured ? entry.name : location, visitYear]
        .filter(Boolean).join(' · ');
      card.querySelector('.travel-card-label').textContent =
        featured && entry.city ? entry.city : entry.name;
      card.setAttribute('aria-label', [entry.name, location, visitYear].filter(Boolean).join(', '));
      return card;
    });
    grid.replaceChildren(...cards);
    status.textContent = visible.length ? '' : 'No places match these filters.';
  }

  function addFilters(group, options, select) {
    group.replaceChildren(...options.map(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = label;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => {
        select(value);
        render();
      });
      return button;
    }));
  }

  function updateFilters(group, selected, records, matches) {
    for (const button of group.children) {
      const value = button.value;
      const count = value ? records.filter((entry) => matches(entry, value)).length : records.length;
      button.hidden = value !== '' && count === 0 && value !== selected;
      button.setAttribute('aria-pressed', String(value === selected));
      button.lastElementChild.textContent = count;
    }
  }
  const embedded = document.getElementById('travel-data');
  const data = embedded ? Promise.resolve().then(() => JSON.parse(embedded.textContent)) :
    fetch(dataUrl).then((response) => {
      if (!response.ok) throw new Error('Travel records unavailable');
      return response.json();
    });
  data.then((records) => {
    entries = records;
    const countries = [...new Set(entries.map((entry) => entry.country).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const cities = [...new Set(entries.map((entry) => entry.city).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const years = [...new Set(entries.map(yearOf).filter(Boolean))].sort().reverse();
    addFilters(country, [
      ['', 'All countries'],
      [featuredFilter, 'Featured'],
      ...countries.map((value) => [value, value]),
    ], (value) => {
      selectedCountry = value;
    });
    addFilters(city, [['', 'All cities'], ...cities.map((value) => [value, value])], (value) => {
      selectedCity = value;
    });
    addFilters(year, [['', 'All years'], ...years.map((value) => [value, value])], (value) => {
      selectedYear = value;
    });
    render();
  }).catch(() => { status.textContent = 'Travel records are currently unavailable.'; });
})();
