const garden = document.getElementById('garden');
const autoBtn = document.getElementById('auto-btn');
const windSlider = document.getElementById('wind-slider');

// Reliable Wikimedia Images (Transparent)
const flowerImages = [
    'https://res.cloudinary.com/teepublic/image/private/s--m7RzvlTg--/t_Preview/b_rgb:000000,c_lpad,f_jpg,h_630,q_90,w_1200/v1548966653/production/designs/4121658_0.jpg',
    'https://res.cloudinary.com/teepublic/image/private/s--5JM322b9--/t_Preview/b_rgb:000000,c_lpad,f_jpg,h_630,q_90,w_1200/v1678214289/production/designs/40541414_0.jpg', 
    'https://res.cloudinary.com/teepublic/image/private/s--EGqJqzPT--/t_Preview/b_rgb:000000,c_lpad,f_jpg,h_630,q_90,w_1200/v1673486234/production/designs/38298162_1.jpg',
    'https://cdn.cloudflare.steamstatic.com/steam/apps/2652910/ss_9f0615fbb8194725559ab15fcfbaef82bd5ed09f.1920x1080.jpg?t=1710525744',
    'https://media.sketchfab.com/models/27777da973a449e2a08ebbeacdfbf0b0/thumbnails/06ea73082d1441948eb12fc6066566d3/9ac7b10b1efe491b89c343b59be792ac.jpeg'
];

const popSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
popSound.volume = 0.15;

// Increase spacing distance since flowers are massive
const MIN_DISTANCE = 300; 

let autoInterval = null;

function init() { 
    loadGarden(); 
    startFireflies();
}

function createFlower(x, y, imgUrl = null, save = true) {
    popSound.cloneNode(true).play().catch(()=>{});

    const f = document.createElement('div');
    f.className = 'flower';
    
    const src = imgUrl || flowerImages[Math.floor(Math.random() * flowerImages.length)];
    f.style.backgroundImage = `url('${src}')`;
    
    // --- SIZE LOGIC (400px to 600px) ---
    const size = Math.floor(Math.random() * 200 + 400); 
    f.style.width = size + 'px';
    f.style.height = size + 'px';

    // Center the flower based on its random size
    f.style.left = (x - (size / 2)) + 'px';
    f.style.top = (y - (size / 2)) + 'px';
    
    // Physics
    const lean = (Math.random() * 20 - 10).toFixed(2) + 'deg';
    const duration = ( (Math.random() * 1 + 2) / windSlider.value ).toFixed(2) + 's';
    
    f.style.setProperty('--lean', lean);
    f.style.setProperty('--sway-duration', duration);
    
    // Store coords for collision detection
    f.dataset.x = x;
    f.dataset.y = y;

    garden.appendChild(f);

    if (save) saveGarden();
    
    // Performance Cleanup (Max 30 due to massive size)
    if (garden.children.length > 30) {
        const old = garden.firstChild;
        old.classList.add('fade-out'); // Smooth removal
        setTimeout(() => {
            if(old.parentElement) old.remove();
        }, 1500);
    }
}

// Distance Checker to prevent stacking
function isTooClose(x, y) {
    const existing = document.querySelectorAll('.flower');
    for (let f of existing) {
        const ex = parseFloat(f.dataset.x);
        const ey = parseFloat(f.dataset.y);
        const dist = Math.sqrt(Math.pow(x - ex, 2) + Math.pow(y - ey, 2));
        if (dist < MIN_DISTANCE) return true;
    }
    return false;
}

// Input Handler
function handleInput(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    
    let x, y;
    if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
        e.preventDefault(); 
    } else {
        x = e.clientX;
        y = e.clientY;
    }
    createFlower(x, y);
}

// Sparkle Trail
document.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.6) { 
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 800);
    }
});

// Ambient Fireflies
function startFireflies() {
    setInterval(() => {
        const fly = document.createElement('div');
        fly.className = 'firefly';
        fly.style.left = Math.random() * window.innerWidth + 'px';
        fly.style.top = Math.random() * window.innerHeight + 'px';
        fly.style.animationDuration = (Math.random() * 5 + 5) + 's';
        document.body.appendChild(fly);
        setTimeout(() => fly.remove(), 12000);
    }, 2000);
}

document.addEventListener('mousedown', handleInput);
document.addEventListener('touchstart', handleInput, { passive: false });

// Auto Bloom
autoBtn.addEventListener('click', () => {
    if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
        autoBtn.innerText = '✨ Auto Bloom';
        autoBtn.classList.remove('active');
    } else {
        autoBtn.classList.add('active');
        autoBtn.innerText = '🛑 Stop';
        autoInterval = setInterval(() => {
            let attempts = 0;
            let x, y, success = false;
            
            // Try 10 times to find a spot that isn't crowded
            while (attempts < 10) {
                x = Math.random() * window.innerWidth;
                y = Math.random() * window.innerHeight;
                if (!isTooClose(x, y)) {
                    success = true;
                    break;
                }
                attempts++;
            }
            if (success) createFlower(x, y);
        }, 600);
    }
});

document.getElementById('clear-btn').addEventListener('click', () => {
    garden.innerHTML = '';
    localStorage.removeItem('miaCaraGarden');
});

// Save/Load
function saveGarden() {
    try {
        const data = Array.from(document.querySelectorAll('.flower')).map(f => ({
            x: parseFloat(f.dataset.x),
            y: parseFloat(f.dataset.y),
            url: f.style.backgroundImage.slice(5, -2)
        }));
        localStorage.setItem('miaCaraGarden', JSON.stringify(data));
    } catch (e) {}
}

function loadGarden() {
    const saved = localStorage.getItem('miaCaraGarden');
    if (saved) {
        try { JSON.parse(saved).forEach(f => createFlower(f.x, f.y, f.url, false)); } 
        catch(e) {}
    }
}

init();