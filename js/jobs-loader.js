// Load and render job cards dynamically
document.addEventListener('DOMContentLoaded', function () {
    const jobsGrid = document.getElementById('jobsGrid');

    if (jobsGrid && typeof jobsData !== 'undefined') {
        renderJobs(jobsData);
    }
});

function renderJobs(jobs) {
    const jobsGrid = document.getElementById('jobsGrid');
    jobsGrid.innerHTML = '';

    jobs.forEach(job => {
        const jobCard = createJobCard(job);
        jobsGrid.innerHTML += jobCard;
    });
}

function createJobCard(job) {
    return `
    <div class="job-card" data-category="${job.category}">
      <div class="job-header">
        <div>
          <h3 class="job-title">${job.title}</h3>
        </div>
        <span class="job-badge">${job.type}</span>
      </div>
      <div class="job-meta">
        <span class="job-meta-item">
          <i class="fas fa-map-marker-alt"></i>
          ${job.location}
        </span>
        <span class="job-meta-item">
          <i class="fas fa-dollar-sign"></i>
          ${job.salary}
        </span>
        <span class="job-meta-item">
          <i class="fas fa-clock"></i>
          ${job.type}
        </span>
      </div>
      <p class="job-description">
        ${job.description}
      </p>
      <div class="job-tags">
        ${job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join('')}
      </div>
      <button class="job-apply" onclick="scrollToApply('${job.title}')">Ứng Tuyển Ngay</button>
    </div>
  `;
}
