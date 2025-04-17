const jobsData = Array.from({ length: 40 }).map((_, i) => {
    const categories = ["Errands", "Labor", "Cleaning", "Delivery", "Gardening", "Tutoring", "Painting"];
    const locations = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Thika", "Naivasha", "Meru"];
    const titles = [
      "Deliver groceries",
      "Clean a 2-bedroom apartment",
      "Tutor in Mathematics",
      "Paint a living room",
      "Gardening help needed",
      "Move heavy furniture",
      "Walk my dog",
      "Water the plants",
      "Run an urgent errand",
      "Teach basic coding",
    ];
  
    return {
      id: i + 1,
      title: titles[i % titles.length],
      category: categories[i % categories.length],
      price: Math.floor(Math.random() * 1000 + 500),
      location: locations[i % locations.length],
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      featured: Math.random() > 0.8,
    };
  });
  
  let currentPage = 1;
  const jobsPerPage = 6;
  
  const jobsContainer = document.getElementById("jobs-container");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  
  function renderJobs() {
    const searchQuery = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortBy = sortFilter.value;
  
    let filteredJobs = jobsData.filter(job => {
      const matchesCategory = selectedCategory === "All" || job.category === selectedCategory;
      const matchesSearch = job.title.toLowerCase().includes(searchQuery) || job.location.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  
    // Sort logic
    if (sortBy === "price-asc") {
      filteredJobs.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filteredJobs.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating-desc") {
      filteredJobs.sort((a, b) => b.rating - a.rating);
    }
  
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
  
    const start = (currentPage - 1) * jobsPerPage;
    const paginatedJobs = filteredJobs.slice(start, start + jobsPerPage);
  
    // Render jobs
    jobsContainer.innerHTML = paginatedJobs.map(job => `
      <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300 border border-gray-200 relative">
        ${job.featured ? '<span class="absolute top-2 right-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded">Featured</span>' : ''}
        <h3 class="text-xl font-semibold text-gray-800">${job.title}</h3>
        <p class="text-sm text-gray-500 mb-2">${job.category}</p>
        <p class="text-gray-700 font-bold mb-1">KES ${job.price}</p>
        <p class="text-sm text-gray-600 mb-2">
          <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${job.location}</span>
        </p>
        <div class="flex items-center space-x-1 text-yellow-500 mb-2">
          <span class="text-sm font-semibold text-gray-700">Rating:</span>
          <span title="Rating" class="text-sm">${job.rating}</span>
        </div>
        <button class="mt-2 btn btn-sm btn-primary w-full">Apply Now</button>
      </div>
    `).join("");
  
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  }
  
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderJobs();
  });
  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    renderJobs();
  });
  sortFilter.addEventListener("change", () => {
    currentPage = 1;
    renderJobs();
  });
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderJobs();
    }
  });
  nextPageBtn.addEventListener("click", () => {
    currentPage++;
    renderJobs();
  });
  
  renderJobs();
  