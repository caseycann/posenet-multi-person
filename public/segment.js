const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      segmentVideo();
    };
  });

const opacity = 1;
const flipHorizontal = false;
const maskBlurAmount = 2;
const bwCheckbox = document.getElementById('bw-checkbox');
const contrastSlider = document.getElementById('contrast-slider');

async function segmentVideo() {
    const net = await bodyPix.load();
    setInterval(async () => {
      const segmentation = await net.segmentPerson(video);
      const foregroundColor = {r: 0, g: 0, b: 0, a: 0};
      const backgroundColor = {r: 255, g: 255, b: 255, a: 255};
      const mask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
      bodyPix.drawMask(canvas, video, mask, opacity, maskBlurAmount, flipHorizontal);
  
      if (bwCheckbox.checked) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          const bw = avg > contrastSlider.value ? 255 : 0;
          imageData.data[i] = bw;     // red
          imageData.data[i + 1] = bw; // green
          imageData.data[i + 2] = bw; // blue
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }, 100);
  }

