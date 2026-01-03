console.log('Hello World!');
const
build_version = 1833030126,
hidden_canvas = document.querySelector('#hidden-canvas'),
background_canvas = document.querySelector('#background-canvas'),
loading_overlay = document.querySelector('#loading-overlay'),
video = document.querySelector('video'),
video_overlay = document.querySelector('#video-overlay-anchor');
scan_exit_btn = document.querySelector('#scan-exit-anchor');
h_ctx = hidden_canvas.getContext('2d'),
b_ctx = background_canvas.getContext('2d'),
spotify_trigger = document.querySelector('#spotify-trigger'),
song_control_element = document.querySelector('#song-control-anchor'),
button_toggle_play = document.querySelector('#toggle-play'),
song_list = [],
user_settings = {
    autoplay: false,
    debuging: false,
},
user_settings_save = [
    'autoplay'
],
critical_error_log_style = `background-color: red;padding: 2px;font-weight: bolder;font-size: large;`,
non_critical_error_log_style = `background-color: rgba(255,0,0,0.7);padding: 1px;font-weight: bold;`,
colors = {
    pink: "rgb(255, 2, 173)",
    sky: "rgb(2, 179, 255)",
    yellow: "rgb(254, 242, 46)",
    redish: "rgb(251, 103, 117)",
};

let
QR_scan_width       = 400,
video_width         = 600,
video_height        = 600,
is_searching        = false,
spotify_controler,
camera_stream,
first_song_loaded   = false,
camera_has_started   = false,
search_cycle        = 0,
previous_song_load  = 0,
current_song_load   = 0,
song_is_playing     = false,
has_local_storage   = false;


function setup(){
    const
    max_width = window.innerWidth,
    max_height = window.innerHeight * 0.65,
    min = Math.min(max_height, max_width);
    background_canvas.width = min;
    background_canvas.height = min;
    draw_logo(b_ctx, min * 0.9, min * 0.05, 1);
    document.querySelector('#version-identifier').innerHTML+=build_version;

    //session persistent values
    if(typeof Storage !== undefined){
        has_local_storage = true;
        if(localStorage.getItem('BH_user-settings')){
            JSON.parse(localStorage.getItem('BH_user-settings')).forEach(entry => {
                toggle_setting(entry[0], entry[1]);
            });
        }
    }
}


function show_loading(visible = true){
    loading_overlay.style.display = visible ? 'block' : 'none';
}

function toggle_element_visibility(target, may_show = true){
    if(!target){
        const targets = ['settings'];
        targets.forEach(t => {toggle_element_visibility(t, may_show)});
        return;
    } else if(target == 'settings') document.querySelector('#menu-cogwheel').classList.toggle('visible');
    const c = document.querySelector(`#${target}-anchor > div`);
    if(c.classList.contains('visible')) c.classList.remove('visible');
    else if(may_show) c.classList.add('visible');
}

function toggle_setting_visibility(target, may_show = true){
    if(!target){
        const targets = ['credits', 'help'];
        targets.forEach(t => {toggle_setting_visibility(t, may_show)});
        return;
    }
    const c = document.querySelector(`#settings-anchor > div .${target}`);
    if(c.classList.contains('visible')) c.classList.remove('visible');
    else if(may_show) c.classList.add('visible');
}

function toggle_setting(setting, value){
    if(user_settings?.[setting] === undefined){
        console.log(`%cError: Trying to modify "${setting}" while setting does not exist!!`, non_critical_error_log_style);
        return;
    }
    let was_enabled = value ?? !user_settings[setting];
    user_settings[setting] = was_enabled;
    switch(setting){
        case 'autoplay':{
            document.querySelector('#user-settings-autoplay').innerText = `Autoplay: ${was_enabled ? 'Enabled' : 'Disabled'}`;
            break;
        }
        case 'debuging':{
            document.querySelector('#user-settings-debuging').innerText = `Debuging: ${was_enabled ? 'Enabled' : 'Disabled'}`;
            if(was_enabled){
                document.querySelector('iframe').style.zIndex = '1000';
            } else {
                document.querySelector('iframe').style.zIndex = '-10';
            }
            break;
        }
    }
}

function start_qr_search(){
    song_control_element.style.display = 'none';
    search_cycle = 0;
    if(song_is_playing) toggle_song_play();
    if(!camera_has_started) start_camera();
    else {
        pause_camera(false);
        setTimeout(repeat_qr_search, 250, true);
    }
}

function abort_qr_search(){
    song_control_element.style.display = 'inline';
    pause_camera(true);
    repeat_qr_search(false);
}

