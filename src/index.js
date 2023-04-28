// global states
let form_data = {
  duration: '15',
  file_type: 'psd',
  media_type: 'image',
  quantity: 0,
  sort: 'new',
};
let all_labels = [];
let selected_labels = []; // comes from nav component

// DOM selectors
const video_container = document.querySelector('.content_container');

// initialize application on page load
window.onload = () => init_app();

// function that initializaes our application
function init_app() {
  //1. clean the data
  APP_DATA.forEach((d) => {
    // parse data
    // make dorpbox link usable
    d.video_file = d.video_file.replace(
      'www.dropbox.com',
      'dl.dropboxusercontent.com'
    );

    // remove 's' from duration
    d.duration = d.duration.replace(/s/g, '');

    // addand parse labels
    if (d.labels.length > 0) {
      d.labels = d.labels.replace(/\s/g, '').split(',');

      // add to array of possible labels
      d.labels.forEach((label) => {
        !all_labels.includes(label) && all_labels.push(label);
      });
    }
  });
  // sort the available labels alphabetically
  all_labels.sort();

  // need to update the dropdown
  document.querySelector('module-video-nav').setAttribute('labels', all_labels);

  //2. render the video cards based on filtered data
  render_content();

  //3. Add event listeners to our web components
  document.addEventListener('videoFormUpdate', (event) => {
    form_data = event.detail;
    render_content();
  });
  document.addEventListener('labelsUpdate', (event) => {
    selected_labels = [...Object.values(event.detail)];
    render_content();
  });
  document.addEventListener('videoPlayback', (event) => {
    const video_to_ignore = event.detail.video_id;

    document.querySelectorAll('video').forEach((video) => {
      // console.log(video.id);
      if (video.id !== `video_${video_to_ignore}`) {
        video.pause();
      }
    });
  });
}

function render_content() {
  // reset video content container
  video_container.innerHTML = '';
  const render_data = filter_data(APP_DATA);
  // we have data we can render
  if (render_data.length > 0) {
    render_data.forEach((video, idx) => {
      video_container.innerHTML += `
            <module-video id=${idx} video_src=${video.video_file} duration="${video.duration}" href="${video.working_files}"></module-video>
        `;
    });
  } else {
    // no data matches input fields
    video_container.innerHTML += `
      <div class="no-video">Sorry, No Video Matches Your Input</div>
    `;
  }
}

function filter_data(data) {
  data = data.filter((d) => d.duration === form_data.duration);
  data = data.filter((d) => d.file_type.toLowerCase() === form_data.file_type);
  data = data.filter(
    (d) => d.asset_type.toLowerCase() === form_data.media_type
  );
  data = data.filter((d) => d.num_assets > form_data.quantity);

  if (selected_labels.length > 0) {
    data = data.filter((d) => {
      let has_all_labels = true;
      // exclusive label selection
      selected_labels.forEach((label) => {
        if (!d.labels.includes(label)) has_all_labels = false;
      });

      return has_all_labels;
    });
  }
  return data;
}
