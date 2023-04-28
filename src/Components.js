//**** Video Card Component ****/
class VideoCard extends HTMLElement {
  video_src = '';
  duration = '';
  href = '';
  is_playing = false;
  id;

  constructor() {
    super();
    this.video_src = this.getAttribute('video_src') || '';
    this.duration = +this.getAttribute('duration') || '';
    this.href = this.getAttribute('href') || '';
    this.id = this.getAttribute('id') || '';
    this.render();
  }

  connectedCallback() {
    // Get the play and pause buttons using their IDs
    const playButton = this.querySelector('#play');
    const pauseButton = this.querySelector('#pause');
    const video = this.querySelector('video');

    // Add event listener for play button click
    playButton.addEventListener('click', () => {
      this.play();
    });

    // Add event listener for pause button click
    pauseButton.addEventListener('click', () => {
      this.pause();
    });
    video.addEventListener('play', () => {
      this.toggle_buttons();
    });
    video.addEventListener('pause', () => {
      this.toggle_buttons();
    });
    video.addEventListener('timeupdate', () => { 
      const time = Math.round(video.duration) - Math.round(video.currentTime);
      this.querySelector(".module_card .card_time").innerText = `0:${String(time).padStart(2, '0')}`
    });
  }

  play() {
    this.is_playing = true;
    // hide play button and unhide pause button
    this.querySelector('video').play();
    // pause all other instances of video playing
    // dispatch event here
    const id = this.id;
    const custom_event = new CustomEvent('videoPlayback', {
      detail: { video_id: id },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(custom_event);
  }
  pause() {
    this.is_playing = false;
    this.querySelector('video').pause();
  }

  toggle_buttons() {
    this.querySelector('#pause').classList.toggle('hidden');
    this.querySelector('#play').classList.toggle('hidden');
  }

  get styles() {
    return /*html*/ `
        <style> 
            .module_card video {
                width: 100%;
                height: 170px;
                object-fit: cover;
                border-radius: 15px;
            }
            .module_card .icon {
                color: gray;
                font-size: 4rem;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: none;
                transition: var(--transition);

            }
            .module_card a {
                color: black;
                text-decoration: none;
            }
            .module_card .card_thumbnail {
                background-color: lightgray;
                border-radius: 15px;
                position: relative;
                height: 170px;
                cursor: pointer;
            }

            .module_card .card_thumbnail:hover .icon:not(.hidden) {
                display: block;
            }

            .module_card .card_thumbnail .card_time {
                color: white;
                background-color: black;
                border-radius: 5px;
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 12px;
                padding: 2px 8px;
            }

            .module_card .card_link {
                margin-top: 0.5rem;
                text-align: right;
            }
        </style>
        `;
  }

  get template() {
    return /*html*/ `
        ${this.styles}
         <div class="module_card">
            <div class="card_thumbnail">
                <video id="video_${this.id}" src="${this.video_src}"></video data-video-id="">
                <div class="card_time">0:${this.duration}</div>
                <i id="pause" class="fa-solid fa-pause icon hidden"></i>
                <i id="play" class="fa-solid fa-play icon"></i>
            </div>
            <div class="card_link">
                <a href="${this.href}" target="_blank"><i class="fa-solid fa-link"></i>Dropbox</a>
            </div>
        </div>
        `;
  }

  render() {
    this.innerHTML = this.template;
  }
}

/*** Video Nav component ***/
class VideoNav extends HTMLElement {
  form_data = {
    sort: 'new',
    duration: '15',
    file_type: 'psd',
    media_type: 'image',
    quantity: '',
  };
  dropdown_input;
  pills_container;
  current_duration;
  timer = null;
  all_labels = [];
  selected_labels = [];
  constructor() {
    super();
    this.render();
  }

  // adds listener to all user inputs
  connectedCallback() {
    this.dropdown_input = this.querySelector('.app_nav .dropdown-input');
    this.pills_container = this.querySelector('.app_nav .nav-pills');
    // Get the parent element
    const navElement = this.querySelector('.app_nav');

    // Add event listener for change event on the parent element
    navElement.addEventListener('change', (event) => {
      // Check if the target element that triggered the event is within the navElement
      if (
        event.target.closest('.app_nav') &&
        !event.target.parentElement.classList.contains('dropdown-label')
      ) {
        //console.log("An input change was detected!")
        // Access the target element and its value
        const targetElement = event.target;
        const targetValue = targetElement.value;

        // Implement your logic here based on the target element and its value
        this.form_data[targetElement.name] = targetValue;

        const form_data = this.form_data;
        const custom_event = new CustomEvent('videoFormUpdate', {
          detail: { ...form_data },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(custom_event);
      }
    });

    // event listner to hide each nav section on click
    this.querySelectorAll('.collapsible').forEach((el) => {
      el.addEventListener('click', function () {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.display === 'block') {
          content.style.display = 'none';
        } else {
          content.style.display = 'block';
        }
      });
    });

    // hide the nav dropdown when user clickes in input text field for labels
    this.dropdown_input.addEventListener('click', () => {
      this.querySelector('.app_nav .dropdown-list').classList.remove('hidden');
    });

    // add's an input listener to user typed input
    this.dropdown_input.addEventListener('input', (e) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const query = e.target.value;
        // need this to remove the re-introduction of removed labels
        const current_options = this.all_labels.filter(
          (item) => !this.selected_labels.includes(item)
        );
        const valid_labels = current_options.filter((d) =>
          d.toLowerCase().includes(query.toLowerCase())
        );
        this.update_labels_list(valid_labels);
      }, 300);
      // get the valid labels
    });

    // open font dropdown when clicking input field, closes when clocking font item ot outside element
    this.addEventListener('click', (e) => {
      const dropdown = this.querySelector('.app_nav .dropdown-list');
      if (e.target.closest('.dropdown-label')) return;
      if (!dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
      }
    });

    // use event delegation to handle label dropdown for <li> and <i>
    this.querySelector('.app_nav .content.labels').addEventListener(
      'click',
      (event) => {
        if (event.target.tagName === 'LI') {
          const selected = event.target.getAttribute('data-id');
          this.selected_labels.push(selected);
          // remove the slected item from the available input
          this.update_labels_list(
            this.all_labels.filter(
              (item) => !this.selected_labels.includes(item)
            )
          );
          this.dropdown_input.value = '';

          // add a pill to the labels section
          this.pills_container.innerHTML += `
            <div class="nav-pill">
              <span>${selected}</span>
              <i data-id="${selected}" class="fa-solid fa-circle-xmark"></i>
            <div>`;

          // dispatch the event to the main application
          const selected_labels = this.selected_labels;
          const custom_event = new CustomEvent('labelsUpdate', {
            detail: { ...selected_labels },
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(custom_event);
        }
        if (event.target.tagName === 'I') {
          const removed_label = event.target.getAttribute('data-id');
          // remove pill
          event.target.parentElement.remove();
          // updated selected labes array
          this.selected_labels = this.selected_labels.filter(
            (label) => label !== removed_label
          );

          this.update_labels_list(
            this.all_labels.filter(
              (item) => !this.selected_labels.includes(item)
            )
          );

          // dispatch the event to the main application
          const selected_labels = this.selected_labels;
          const custom_event = new CustomEvent('labelsUpdate', {
            detail: { ...selected_labels },
            bubbles: true,
            composed: true,
          });
          this.dispatchEvent(custom_event);
        }
      }
    );
  }

  update_labels_list(labels) {
    const ul = this.querySelector('ul');
    ul.innerHTML = '';
    labels.forEach((label) => {
      ul.innerHTML += `
      <li data-id="${label}">${label}</li>
    `;
    });
  }

  init_list_listeners() {
    const li = this.querySelectorAll('.app_nav .dropdown-list li');
    if (li.length > 0) {
      li.forEach((el) =>
        el.addEventListener('click', () => {
          //console.log("you clik me")
          this.querySelector('.app_nav .dropdown-list').classList.add('hidden');
          this.dropdown_input.value = el.innerText;
        })
      );
    }
  }

  attributeChangedCallback(attributeName, oldValue, newValue) {
    // Add your logic here based on the attribute changes
    if (attributeName === 'labels') {
      this.all_labels = newValue.split(',');
      this.update_labels_list(this.all_labels);
      // this.init_label_listeners();
      this.init_list_listeners();
    }
  }

  static get observedAttributes() {
    // Specify the list of attributes to observe for changes
    return ['labels'];
  }

  get styles() {
    return /*html*/ `
      <style>
        li {
          list-style: none;
        }
       .app_nav {
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
      }
       .app_nav .collapsible {
        background-color: #ededed;
        color: black;
        cursor: pointer;
        padding: 0.5rem 1rem;
        width: 100%;
        border: none;
        text-align: left;
        outline: none;
        font-size: 18px;
        text-transform: uppercase;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid lightgray;
      }
      .app_nav .content {
        padding: 0 18px;
        display: none;
        padding: 1rem;
      }
      .app_nav .nav_sort,
      .app_nav .dropdown-input {
        height: 2rem;
        padding: 0 1rem;
        border-radius: 15px;
        width: 100%;
        border: 1px solid black;
      }
      .app_nav .nav_input-content {
        margin-bottom: 1rem;
      }
      .app_nav .content .dropdown-label {
        position: relative;
      }
      .app_nav .content .dropdown-list {
        position: absolute;
        top: 32px;
        left: 0;
        max-height: 150px;
        width: 276px;
        z-index: 99;
        display: block;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        background-color: white;
        overflow: hidden;
        overflow-y: scroll;
      }
      .app_nav .content .dropdown-list.hidden {
        display: none;
      }
      .app_nav .content .dropdown-list li {
        padding: 0.25rem 0.75rem;
        cursor: pointer;
      }
      .app_nav .content .dropdown-list li:hover {
        background-color: #e8e7e7;
      }
      .app_nav .nav-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 1rem;
      }
      .app_nav .nav-pills .nav-pill {
        font-size: 10px;
        background-color: lightgray;
        padding: 4px 8px;
        border-radius: 12px;
      }
      .app_nav .nav-pills .nav-pill i {
        margin-left: 4px;
        cursor: pointer;
      }
      .app_nav .collapsible.active i {
        transform: rotate(180deg);
      }
      .app_nav .collapsible i {
        transform: rotate(0);
        transition: all ease 300ms;
      }
    </style>`;
  }

  get template() {
    return /*html*/ `
      ${this.styles}
      <nav class="app_nav">
        <button type="button" class="collapsible input-callback">
          <div>Sort By</div>
          <i class="fa-solid fa-caret-up"></i>
        </button>
        <div class="content" style="display: block">
          <!-- dropdown here -->
          <select name="sort" id="sort" class="nav_sort">
            <option value="new">Newest to Oldest</option>
            <option value="old">Oldest to Newest</option>
            <option value="updated">Last Updated</option>
          </select>
        </div>
        <button type="button" class="collapsible input-callback">
          <div>Filter By</div>
          <i class="fa-solid fa-caret-up"></i>
        </button>
        <div class="content" style="display: block">
          <div class="nav_input-content">
            <!-- duration setting -->
            <h3>Duration</h3>
            <div>
              <input type="radio" name="duration" value="15" checked />
              <label for="duration">15s</label>
            </div>
            <div>
              <input type="radio" name="duration" value="30" />
              <label for="duration">30s</label>
            </div>
          </div>
          <div class="nav_input-content">
            <!-- file type -->
            <h3>PSD or MOGRT</h3>
            <div>
              <input type="radio" name="file_type" value="psd" checked />
              <label for="file_type">PSD</label>
            </div>
            <div>
              <input type="radio" name="file_type" value="mogrt" />
              <label for="file_type">MOGRT</label>
            </div>
          </div>
          <div class="nav_input-content">
            <!-- media type -->
            <h3>Image or Video</h3>
            <div>
              <input type="radio" name="media_type" value="image" checked />
              <label for="media_type">Image</label>
            </div>
            <div>
              <input type="radio" name="media_type" value="video" />
              <label for="media_type">Video</label>
            </div>
          </div>
          <div class="nav_input-content">
            <h3>Number of Assets</h3>
            <div>
              <label for="quantity">Image/Video</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>
        <button type="button" class="collapsible">
          <div>Labels</div>
          <i class="fa-solid fa-caret-up"></i>
        </button>
        <div class="content labels" style="display: block">
          <div class="nav-pills"></div>
          <div class="dropdown-label">
            <input
              type="text"
              name="labels"
              id="labels"
              class="dropdown-input"
              placeholder="Search"
            />
            <ul class="dropdown-list hidden"></ul>
          </div>
        </div>
      </nav>    
    `;
  }

  render() {
    this.innerHTML = this.template;
  }
}

// Define all components here
customElements.define('module-video', VideoCard);
customElements.define('module-video-nav', VideoNav);