function start_camera(){/*
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');*/
    video.setAttribute('width', window.innerWidth);
    video.setAttribute('height', window.innerHeight);
    video.style.display = 'inline';
    /*document.body.appendChild(video);*/

    /* Setting up the constraint */
    let facingMode = "environment"; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
    let constraints = {
        audio: false,
        video: {
            facingMode: facingMode
        }
    };

    /* Stream it to video element */
    navigator.mediaDevices.getUserMedia(constraints).then(function success(stream) {
        camera_stream = stream;
        video.srcObject = stream;
        camera_has_started = true;
        add_video_overlay();
        setTimeout(repeat_qr_search, 250, true);
    });
}

function pause_camera(pause = true){
    const 
    videoTrack = camera_stream.getVideoTracks()[0],
    display_property = pause ? 'none' : 'inline';
    videoTrack.enabled = !pause;
    video.style.display = display_property;
    video_overlay.style.display = display_property;
    scan_exit_btn.classList[pause ? 'add' : 'remove']('hidden');
}

function add_video_overlay(){
    video_width = window.innerWidth;
    video_height = window.innerHeight;
    QR_scan_width = Math.min(video_width, video_height) * 0.7;//(v_h >= QR_scan_width) == (v_w >= QR_scan_width) ? QR_scan_width : (v_h > v_w ? v_w : v_h),
    video_overlay.classList.add('video_overlay');
    video_overlay.style.width = `${QR_scan_width}px`;
    video_overlay.style.height = `${QR_scan_width}px`;
    scan_exit_btn.classList.remove('hidden');
    console.log(`QR-scan width: ${QR_scan_width}`);
    //document.querySelector('#overlay').appendChild(video_overlay);
}

//testing ? vs min
/*const
number_set      = [],
smal_set_min    = [],
smal_set_tern   = [],
random_int      = (max, min) => {Math.floor(Math.random() * (max-min)) + max},
random_float    = (max, min) => {Math.random() * (max-min) + max};
for(let c=0;c<100000;c++){
    number_set.push([random_int(0, 1000), random_int(0, 1000)]);
}
console.time('min time');
number_set.forEach(set => {
    smal_set_min.push(Math.min(set[0], set[1]));
});
console.timeEnd('min time');
console.time('tern time');
number_set.forEach(set => {
    smal_set_tern.push(set[0] < set[1] ? set[0] : set[1]);
});
console.timeEnd('tern time');
*/

function repeat_qr_search(search){
    is_searching = search ?? is_searching;
    if(!is_searching) {
        //!temporaly stop camera
        return;
    }
    search_qr_code();
    setTimeout(repeat_qr_search, 340);
}


function search_qr_code(){
    console.log('Searching QR Code')
    search_cycle++;
    if(search_cycle < 3) return;
    const
    v_w = video.videoWidth, v_h = video.videoHeight,
    real_scan_width = Math.ceil(QR_scan_width / Math.min(video_height / v_h, video_width / v_w)),
    offset_w = (v_w - real_scan_width) / 2,
    offset_h = (v_h - real_scan_width) / 2;
    hidden_canvas.width = real_scan_width;
    hidden_canvas.height = real_scan_width;
    h_ctx.drawImage(video, offset_w, offset_h, real_scan_width, real_scan_width, 0, 0, real_scan_width, real_scan_width);
    
    const
    imageData = h_ctx.getImageData(0, 0, real_scan_width, real_scan_width),
    code = jsQR(imageData.data, real_scan_width, real_scan_width);

    if (code) {
        handle_qr_data(code.data);
    } else {
        console.log("No QR code found.");
    }
}

function handle_qr_data(data){
    //Spotify link should look as below:
    //https://open.spotify.com/intl-de/track/32HXNzxH5Nm8U9Qmk9qxOd?si=6cd667aeafda476c
    //https://open.spotify.com/intl-de/track/58triUtuAX5ZbfyOeogCJ6?si=fc183afc7c754269
    //what we need is this part:      [****************************]
    //also supported via my print template if the following spotify shortening:
    //spotify:track:4v8GJxLdvUiN7R31cKcmNL
    let split = data.split('/');
    console.log(`QR Data as split:`);
    console.log(split);
    if(split[2] == "open.spotify.com"){
        //spotify link - open track; stop scanning
        repeat_qr_search(false);
        pause_camera(true);
        show_loading();
        let uri = `spotify:${split.at(-2)/*should be 'track'*/}:${split.at(-1).split('?')[0]/*uri tag*/}`;
        console.log(`Attempting to open: ${uri}`);
        spotify_load_song(uri);
    } else if(data.split(':')[0] == 'spotify'){
        repeat_qr_search(false);
        pause_camera(true);
        show_loading();
        console.log(`Attempting to open: ${data}`);
        spotify_load_song(data);
    }
}


function handle_spotify_ready(){
    if(current_song_load == previous_song_load) return;
    song_control_element.style.display = 'block';
    if(!first_song_loaded){
        activate_controls();
        first_song_loaded = true;    
        //check_spotify_connect();
    }
    show_loading(false);
    if(user_settings.autoplay) toggle_song_play();
    previous_song_load++;
}

