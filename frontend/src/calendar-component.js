class EventCalendar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.events = [];
    this.zoomLevel = 0;
    this.zones = ['today', 'tomorrow', 'nextweek', 'next3to5', 'nextMonth'];
    this.zoneNames = ['Today', 'Tomorrow', 'Next Week or 2', 'Next 3-5 Weeks', 'Next Month or More'];
    this.zoomTexts = ['SHOW TOMORROW', 'SHOW NEXT WEEK', 'SHOW NEXT 3-5 WEEKS', 'SHOW NEXT MONTH+', 'TODAY ONLY'];
    console.log('Component created!');
    // Cache current time values
    const now = new Date();
    this.currentDay = now.getDate();
    this.currentMonth = now.getMonth() + 1;
    this.currentYear = now.getFullYear();
    this.currentHour = now.getHours();
    this.currentMinute = now.getMinutes();
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.populateWheels();
    this.renderEvents();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, monospace;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; border: none; }
        .cont { 
          max-width: 24rem; 
          width: 100%; 
          background-color: #222; 
          color: #DDD; 
          padding: 0.7rem; 
          border-radius: 0.5rem; 
        }
        h2 { font-size: 1rem; margin-bottom: 0.25rem; }
        label { display: flex; flex-direction: column; font-size: 0.8rem; margin-bottom: 0.4rem; }
        input { 
          padding: 0.35rem; 
          border-radius: 0.25rem; 
          border: none; 
          margin-top: 0.15rem; 
          background: #333;
          color: #FFF;
        }
        .invalid {
          border: 1px solid #c33 !important;
        }
        .wheels { 
          display: flex; 
          gap: 0.25rem; 
          margin-top: 0.15rem; 
          position: relative;
        }
        .wheel {
          height: 4.5rem;
          background-color: #333; 
          color: #DDD; 
          border-radius: 0.25rem; 
          width: 100%; 
          text-align: center; 
          font-size: 0.9rem; 
          line-height: 4.5rem;
          position: relative;
          cursor: pointer;
          user-select: none;
        }
        .dropdown .selected {
          padding: 0 0.35rem;
        }
        .dropdown .dropdown-options {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #333;
          z-index: 100;
          max-height: 10rem;
          overflow-y: auto;
          text-align: left;
        }
        .dropdown .option {
          padding: 0.35rem;
          line-height: normal;
          cursor: pointer;
        }
        .dropdown .option:hover {
          background: #444;
        }
        .am-pm-btn { 
          height: 4.5rem;
          background-color: #333; 
          color: #DDD; 
          border: none; 
          border-radius: 0.25rem; 
          width: 100%; 
          text-align: center;
          cursor: pointer;
          font-size: 0.9rem;
          z-index: 1;
        }
        .am-pm-btn.pm { background-color: #444; }
        .btn-row { 
          display: flex; 
          gap: 0.25rem; 
          margin: 0.4rem 0; 
        }
        .btn { 
          background-color: #444; 
          color: #DDD; 
          border: none; 
          border-radius: 0.25rem; 
          padding: 0.4rem 0.5rem; 
          cursor: pointer; 
          flex: 1; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 0.35rem; 
          font-size: 0.8rem; 
        }
        .btn:hover { background-color: #555; }
        .btn-add { 
          background-color: #338; 
          width: 100%;
          padding: 0.7rem;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          font-weight: bold;
        }
        .btn-zoom-in { background-color: #383; }
        .ev-group { 
          padding: 0.5rem; 
          border-radius: 0.35rem; 
          display: none; 
          margin-bottom: 0.4rem;
        }
        .ev-group.today { 
          background-color: rgba(30, 58, 138, 0.6); 
          display: block; 
        }
        .ev-group.tomorrow { background-color: rgba(5, 46, 22, 0.6); }
        .ev-group.nextweek { background-color: rgba(146, 64, 14, 0.6); }
        .ev-group.next3to5 { background-color: rgba(76, 29, 149, 0.6); }
        .ev-group.nextMonth { background-color: rgb(100, 30, 30); }
        .ev-header { 
          font-size: 1rem; 
          font-weight: 700; 
          border-bottom: 1px solid #555; 
          padding-bottom: 0.25rem; 
          margin-bottom: 0.25rem; 
        }
        .ev-slot { 
          padding: 0.35rem 0.5rem; 
          border-radius: 0.25rem; 
          margin-bottom: 0.35rem; 
          background-color: rgba(40, 40, 40, 0.7); 
        }
        .ev-line { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }
        .ev-title { 
          color: #DDD; 
          font-size: 0.9rem; 
        }
        .ev-time { 
          font-size: 0.75rem; 
          color: #AAA; 
        }
        .ev-date { 
          font-size: 0.7rem; 
          color: #888; 
          margin-top: 0.15rem; 
        }
      </style>
      
      <div class="cont">
        <!-- FORM -->
        <form id="evForm">
         
          <label>
            Title:
            <input type="text" id="evTitle" autocomplete="off"/>
          </label>
          <label>
            Time:
            <div class="wheels">
              <div id="evHour" class="wheel dropdown"></div>
              <div id="evMinute" class="wheel dropdown"></div>
              <button type="button" id="amPmBtn" class="am-pm-btn">AM</button>
            </div>
          </label>
          <label>
            Date:
            <div class="wheels">
              <div id="evMonth" class="wheel dropdown"></div>
              <div id="evDay" class="wheel dropdown"></div>
              <div id="evYear" class="wheel dropdown"></div>
            </div>
          </label>
          <button type="submit" class="btn btn-add">ADD EVENT</button>
        </form>
        
        <!-- ZOOM BUTTONS -->
        <div class="btn-row">
          <button id="zoomInBtn" class="btn btn-zoom-in">TODAY ONLY</button>
          <button id="zoomOutBtn" class="btn">SHOW TOMORROW</button>
        </div>
        
        <!-- EVENTS DISPLAY -->
        <div id="evContainer"></div>
      </div>
    `;
  }
  
  setupEventListeners() {
    this.monthWheel = this.shadowRoot.getElementById('evMonth');
    this.dayWheel = this.shadowRoot.getElementById('evDay');
    this.yearWheel = this.shadowRoot.getElementById('evYear');
    this.hourWheel = this.shadowRoot.getElementById('evHour');
    this.minuteWheel = this.shadowRoot.getElementById('evMinute');
    this.amPmButton = this.shadowRoot.getElementById('amPmBtn');
    this.zoomInButton = this.shadowRoot.getElementById('zoomInBtn');
    this.zoomOutButton = this.shadowRoot.getElementById('zoomOutBtn');
    this.eventsContainer = this.shadowRoot.getElementById('evContainer');
    this.eventForm = this.shadowRoot.getElementById('evForm');
    this.titleInput = this.shadowRoot.getElementById('evTitle');

    // Add input validation cleanup
    this.titleInput.addEventListener('input', () => {
      this.titleInput.classList.remove('invalid');
    });

    // AM/PM toggle handler
    this.amPmButton.addEventListener('click', (e) => {
      if (e.target !== this.amPmButton) return;
      e.stopImmediatePropagation();
      this.amPmButton.textContent = this.amPmButton.textContent === 'AM' ? 'PM' : 'AM';
      this.amPmButton.classList.toggle('pm');
    });

    // Wheel isolation
    [this.hourWheel, this.minuteWheel].forEach(wheel => {
      wheel.addEventListener('click', e => {
        e.stopImmediatePropagation();
        e.preventDefault();
      });
    });

    this.zoomInButton.addEventListener('click', () => {
      this.zoomLevel = 0;
      this.updateVisibleGroups();
      this.zoomOutButton.textContent = this.zoomTexts[this.zoomLevel];
    });
    
    this.zoomOutButton.addEventListener('click', () => {
      this.zoomLevel = (this.zoomLevel + 1) % 5;
      this.updateVisibleGroups();
      this.zoomOutButton.textContent = this.zoomTexts[this.zoomLevel];
    });
    
    this.eventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = this.titleInput.value.trim();
      
      // Validate title
      if (!title) {
        this.titleInput.classList.add('invalid');
        return;
      }

      const hour = parseInt(this.hourWheel.dataset.value);
      const minute = parseInt(this.minuteWheel.dataset.value);
      const amPm = this.amPmButton.textContent;
      const day = parseInt(this.dayWheel.dataset.value);
      const month = parseInt(this.monthWheel.dataset.value);
      const year = parseInt(this.yearWheel.dataset.value);
      
      const timeStr = `${hour}:${minute.toString().padStart(2, '0')} ${amPm}`;
      const eventDate = new Date(year, month - 1, day);
      
      this.events.push({
        title: title,
        time: timeStr,
        date: eventDate
      });
      
      const groupKey = this.getEventGroup(eventDate);
      const groupIndex = this.zones.indexOf(groupKey);
      if (groupIndex > this.zoomLevel) {
        this.zoomLevel = groupIndex;
        this.zoomOutButton.textContent = this.zoomTexts[this.zoomLevel];
      }
      
      this.renderEvents();
      this.eventForm.reset();
      this.resetFormToDefaults();
      this.titleInput.classList.remove('invalid');
    });
    
    this.shadowRoot.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        this.closeAllDropdowns();
      }
    });
  }
  
  closeAllDropdowns() {
    const dropdownOptions = this.shadowRoot.querySelectorAll('.dropdown .dropdown-options');
    dropdownOptions.forEach(opt => opt.style.display = 'none');
  }
  
  populateDropdownWheel(wheel, options, padZero = false) {
    wheel.innerHTML = `<div class="selected"></div><div class="dropdown-options"></div>`;
    const selectedDiv = wheel.querySelector('.selected');
    const optionsContainer = wheel.querySelector('.dropdown-options');
    
    // Add container-level propagation blocker
    optionsContainer.addEventListener('click', e => {
      e.stopImmediatePropagation();
      e.preventDefault();
    });

    options.forEach(optVal => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';
      optionDiv.dataset.value = optVal;
      optionDiv.textContent = padZero ? String(optVal).padStart(2, '0') : optVal;
      optionDiv.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        selectedDiv.textContent = optionDiv.textContent;
        wheel.dataset.value = optVal;
        optionsContainer.style.display = 'none';
      });
      optionsContainer.appendChild(optionDiv);
    });
    
    wheel.addEventListener('mouseenter', () => {
      optionsContainer.style.display = 'block';
    });
    
    wheel.addEventListener('mouseleave', () => {
      optionsContainer.style.display = 'none';
    });
  }
  
  populateWheels() {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    this.populateDropdownWheel(this.monthWheel, monthNames.map((_, i) => i + 1));
    
    const dayOptions = Array.from({length: 31}, (_, i) => i + 1);
    this.populateDropdownWheel(this.dayWheel, dayOptions);
    
    const yearOptions = Array.from({length: 11}, (_, i) => this.currentYear + i);
    this.populateDropdownWheel(this.yearWheel, yearOptions);
    
    const hourOptions = Array.from({length: 12}, (_, i) => i + 1);
    this.populateDropdownWheel(this.hourWheel, hourOptions, true);
    
    const minuteOptions = Array.from({length: 12}, (_, i) => i * 5);
    this.populateDropdownWheel(this.minuteWheel, minuteOptions, true);
    
    this.resetFormToDefaults();
  }
  
  resetFormToDefaults() {
    const updateWheel = (wheel, value, padZero = false, replacer = null) => {
      wheel.dataset.value = value;
      const selectedDiv = wheel.querySelector('.selected');
      selectedDiv.textContent = replacer ? replacer(value) : 
        padZero ? String(value).padStart(2, '0') : value;
    };
    
    updateWheel(this.monthWheel, this.currentMonth, false, v => 
      ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][v - 1]);
    updateWheel(this.dayWheel, this.currentDay);
    updateWheel(this.yearWheel, this.currentYear);
    updateWheel(this.hourWheel, this.currentHour % 12 || 12, true);
    updateWheel(this.minuteWheel, Math.floor(this.currentMinute / 5) * 5, true);
    
    this.amPmButton.textContent = this.currentHour >= 12 ? 'PM' : 'AM';
    this.amPmButton.classList.toggle('pm', this.currentHour >= 12);
  }
  
  getEventGroup(eventDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    eventDate = new Date(eventDate);
    eventDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.ceil((eventDate - now) / 86400000);
    if (dayDiff === 0) return 'today';
    if (dayDiff === 1) return 'tomorrow';
    if (dayDiff <= 14) return 'nextweek';
    if (dayDiff <= 35) return 'next3to5';
    return 'nextMonth';
  }
  
  updateVisibleGroups() {
    this.shadowRoot.querySelectorAll('.ev-group').forEach((group, i) => {
      group.style.display = i <= this.zoomLevel ? 'block' : 'none';
    });
  }
  
  renderEvents() {
    this.eventsContainer.innerHTML = '';
    
    this.zones.forEach(zone => {
      const groupEl = document.createElement('div');
      groupEl.className = `ev-group ${zone}`;
      groupEl.innerHTML = `<div class="ev-header">${this.zoneNames[this.zones.indexOf(zone)]}</div>`;
      
      const eventsInGroup = this.events.filter(ev => 
        this.getEventGroup(ev.date) === zone
      );
      
      if (eventsInGroup.length === 0) {
        groupEl.innerHTML += `<div class="ev-slot">No events</div>`;
      } else {
        eventsInGroup.forEach(ev => {
          groupEl.innerHTML += `
            <div class="ev-slot">
              <div class="ev-line">
                <span class="ev-title">${ev.title}</span>
                <span class="ev-time">${ev.time}</span>
              </div>
              <div class="ev-date">${ev.date.toLocaleDateString()}</div>
            </div>
          `;
        });
      }
      
      this.eventsContainer.appendChild(groupEl);
    });
    
    this.updateVisibleGroups();
  }
}

// Register the custom element
customElements.define('event-calendar', EventCalendar);

// Optional: Register with Maddie's Little Island system
window.registerComponent('calendar', 'event-calendar');



// Register the custom element
customElements.define('event-calendar', EventCalendar);

// Wait for the registration function to be available
function tryRegister() {
  if (window.registerComponent) {
    window.registerComponent('calendar', 'event-calendar');
    console.log('Calendar component registered successfully');
  } else {
    console.log('Waiting for registration system...');
    setTimeout(tryRegister, 100); // Try again in 100ms
  }
}

// Start trying to register
document.addEventListener('DOMContentLoaded', tryRegister);