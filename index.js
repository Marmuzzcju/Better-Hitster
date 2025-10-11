console.log('Hello World!');
const 
canvas = document.querySelector('#canvas'),
ctx = canvas.getContext('2d'),
colors = {
    pink: "rgb(255, 2, 173)",
    sky: "rgb(2, 179, 255)",
    yellow: "rgb(254, 242, 46)",
    redish: "rgb(251, 103, 117)",
};


let video = document.createElement('video');
video.setAttribute('playsinline', '');
video.setAttribute('autoplay', '');
video.setAttribute('muted', '');
document.body.appendChild(video);

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
  video.srcObject = stream;
});

function search_qr_code(){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      alert("QR Code Data: " + code.data);
    } else {
      alert("No QR code found.");
    }

}


function draw_logo(){
    const unit = 11;
    let x = 404 - 2*unit, r = x - 200;
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI*2, false);
    ctx.fill();
    ctx.strokeStyle = colors.pink;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*1.49, Math.PI/16*12, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*17.47, Math.PI/16*28, false);
    ctx.stroke();
    x -= 2*unit,
    r -= 2*unit;
    ctx.strokeStyle = colors.sky;
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*08, Math.PI/16*14.3, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*17.7, Math.PI/16*21, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*25, Math.PI/16*28, false);
    ctx.stroke();
    x -= 2*unit,
    r -= 2*unit;
    ctx.strokeStyle = colors.yellow;
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*02, Math.PI/16*14, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*18, Math.PI/16*30, false);
    ctx.stroke();
    x -= 2*unit,
    r -= 2*unit;
    ctx.strokeStyle = colors.pink;
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*05, Math.PI/16*13.6, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*18.4, Math.PI/16*27, false);
    ctx.stroke();
    x -= 2*unit,
    r -= 2*unit;
    ctx.strokeStyle = colors.redish;
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*03, Math.PI/16*10, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(200, 200, r, Math.PI/16*22, Math.PI/16*28.88, false);
    ctx.stroke();

    ctx.shadowColor = colors.pink;
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${200/1.9}px Abel`;
    ctx.fillText('J E S U S', 200, 200*1.04);
}


function export_canvas_context(){
    // Convert the canvas to data
    let image = canvas.toDataURL();
    // Create a link
    let aDownloadLink = document.createElement("a");
    // Add the name of the file to the link
    aDownloadLink.download = "map_preview.png";
    // Attach the data to the link
    aDownloadLink.href = image;
    // Get the code to click the download link
    aDownloadLink.click();
  };