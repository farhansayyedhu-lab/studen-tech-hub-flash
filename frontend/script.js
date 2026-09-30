/**
 * Student Tech Hub - Frontend Logic
 * Plain JavaScript (ES6+) without any frameworks
 * 
 * Demonstrates:
 * 1. Making GET requests with fetch() to retrieve data from FastAPI
 * 2. Making POST requests with fetch() sending JSON bodies to FastAPI
 * 3. Handling asynchronous operations (async / await)
 * 4. Dynamic DOM manipulation (creating cards, updating status badges)
 * 5. Beginner-friendly error handling and user feedback
 */

// -----------------------------------------------------------------------------
// Configuration & Constants
// -----------------------------------------------------------------------------
// The base URL of the FastAPI backend server
const API_BASE_URL = 'http://127.0.0.1:8000';

// In-memory cache of events for instant client-side category filtering
let allEvents = [];
let sessionRegistrations = [];

// -----------------------------------------------------------------------------
// DOM Elements Selection
// -----------------------------------------------------------------------------
const backendStatusDot = document.getElementById('backend-status-dot');
const backendStatusText = document.getElementById('backend-status-text');

const loadEventsBtn = document.getElementById('load-events-btn');
const loadEventsText = document.getElementById('load-events-text');
const eventsSpinner = document.getElementById('events-spinner');
const eventsContainer = document.getElementById('events-container');
const eventsAlert = document.getElementById('events-alert');
const filterBar = document.getElementById('filter-bar');

const registrationForm = document.getElementById('registration-form');
const studentNameInput = document.getElementById('student-name');
const studentEmailInput = document.getElementById('student-email');
const eventSelect = document.getElementById('event-select');
const registerSubmitBtn = document.getElementById('register-submit-btn');
const registerBtnText = document.getElementById('register-btn-text');
const registerSpinner = document.getElementById('register-spinner');
const formAlert = document.getElementById('form-alert');
const registrationsList = document.getElementById('registrations-list');
const registrationCountBadge = document.getElementById('registration-count-badge');


// -----------------------------------------------------------------------------
// Helper: Category CSS Class Mapping
// -----------------------------------------------------------------------------
function getCategoryBadgeClass(category) {
  const normalized = (category || '').toLowerCase();
  if (normalized.includes('web')) return 'category-web-dev';
  if (normalized.includes('ai') || normalized.includes('intelligence')) return 'category-ai';
  if (normalized.includes('hackathon')) return 'category-hackathon';
  if (normalized.includes('cloud') || normalized.includes('devops')) return 'category-cloud';
  if (normalized.includes('open source') || normalized.includes('git')) return 'category-open-source';
  return 'category-web-dev';
}


// -----------------------------------------------------------------------------
// Helper: Show/Hide Alert Notifications
// -----------------------------------------------------------------------------
function showAlert(element, message, type = 'error') {
  element.className = `alert alert-${type}`;
  element.innerHTML = message;
  element.classList.remove('hidden');
}

function hideAlert(element) {
  element.classList.add('hidden');
  element.innerHTML = '';
}


// -----------------------------------------------------------------------------
// 1. Backend Health Check
// -----------------------------------------------------------------------------
/**
 * Checks if the FastAPI backend is running by pinging the root endpoint (GET /).
 * Updates the navbar badge with a green dot if online or red dot if offline.
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      backendStatusDot.className = 'status-indicator status-online';
      backendStatusText.textContent = 'Backend Online (Port 8000)';
      return true;
    } else {
      throw new Error(`Server responded with status ${response.status}`);
    }
  } catch (error) {
    backendStatusDot.className = 'status-indicator status-offline';
    backendStatusText.textContent = 'Backend Offline';
    return false;
  }
}


// -----------------------------------------------------------------------------
// 2. Load Events from Backend (GET /api/events)
// -----------------------------------------------------------------------------
/**
 * Fetches the list of upcoming technical events from the FastAPI backend.
 * Renders the event cards dynamically into the DOM.
 */
