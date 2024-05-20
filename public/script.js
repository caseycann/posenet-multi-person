const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const log = document.getElementById('log');

async function setupCamera() {
    video.width = 640;
    video.height = 480;

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadPosenet() {
    return await posenet.load();
}

let previousKeypoints = [];

async function detectPose(net) {
    const poses = await net.estimateMultiplePoses(video, {
        flipHorizontal: false,
        maxDetections: 5,
        scoreThreshold: 0.8,
        nmsRadius: 20
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    log.innerHTML = '';
    poses.forEach((pose, index) => {
        log.innerHTML += `<p>Person ${index + 1}: ${JSON.stringify(pose.keypoints)}</p>`;

        // Draw the keypoints
        pose.keypoints.forEach((keypoint, i) => {
            if (keypoint.score > 0.8) {
                let { y, x } = keypoint.position;
                // If there is a previous position for this keypoint, average the current position with the previous position
                if (previousKeypoints[i]) {
                    x = (x + previousKeypoints[i].x) / 2;
                    y = (y + previousKeypoints[i].y) / 2;
                }
                // Store the current position as the previous position for the next frame
                previousKeypoints[i] = { x, y };

                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = 'red';
                ctx.fill();
            }
        });

        // Draw the skeleton
        const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, 0.6);
        adjacentKeyPoints.forEach((keypoints) => {
            ctx.beginPath();
            ctx.moveTo(keypoints[0].position.x, keypoints[0].position.y);
            ctx.lineTo(keypoints[1].position.x, keypoints[1].position.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'aqua';
            ctx.stroke();
        });

        // Draw the facial keypoints
        const facialKeypoints = ['leftEar', 'leftEye', 'nose', 'rightEye', 'rightEar'];
        for (let i = 0; i < facialKeypoints.length - 1; i++) {
            let firstKeypoint = pose.keypoints.find(k => k.part === facialKeypoints[i]);
            let secondKeypoint = pose.keypoints.find(k => k.part === facialKeypoints[i + 1]);

            // Average the positions of the facial keypoints
            if (previousKeypoints[firstKeypoint.part]) {
                firstKeypoint.position.x = (firstKeypoint.position.x + previousKeypoints[firstKeypoint.part].x) / 2;
                firstKeypoint.position.y = (firstKeypoint.position.y + previousKeypoints[firstKeypoint.part].y) / 2;
            }
            if (previousKeypoints[secondKeypoint.part]) {
                secondKeypoint.position.x = (secondKeypoint.position.x + previousKeypoints[secondKeypoint.part].x) / 2;
                secondKeypoint.position.y = (secondKeypoint.position.y + previousKeypoints[secondKeypoint.part].y) / 2;
            }

            // Store the current positions as the previous positions for the next frame
            previousKeypoints[firstKeypoint.part] = { x: firstKeypoint.position.x, y: firstKeypoint.position.y };
            previousKeypoints[secondKeypoint.part] = { x: secondKeypoint.position.x, y: secondKeypoint.position.y };

            if (firstKeypoint.score > 0.6 && secondKeypoint.score > 0.6) {
                ctx.beginPath();
                ctx.moveTo(firstKeypoint.position.x, firstKeypoint.position.y);
                ctx.lineTo(secondKeypoint.position.x, secondKeypoint.position.y);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'aqua';
                ctx.stroke();
            }
        }
    });

    setTimeout(() => detectPose(net), 16);
}

async function main() {
    await setupCamera();
    const net = await loadPosenet();
    detectPose(net);
}

main();