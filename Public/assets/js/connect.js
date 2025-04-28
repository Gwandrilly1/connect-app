document.addEventListener('DOMContentLoaded', () => {
    // Load navbar
    fetch('navbar.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;
            activateCurrentPage();
        });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltips].forEach(t => new bootstrap.Tooltip(t));

    // Job data and rendering
    const jobs = []; // Your job data here
    
    function renderJobs(containerId, jobs) {
        const container = document.getElementById(containerId);
        container.innerHTML = jobs.map(job => `
            <div class="col-md-4">
                <div class="card job-card h-100">
                    <span class="category-badge badge">${job.category}</span>
                    <div class="card-body">
                        <h5>${job.title}</h5>
                        <p class="text-muted">${job.location}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <h4 class="text-primary">KES ${job.price}</h4>
                            <button class="btn btn-sm btn-accent">View Job</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize featured jobs
    renderJobs('featuredJobs', jobs.slice(0, 3));

    // Activate current page in navbar
    function activateCurrentPage() {
        const currentPath = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-link').forEach(link => {
            if(link.getAttribute('href') === currentPath) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            const isOpen = !content.classList.contains('hidden');
            faqToggles.forEach(t => t.nextElementSibling.classList.add('hidden'));
            if (!isOpen) {
                content.classList.remove('hidden');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const depositForm = document.getElementById('deposit-form');
  const balanceEl = document.getElementById('wallet-balance');
  const historyEl = document.getElementById('transaction-history');

  let balance = parseInt(balanceEl.textContent.replace(/[^0-9]/g, ''));

  depositForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const amount = parseInt(document.getElementById('deposit-amount').value);
    if (!isNaN(amount) && amount > 0) {
      balance += amount;
      balanceEl.textContent = balance.toLocaleString();

      // Create a new transaction
      const date = new Date();
      const dateStr = date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const transaction = document.createElement('div');
      transaction.className = 'bg-gray-50 p-4 rounded-lg';
      transaction.innerHTML = `<p class="text-gray-700">Deposited KES ${amount}</p>
                               <p class="text-sm text-gray-500">${dateStr}</p>`;
      historyEl.prepend(transaction);

      // Close modal and reset form
      depositForm.reset();
      bootstrap.Modal.getInstance(document.getElementById('depositModal')).hide();
    }
  });
});
const rating = (Math.random() * 2 + 3).toFixed(1); // random 3.0 - 5.0
const available = Math.random() > 0.3; // 70% available

const popupContent = `
  <div class="flex items-center space-x-4">
    <img src="${worker.profilePic}" alt="Profile Picture" class="profile-img"/>
    <div>
      <b>${worker.name}</b> (${rating} ⭐)<br>
      Type: ${worker.type}<br>
      Location: ${worker.location}<br>
      Rate: ${worker.price}<br>
      Status: <span class="${available ? 'text-green-600' : 'text-red-600'} font-bold">${available ? 'Available 🟢' : 'Busy 🔴'}</span><br>
      <button class="btn btn-sm btn-info mt-2" onclick="viewProfile('${worker.name}')">View Profile</button>
      <button class="btn btn-sm btn-success mt-1" onclick="bookWorker('${worker.name}', ${available})">Book</button>
    </div>
  </div>
`;
function bookWorker(name, isAvailable) {
  if (!isAvailable) {
    alert(`${name} is currently unavailable.`);
    return;
  }
  alert(`Booking request sent to ${name}.`);
  if ("Notification" in window) {
    Notification.requestPermission().then(() => {
      new Notification("Booking Sent", {
        body: `Your booking request was sent to ${name}.`,
        icon: "https://cdn-icons-png.flaticon.com/512/1034/1034146.png"
      });
    });
  }
}
    // Initialize the map
    const map = L.map('map').setView([-1.2921, 36.8219], 7);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom icons by job type
    const defaultIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });

    const customIcons = {
      "Cleaning": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/809/809957.png', iconSize: [30, 30] }),
      "Plumbing": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png', iconSize: [30, 30] }),
      "Pet Care": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616408.png', iconSize: [30, 30] }),
      "Delivery": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048953.png', iconSize: [30, 30] }),
      "Education": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135756.png', iconSize: [30, 30] }),
      "Errands": L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828919.png', iconSize: [30, 30] })
    };

    // Cluster group
    const markerClusterGroup = L.markerClusterGroup();
    const heatmapData = [];

    // Generate 100+ mock users with randomized coordinates in Kenya
    const jobTypes = ["Cleaning", "Plumbing", "Pet Care", "Delivery", "Education", "Errands"];
    const locations = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru", "Thika", "Machakos", "Nyeri", "Kitale", "Garissa"];

    const getRandomCoord = (baseLat, baseLng, range = 0.5) => {
      return [
        baseLat + (Math.random() - 0.5) * range,
        baseLng + (Math.random() - 0.5) * range
      ];
    };

    const getRandomPrice = () => `KES ${Math.floor(500 + Math.random() * 5000)}`;

    const mockUsers = [];
    for (let i = 0; i < 100; i++) {
      const type = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const coords = getRandomCoord(-1.3, 36.8, 5); // center around Nairobi
      mockUsers.push({
        name: `Worker ${i + 1}`,
        type,
        location,
        lat: coords[0],
        lng: coords[1],
        price: getRandomPrice(),
        profilePic: `https://randomuser.me/api/portraits/men/${i + 1}.jpg`  // Mock profile picture
      });
    }

    // Add markers and heatmap data
    mockUsers.forEach(worker => {
      const marker = L.marker([worker.lat, worker.lng], {
        icon: customIcons[worker.type] || defaultIcon
      });

      const popupContent = `
        <div class="flex items-center space-x-4">
          <img src="${worker.profilePic}" alt="Profile Picture" class="profile-img"/>
          <div>
            <b>${worker.name}</b><br>
            Type: ${worker.type}<br>
            Location: ${worker.location}<br>
            Rate: ${worker.price}<br>
            <button class="btn btn-primary mt-3" onclick="bookWorker('${worker.name}')">Book this Worker</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markerClusterGroup.addLayer(marker);
      heatmapData.push([worker.lat, worker.lng, 0.5 + Math.random()]); // simulate intensity
    });

    // Add cluster to map
    map.addLayer(markerClusterGroup);

    // Add heatmap layer
    const heat = L.heatLayer(heatmapData, {
      radius: 25,
      blur: 20,
      gradient: {
        0.2: 'blue',
        0.4: 'lime',
        0.6: 'orange',
        0.8: 'red'
      }
    }).addTo(map);

    // Book Worker function (stub for now)
    function bookWorker(workerName) {
      alert(`Booking request for ${workerName}`);
    }
    function viewProfile(name) {
        document.getElementById("profileContent").innerText = `${name}'s detailed profile info (mockup).`;
        document.getElementById("profileModal").classList.remove("hidden");
      }
      function closeProfile() {
        document.getElementById("profileModal").classList.add("hidden");
      }
      document.getElementById("jobFilter").addEventListener("change", () => {
        // filter logic here to redraw map
      });
      
