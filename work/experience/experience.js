(() => {
  const section = document.getElementById('experience');
  const filters = document.getElementById('experience-category');
  const grid = document.getElementById('experience-grid');
  const status = document.getElementById('experience-status');
  const cardTemplate = document.getElementById('experience-card-template');
  const workPlaceholder = document.getElementById('experience-work-placeholder');
  const dataUrl = new URL('./education.json?v=7', document.currentScript.src);
  const educationFilter = filters.querySelector('[value="education"]');
  let selected = 'education';
  let educationCards = [];
  let educationStatus = 'Loading education…';
  const cardResizeObserver = new ResizeObserver((entries) => {
    for (const { target, borderBoxSize } of entries) {
      const width = borderBoxSize[0].inlineSize;
      if (width > 0) target.style.setProperty('--experience-hover-scale', (width + 6) / width);
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function formatDuration(duration) {
    const range = /^(\d{4})\.(0[1-9]|1[0-2])\s*[-–]\s*(\d{4})\.(0[1-9]|1[0-2])$/.exec(duration);
    if (!range) return duration;
    const [, startYear, startMonth, endYear, endMonth] = range;
    return [startYear + startMonth, endYear + endMonth].sort().reverse()
      .map((date) => months[Number(date.slice(4)) - 1] + ' ' + date.slice(0, 4))
      .join(' - ');
  }

  function makeCard(entry) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('.news-card-date').textContent = formatDuration(entry.duration);
    card.querySelector('.news-card-title').textContent = entry.title;
    card.querySelector('.experience-university strong').textContent = entry.university;

    const link = card.querySelector('.experience-details-link');
    const details = entry.links?.find(({ label }) => label === 'Details');
    if (details?.url) {
      link.href = new URL(details.url, dataUrl);
      link.setAttribute('aria-label', 'Learn more about ' + entry.title);
      cardResizeObserver.observe(card, { box: 'border-box' });
    } else {
      link.remove();
    }

    const cover = card.querySelector('.experience-card-cover');
    if (entry.cover) {
      cover.querySelector('img').src = new URL(entry.cover, dataUrl);
    } else {
      cover.remove();
    }
    return card;
  }

  function render() {
    section.dataset.category = selected;
    for (const button of filters.children) {
      button.setAttribute('aria-pressed', String(button.value === selected));
    }
    if (selected === 'work') {
      grid.replaceChildren(workPlaceholder.content.cloneNode(true));
      status.textContent = 'Work has no entries.';
      return;
    }
    grid.replaceChildren(...educationCards);
    status.textContent = educationStatus;
  }

  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.value === selected) return;
    selected = button.value;
    grid.scrollLeft = 0;
    render();
  });

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) throw new Error('Education records unavailable');
      return response.json();
    })
    .then((entries) => {
      educationCards = entries.map(makeCard);
      educationFilter.lastElementChild.textContent = entries.length;
      educationStatus = entries.length ? '' : 'No education records.';
    })
    .catch(() => {
      educationStatus = 'Education records are currently unavailable.';
    })
    .then(() => {
      if (selected === 'education') render();
    });
})();
