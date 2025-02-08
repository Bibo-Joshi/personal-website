const blob = document.getElementById("blob");
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;
let targetX = currentX;
let targetY = currentY;
const speed = 0.1; // pixels per millisecond
let lastFrameTime = 0;
let idleTime = 0;
const idleThreshold = 1000; // 1 second
let isRandomMotion = false;
let curvePoints = [];
let curveProgress = 0;
let curveLength = 0;
let curveStartTime = 0;

let colorOffset = 0;

function updateBlobPosition(timestamp) {
    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
    }
    const deltaTime = timestamp - lastFrameTime;

    if (isRandomMotion) {
        const progressedTime = timestamp - curveStartTime;
        curveProgress = Math.min(1, speed * progressedTime / curveLength);

        if (curveProgress >= 1) {
            generateNewCurve();
            curveStartTime = timestamp;
            curveProgress = 0;
        }

        const point = getPointOnCurve(curveProgress);
        currentX = point.x;
        currentY = point.y;
    } else {
        const distanceX = targetX - currentX;
        const distanceY = targetY - currentY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        if (distance > 1) {
            const moveX = (distanceX / distance) * speed * deltaTime;
            const moveY = (distanceY / distance) * speed * deltaTime;
            currentX += moveX;
            currentY += moveY;
            idleTime = 0;
        } else {
            idleTime += deltaTime;
            if (idleTime >= idleThreshold) {
                generateNewCurve();
                isRandomMotion = true;
                curveStartTime = timestamp;
            }
        }
    }

    blob.style.left = `${currentX}px`;
    blob.style.top = `${currentY}px`;

    // Update colors
    colorOffset = (colorOffset + 0.1) % 360;

    blob.style.background = `
        linear-gradient(
            ${colorOffset}deg,
            hsl(${colorOffset}, 100%, 50%),
            hsl(${(colorOffset + 120) % 360}, 100%, 50%),
            hsl(${(colorOffset + 240) % 360}, 100%, 50%)
        )
    `;

    lastFrameTime = timestamp;
    requestAnimationFrame(updateBlobPosition);
}

function generateNewCurve() {
    const margin = 0.05 * Math.max(window.innerWidth, window.innerHeight);
    const getRandomPoint = () => ({
        x: Math.random() * (window.innerWidth - 2 * margin) + margin,
        y: Math.random() * (window.innerHeight - 2 * margin) + margin
    });

    let startPoint, startTangent;
    if (curvePoints.length === 0 || !isRandomMotion) {
        startPoint = { x: currentX, y: currentY };
        startTangent = getRandomPoint();
    } else {
        const [p0, p1, p2, p3] = curvePoints;
        startPoint = p3;
        // Calculate the end tangent of the previous curve
        startTangent = {
            x: startPoint.x + (startPoint.x - p2.x),
            y: startPoint.y + (startPoint.y - p2.y)
        };
    }

    curvePoints = [
        startPoint,
        startTangent,
        // 50 random points
        ...Array.from({ length: 50 }, getRandomPoint),
    ];

    curveLength = estimateCurveLength(curvePoints);
}

function estimateCurveLength(points, steps = 100) {
    let length = 0;
    let prevPoint = getPointOnCurve(0, points);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const point = getPointOnCurve(t, points);
        length += Math.sqrt(Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2));
        prevPoint = point;
    }

    return length;
}

function getPointOnCurve(t, points = curvePoints) {
    const [p0, p1, p2, p3] = points;
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;
    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;

    const x = ax * Math.pow(t, 3) + bx * Math.pow(t, 2) + cx * t + p0.x;
    const y = ay * Math.pow(t, 3) + by * Math.pow(t, 2) + cy * t + p0.y;

    return { x, y };
}

window.onpointermove = event => {
    targetX = event.clientX;
    targetY = event.clientY;
    idleTime = 0;
    isRandomMotion = false;
    curveProgress = 0;
};

function handleTouchEvent(event) {
    targetX = event.touches[0].clientX;
    targetY = event.touches[0].clientY;
    idleTime = 0;
    isRandomMotion = false;
    curveProgress = 0;
}

window.addEventListener('touchmove', handleTouchEvent, { passive: false });
window.addEventListener('touched', handleTouchEvent, { passive: false });

requestAnimationFrame(updateBlobPosition);