async function loadEvents() {
  hideAlert(eventsAlert);

  // Set loading state on button
  loadEventsBtn.disabled = true;
  eventsSpinner.classList.remove('hidden');
  loadEventsText.textContent = 'Fetching Events...';

  try {
    // Send GET request to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
    }

    const data = await response.json();
    allEvents = data.events || [];

    // Render cards and update form dropdown
    renderEventCards(allEvents);
    populateEventSelect(allEvents);

    // Show filter bar
    if (allEvents.length > 0) {
      filterBar.classList.remove('hidden');
    }

    // Update status dot to online
    backendStatusDot.className = 'status-indicator status-online';
    backendStatusText.textContent = 'Backend Online (Port 8000)';

    // Friendly success feedback
    showAlert(
      eventsAlert,
      `✅ Successfully fetched <strong>${allEvents.length} upcoming events</strong> from FastAPI!`,
      'success'
    );

    // Auto-hide success alert after 4 seconds
    setTimeout(() => hideAlert(eventsAlert), 4000);

  } catch (error) {
    console.error('Failed to load events:', error);

    // Update status dot to offline
    backendStatusDot.className = 'status-indicator status-offline';
    backendStatusText.textContent = 'Backend Offline';

    // Show beginner-friendly explanation and instruction
    showAlert(
      eventsAlert,
      `<strong>⚠️ Could not connect to backend server.</strong><br>
       Make sure your FastAPI server is running at <code>${API_BASE_URL}</code>.<br><br>
       <strong>To start the backend, open your terminal and run:</strong><br>
       <code style="background:#1e293b; color:#38bdf8; padding:3px 8px; border-radius:4px; display:inline-block; margin-top:4px;">
         python -m uvicorn backend.main:app --reload --port 8000
       </code>`,
      'error'
    );
  } finally {
    // Reset button state
    loadEventsBtn.disabled = false;
    eventsSpinner.classList.add('hidden');
    loadEventsText.textContent = '🔄 Refresh Events from Backend';
  }
}


// -----------------------------------------------------------------------------
// 3. Render Event Cards in HTML
// -----------------------------------------------------------------------------
/**
 * Takes an array of event objects and inserts HTML cards into #events-container.
 */
function renderEventCards(eventsToRender) {
  eventsContainer.innerHTML = '';

  if (!eventsToRender || eventsToRender.length === 0) {
    eventsContainer.innerHTML = `
      <div class="placeholder-card">
        <div class="placeholder-icon">🔍</div>
        <h3>No events found</h3>
        <p>No events match the selected category filter.</p>
      </div>
    `;
    return;
  }

  eventsToRender.forEach(event => {
    const card = document.createElement('article');
    card.className = 'event-card';

    const categoryBadgeClass = getCategoryBadgeClass(event.category);

    card.innerHTML = `
      <div>
        <div class="event-card-top">
          <span class="category-tag ${categoryBadgeClass}">${escapeHtml(event.category)}</span>
          <span class="event-id-badge">ID #${event.id}</span>
        </div>
        <h3 class="event-title">${escapeHtml(event.title)}</h3>
        <p class="event-desc">${escapeHtml(event.description)}</p>
      </div>

      <div>
        <div class="event-meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span><strong>Date:</strong> ${escapeHtml(event.date)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏰</span>
            <span><strong>Time:</strong> ${escapeHtml(event.time)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span><strong>Location:</strong> ${escapeHtml(event.location)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">🎤</span>
            <span><strong>Speaker:</strong> ${escapeHtml(event.speaker)}</span>
          </div>
        </div>

        <div class="event-card-actions">
          <button class="btn btn-secondary btn-sm btn-full select-event-btn" data-id="${event.id}" data-title="${escapeHtml(event.title)}">
            ✍️ Select to Register
          </button>
        </div>
      </div>
    `;

    eventsContainer.appendChild(card);
  });

  // Attach click listener to "Select to Register" buttons
  const selectBtns = eventsContainer.querySelectorAll('.select-event-btn');
  selectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-id');
      eventSelect.value = eventId;

      // Smooth scroll to registration section
      document.getElementById('register-section').scrollIntoView({ behavior: 'smooth' });
      
      // Focus the name input
      studentNameInput.focus();
    });
  });
}


// -----------------------------------------------------------------------------
// 4. Populate Dropdown with Loaded Events
// -----------------------------------------------------------------------------
function populateEventSelect(events) {
  // Clear any existing options except the first "General Community" option
  eventSelect.innerHTML = '<option value="">General Community Membership</option>';

  events.forEach(event => {
    const option = document.createElement('option');
    option.value = event.id;
    option.textContent = `#${event.id} - ${event.title}`;
    eventSelect.appendChild(option);
  });
}


// -----------------------------------------------------------------------------
// 5. Handle Student Registration (POST /api/register)
// -----------------------------------------------------------------------------
/**
 * Intercepts the form submission, validates name and email,
 * and sends a POST request with JSON payload to /api/register.
 */