function spotify_load_song(song_uri){
    if(song_is_playing) toggle_song_play();
    spotify_trigger.innerText = song_uri;
    current_song_load++;
    spotify_trigger.click();
}

function load_previous_song(){
    if(song_list.length < 2) return;
    let song_uri = song_list.at(-2);
    song_list.splice(-2, 2);
    spotify_load_song(song_uri);
}

function toggle_song_play(){
    console.log(`%cTOGGLING PLAY BUTTON`, critical_error_log_style);
    if(song_is_playing){
        spotify_controler.pause();
        song_is_playing = false;
        document.querySelectorAll('#song-control-anchor > .toggle-play > *').forEach(e => {e.classList.remove('play');e.classList.add('paused');});
    } else {
        spotify_controler.resume();
        song_is_playing = true;
        document.querySelectorAll('#song-control-anchor > .toggle-play > *').forEach(e => {e.classList.remove('paused');e.classList.add('play');});
    }
    //button_toggle_play.in
}

function activate_controls(){
    for(const child of song_control_element.children){
        child.classList.remove('solo');
    };
}


function draw_logo(ctx, width = 400, offset = 0, opacity  = 1){
    const
    radi_offset = width/36.364,
    max_radius  = width / 2,
    current_alpha = ctx.globalAlpha;
    let r = (max_radius - radi_offset)*0.965;

    ctx.globalAlpha = opacity;

    //black background circle
    ctx.shadowColor = 'black';
    ctx.shadowBlur = offset;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, max_radius, 0, Math.PI*2, false);
    ctx.fill();
    ctx.shadowBlur = 0;

    //Strikes
    ctx.strokeStyle = colors.pink;
    ctx.lineWidth = width/57;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*1.49, Math.PI/16*12, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*17.47, Math.PI/16*28, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.sky;
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*08, Math.PI/16*14.3, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*17.7, Math.PI/16*21, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*25, Math.PI/16*28, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.yellow;
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*02, Math.PI/16*14, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*18, Math.PI/16*30, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.pink;
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*05, Math.PI/16*13.6, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*18.4, Math.PI/16*27, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.redish;
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*03, Math.PI/16*10, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset, max_radius + offset, r, Math.PI/16*22, Math.PI/16*28.88, false);
    ctx.stroke();

    //text
    ctx.shadowColor = colors.pink;
    ctx.shadowBlur = width/50;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${max_radius/1.9}px Abel`;
    ctx.fillText('J E S U S', max_radius + offset, max_radius*1.04 + offset);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = current_alpha;
}


function export_hidden_canvas_context(){
    // Convert the canvas to data
    let image = hidden_canvas.toDataURL();
    // Create a link
    let aDownloadLink = document.createElement("a");
    // Add the name of the file to the link
    aDownloadLink.download = "map_preview.png";
    // Attach the data to the link
    aDownloadLink.href = image;
    // Get the code to click the download link
    aDownloadLink.click();
};


function check_spotify_connect(){
    let progress_bar = document.querySelectorAll('.ProgressBar_progressBarContainer__glVHh');
    if(progress_bar.length < 1) alert('NO Connection');
    else alert('Connection Exists!');
}

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const element = document.getElementById('spotify-iframe');
    const options = {
        //load default song to get API ready
        uri: 'spotify:track:5VUQsLff8A3ruAyCdTxqzg',
        width: '100%',
        height: '160',
    };
    const callback = (EmbedController) => {
        const trigger = document.querySelector('#spotify-trigger');//==spotify_trigger
        trigger.onclick = () => {
            const song_uri = trigger.innerText;
            //change trigger text to "spotify:track:[track-uri]" before calling trigger.click();
            song_list.push(song_uri);
            EmbedController.loadUri(song_uri);
            EmbedController.addListener('ready', () => {
                console.log('%cThe Embed has initialized', 'background:green;');
                spotify_controler = EmbedController;
                handle_spotify_ready();
            });
        }
        EmbedController.addListener('playback_update', e => {
            if(e.data.isPaused && song_is_playing){
                //stop
                toggle_song_play();
                console.log('%cPAUSED PLAY BUTTON', Non_critical_error_log_style);
            }
        });
    };
    IFrameAPI.createController(element, options, callback);
    console.log('MAYBE READY???');
    show_loading(false);
    
};
//https://open.spotify.com/intl-de/track/3SuxtjdFxY3RIaWyPgtkfk?si=23c1b3ea83364042
//https://open.spotify.com/intl-de/track/5VUQsLff8A3ruAyCdTxqzg?si=d40ee0089af34787

window.onbeforeunload = () => {
    if(has_local_storage){
        let entries = [];
        user_settings_save.forEach(setting => {
            entries.push([setting, user_settings[setting]]);
        });
        localStorage.setItem('BH_user-settings', JSON.stringify(entries));
    }
}

setup();