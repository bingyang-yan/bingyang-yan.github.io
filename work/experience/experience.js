(() => {
  const section = document.getElementById('experience');
  const filters = document.getElementById('experience-category');
  const grid = document.getElementById('experience-grid');
  const status = document.getElementById('experience-status');
  const cardTemplate = document.getElementById('experience-card-template');
  const workPlaceholder = document.getElementById('experience-work-placeholder');
  const dialog = document.getElementById('experience-photo-dialog');
  const enlargedPhoto = dialog.querySelector('img');
  const dataUrl = new URL('./education.json?v=2', document.currentScript.src);
  const educationFilter = filters.querySelector('[value="education"]');
  let selected = 'education';
  let educationCards = [];
  let educationStatus = 'Loading education…';

  function makeCard(entry) {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector('.news-card-date').textContent = entry.duration;
    card.querySelector('.news-card-title').textContent = entry.title;
    const links = card.querySelector('.news-card-links');
    for (const { label, url } of entry.links) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = url;
      link.textContent = label;
      item.append(link);
      links.append(item);
    }

    const photo = card.querySelector('.news-card-photo');
    if (entry.cover) {
      const coverUrl = new URL(entry.cover, dataUrl);
      photo.querySelector('img').src = coverUrl;
      photo.setAttribute('aria-label', 'Enlarge photo: ' + entry.title);
      photo.addEventListener('click', () => {
        enlargedPhoto.src = coverUrl;
        enlargedPhoto.alt = entry.title;
        dialog.showModal();
      });
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

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
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
