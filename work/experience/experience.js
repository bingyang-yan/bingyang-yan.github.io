(() => {
  const section = document.getElementById('experience');
  const filters = document.getElementById('experience-category');
  const grid = document.getElementById('experience-grid');
  const status = document.getElementById('experience-status');
  const cardTemplate = document.getElementById('experience-card-template');
  const workPlaceholder = document.getElementById('experience-work-placeholder');
  const dataUrl = new URL('./education.json?v=5', document.currentScript.src);
  const educationFilter = filters.querySelector('[value="education"]');
  let selected = 'education';
  let educationCards = [];
  let educationStatus = 'Loading education…';

  function makeLink({ label, url }) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = label;
    return link;
  }

  function makeCard(entry) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('.news-card-date').textContent = entry.duration;
    const title = card.querySelector('.news-card-title');
    title.textContent = entry.title;
    card.querySelector('.experience-university strong').textContent = entry.university;
    const topic = card.querySelector('.experience-research-topic');
    topic.textContent = entry.researchTopic;
    if (entry.researchLink) topic.append(' ', makeLink(entry.researchLink));

    for (const link of entry.links) {
      if (link.label === 'Details') {
        const titleLink = makeLink({ label: entry.title, url: link.url });
        titleLink.className = 'news-card-title experience-details-link';
        card.classList.add('experience-linked-card');
        title.replaceChildren(titleLink);
        continue;
      }

      topic.append(' ', makeLink(link));
    }

    const photo = card.querySelector('.news-card-photo');
    if (entry.cover) {
      photo.querySelector('img').src = new URL(entry.cover, dataUrl);
    } else {
      photo.remove();
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