async function handleRegistration(e) {
  e.preventDefault();
  hideAlert(formAlert);

  const name = studentNameInput.value.trim();
  const email = studentEmailInput.value.trim();
  const selectedEventId = eventSelect.value ? parseInt(eventSelect.value, 10) : null;
  const selectedEventTitle = eventSelect.value
    ? eventSelect.options[eventSelect.selectedIndex].text
    : 'General Community Membership';

  // Basic Client-Side Validation
  if (!name) {
    showAlert(formAlert, '⚠️ Please enter your full name.', 'warning');
    studentNameInput.focus();
    return;
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    showAlert(formAlert, '⚠️ Please provide a valid email address (e.g. alex@example.com).', 'warning');
    studentEmailInput.focus();
    return;
  }

  // Set Loading State
  registerSubmitBtn.disabled = true;
  registerSpinner.classList.remove('hidden');
  registerBtnText.textContent = 'Submitting Registration...';

  // Construct request payload matching backend Pydantic model
  const payload = {
    name: name,
    email: email,
    event_id: selectedEventId,
    event_title: selectedEventTitle
  };

  try {
    // Send POST request to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorDetail = responseData.detail || 'Failed to register student.';
      throw new Error(errorDetail);
    }

    // Success response from backend
    showAlert(
      formAlert,
      `🎉 <strong>Success!</strong> ${escapeHtml(responseData.message || 'Registration successful!')}`,
      'success'
    );

    // Track registration in the session activity list
    const newReg = responseData.registration || {
      name: name,
      email: email,
      event_title: selectedEventTitle
    };
    sessionRegistrations.unshift(newReg);
    renderRegistrationsList();

    // Reset form fields
    studentNameInput.value = '';
    studentEmailInput.value = '';
    eventSelect.value = '';

  } catch (error) {
    console.error('Registration failed:', error);
    showAlert(
      formAlert,
      `<strong>❌ Registration Error:</strong> ${escapeHtml(error.message)}<br>
       <span style="font-size:0.8rem; color:#64748b;">Make sure the FastAPI backend is running on <code>http://127.0.0.1:8000</code>.</span>`,
      'error'
    );
  } finally {
    // Reset button state
    registerSubmitBtn.disabled = false;
    registerSpinner.classList.add('hidden');
    registerBtnText.textContent = '🚀 Complete Registration';
  }
}


// -----------------------------------------------------------------------------
// 6. Render Recent Session Registrations
// -----------------------------------------------------------------------------
function renderRegistrationsList() {
  registrationCountBadge.textContent = `${sessionRegistrations.length} Registration${sessionRegistrations.length === 1 ? '' : 's'}`;

  if (sessionRegistrations.length === 0) {
    registrationsList.innerHTML = `
      <div class="empty-list-placeholder">
        <span>No registrations yet in this session. Be the first to register!</span>
      </div>
    `;
    return;
  }

  registrationsList.innerHTML = '';
  sessionRegistrations.forEach(reg => {
    const item = document.createElement('div');
    item.className = 'reg-item';
    item.innerHTML = `
      <div class="reg-item-info">
        <span class="reg-item-name">${escapeHtml(reg.name)}</span>
        <span class="reg-item-meta">${escapeHtml(reg.email)} • ${escapeHtml(reg.event_title || 'General')}</span>
      </div>
      <span class="reg-item-badge">✓ Confirmed</span>
    `;
    registrationsList.appendChild(item);
  });
}


// -----------------------------------------------------------------------------
// 7. Category Filter Event Listeners
// -----------------------------------------------------------------------------
function setupCategoryFilters() {
  const chips = filterBar.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Toggle active class
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const category = chip.getAttribute('data-category');
      if (category === 'all') {
        renderEventCards(allEvents);
      } else {
        const filtered = allEvents.filter(ev => 
          (ev.category || '').toLowerCase().includes(category.toLowerCase())
        );
        renderEventCards(filtered);
      }
    });
  });
}


// -----------------------------------------------------------------------------
// Utility: Escape HTML strings to prevent XSS
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// -----------------------------------------------------------------------------
// Initialization on Page Load
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // Check backend connectivity on startup
  const isHealthy = await checkBackendHealth();

  // If backend is running, automatically load events for the best user experience
  if (isHealthy) {
    await loadEvents();
  }

  // Set up button listeners
  loadEventsBtn.addEventListener('click', loadEvents);
  registrationForm.addEventListener('submit', handleRegistration);
  setupCategoryFilters();
});
