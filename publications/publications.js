(() => {
  const list = document.getElementById('publications-list');
  const status = document.getElementById('publications-status');
  const template = document.getElementById('publication-card-template');
  const dataUrl = new URL('./data.json', document.currentScript.src);
  const yearOf = (entry) => entry.date.slice(0, 4);
  const filters = [
    { group: document.getElementById('publications-type'), all: 'All types', valueOf: (entry) => entry.type },
    { group: document.getElementById('publications-year'), all: 'All years', valueOf: yearOf, newestFirst: true },
  ];
  const matches = (entry, filter) => !filter.value || filter.valueOf(entry) === filter.value;
  let entries = [];

  function summarize(description) {
    if (description.length <= 280) return description;
    const preview = description.slice(0, 281);
    const sentence = preview.lastIndexOf('. ');
    if (sentence >= 110) return preview.slice(0, sentence + 1);
    return preview.slice(0, preview.lastIndexOf(' ')).trimEnd() + '…';
  }

  function makeCard(entry) {
    const card = template.content.firstElementChild.cloneNode(true);
    const title = card.querySelector('.news-card-title');
    title.href = entry.url;
    title.textContent = entry.title;

    const cover = card.querySelector('.publication-cover');
    if (entry.cover) {
      cover.href = entry.url;
      const image = cover.querySelector('img');
      image.addEventListener('error', () => cover.remove(), { once: true });
      image.src = new URL(entry.cover, dataUrl);
    } else {
      cover.remove();
    }

    const fields = {
      authors: entry.authors,
      venue: [entry.venue || entry.type, yearOf(entry)].filter(Boolean).join(' · '),
      description: summarize(entry.description),
    };
    for (const [field, value] of Object.entries(fields)) {
      const element = card.querySelector('.publication-' + field);
      if (value) element.textContent = value;
      else element.remove();
    }

    const links = card.querySelector('.news-card-links');
    for (const { label, url } of entry.links) {
      const item = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.textContent = label;
      item.append(anchor);
      links.append(item);
    }
    return card;
  }

  function render() {
    for (const filter of filters) {
      const scoped = entries.filter((entry) => filters.every((other) => other === filter || matches(entry, other)));
      for (const button of filter.group.children) {
        const { value } = button;
        button.setAttribute('aria-pressed', String(filter.value === value));
        button.lastElementChild.textContent = value
          ? scoped.filter((entry) => filter.valueOf(entry) === value).length
          : scoped.length;
      }
    }
    const visible = entries.filter((entry) => filters.every((filter) => matches(entry, filter)));
    list.replaceChildren(...visible.map(makeCard));
    status.textContent = visible.length ? '' : 'No publications match these filters.';
  }

  function addFilters(filter) {
    filter.value = '';
    const values = [...new Set(entries.map(filter.valueOf).filter(Boolean))].sort();
    if (filter.newestFirst) values.reverse();
    for (const value of ['', ...values]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'travel-filter';
      button.value = value;
      button.textContent = value || filter.all;
      button.append(document.createElement('span'));
      button.addEventListener('click', () => {
        filter.value = value;
        render();
      });
      filter.group.append(button);
    }
  }

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Publication records unavailable');
      return response.json();
    })
    .then((records) => {
      entries = records;
      if (entries.length) filters.forEach(addFilters);
      render();
    })
    .catch(() => { status.textContent = 'Publication records are currently unavailable.'; });
})();
