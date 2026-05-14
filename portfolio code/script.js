const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

const galCanvas = document.getElementById('galleryDotCanvas');
const galCtx = galCanvas ? galCanvas.getContext('2d') : null;

const contactCanvas = document.getElementById('contactDotCanvas');
const contactCtx = contactCanvas ? contactCanvas.getContext('2d') : null;

let width, height;
let dots = [];
const spacing = 45;
let mouseX = -1000;
let mouseY = -1000;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    
    if (galCanvas) {
        galCanvas.width = width;
        galCanvas.height = height;
    }
    
    if (contactCanvas) {
        contactCanvas.width = width;
        contactCanvas.height = height;
    }
    
    initDots();
}

function initDots() {
    dots = [];
    for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
            dots.push({
                x: x,
                y: y,
                baseX: x,
                baseY: y,
            });
        }
    }
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mouseout', () => {
    mouseX = -1000;
    mouseY = -1000;
});

function animate() {
    ctx.clearRect(0, 0, width, height);
    if (galCtx) galCtx.clearRect(0, 0, width, height);
    if (contactCtx) contactCtx.clearRect(0, 0, width, height);
    
    // Custom grey colour to look elegant against the light background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    if (galCtx) galCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    if (contactCtx) contactCtx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Dark dots for white glass overlay

    dots.forEach(dot => {
        let dx = mouseX - dot.baseX;
        let dy = mouseY - dot.baseY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        let offsetX = 0;
        let offsetY = 0;
        
        // Repulsion logic from java
        if (dist < 150) {
            // Apply easing so they don't jump instantly
            const force = (150 - dist) / 150;
            offsetX = -(dx * force * 0.4);
            offsetY = -(dy * force * 0.4);
        }

        // Add slow breathing effect using date
        const time = Date.now() * 0.001;
        const breathX = Math.sin(time + dot.baseX * 0.01) * 2;
        const breathY = Math.cos(time + dot.baseY * 0.01) * 2;

        dot.x += (dot.baseX + offsetX + breathX - dot.x) * 0.1;
        dot.y += (dot.baseY + offsetY + breathY - dot.y) * 0.1;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mirror the exact physics calculation to the glass UI canvas simultaneously
        if (galCtx) {
            galCtx.beginPath();
            galCtx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
            galCtx.fill();
        }
        if (contactCtx) {
            contactCtx.beginPath();
            contactCtx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
            contactCtx.fill();
        }
    });

    requestAnimationFrame(animate);
}

animate();

// Scroll video replaced with Vimeo embed — no play/pause control needed
const videoContainer = document.querySelector('.video-container');
let isVideoRevealed = false;

if (videoContainer) {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                videoContainer.classList.add('active');
                setTimeout(() => {
                    videoContainer.classList.add('interactive');
                    isVideoRevealed = true;
                }, 600);
            } else {
                videoContainer.classList.remove('active', 'interactive');
                isVideoRevealed = false;
                videoContainer.style.transform = '';
            }
        });
    }, { threshold: 0.3 });
    videoObserver.observe(videoContainer);
}

// 3D pop tilt effect tracking mouse move
window.addEventListener('mousemove', (e) => {
    if (isVideoRevealed && videoContainer) {
        const rect = videoContainer.getBoundingClientRect();
        
        // Find center coords of the element
        const xCenter = rect.left + rect.width / 2;
        const yCenter = rect.top + rect.height / 2;
        
        // Calculate offset (divisor adjusts tilt sensitivity)
        const xOffset = (e.clientX - xCenter) / 30;
        const yOffset = (yCenter - e.clientY) / 30;
        
        // Clamp to prevent extreme flips
        const rotateX = Math.max(-10, Math.min(10, yOffset));
        const rotateY = Math.max(-10, Math.min(10, xOffset));
        
        // Scale to 1.02 to 'pop' out + perspective 3D rotation
        videoContainer.style.transform = `scale(1.02) perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
});

// --- Interactive Gallery Images & Modal ---
const galleryImages = document.querySelectorAll('.interactive-img');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const closeModal = document.querySelector('.close-modal');
const prevModalBtn = document.querySelector('.prev-modal');
const nextModalBtn = document.querySelector('.next-modal');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentModalIndex = 0;
let visibleGalleryImages = Array.from(galleryImages);

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Find the parent gallery section
        const gallerySection = btn.closest('.gallery-section');
        if (!gallerySection) return;

        // Update active class only for buttons in this section
        const sectionBtns = gallerySection.querySelectorAll('.filter-btn');
        sectionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filterVal = btn.getAttribute('data-filter');
        
        // Filter images only in this section
        const sectionImages = gallerySection.querySelectorAll('.interactive-img');
        sectionImages.forEach(img => {
            // Dynamically resize video elements based on current filter layout
            if (gallerySection.id === 'video-portfolio' || gallerySection.id === 'video-portfolio-overlay') {
                // Freeze CSS transitions BEFORE changing size classes
                // so the width/height animation doesn't trigger a video reload
                img.style.transition = 'none';

                img.classList.remove('vertical-vid', 'gaming-vid-16-9');
                
                if (filterVal === 'short-form' || filterVal === 'edits' || filterVal === 'motion-graphic') {
                    img.classList.add('vertical-vid');
                } else if (filterVal === 'stream-overlay') {
                    if (img.getAttribute('data-is-vertical') === 'true') {
                        img.classList.add('vertical-vid');
                    } else {
                        img.classList.add('gaming-vid-16-9');
                    }
                } else if (filterVal === 'long-form') {
                    img.classList.add('gaming-vid-16-9');
                }

                // Re-enable transitions after the class change has been painted
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        img.style.transition = '';
                    });
                });
            }

            const imgCategory = img.getAttribute('data-category');
            if (filterVal === 'all' || imgCategory === filterVal) {
                img.style.display = '';
            } else {
                img.style.display = 'none';
            }
        });
        
        // Update visible images array for modal navigation globally
        visibleGalleryImages = Array.from(document.querySelectorAll('.interactive-img')).filter(img => img.style.display !== 'none');
    });
});

galleryImages.forEach((img, index) => {
    img.addEventListener('mousemove', (e) => {
        const rect = img.getBoundingClientRect();
        
        // Find center of image
        const xCenter = rect.left + rect.width / 2;
        const yCenter = rect.top + rect.height / 2;
        
        // Calculate offset (inverse direction for floating feeling)
        const xOffset = (xCenter - e.clientX) / 8;
        const yOffset = (yCenter - e.clientY) / 8;
        
        // Apply translate transform
        img.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(1.05)`;
    });
    
    img.addEventListener('mouseleave', () => {
        // Reset transform
        img.style.transform = `translate(0px, 0px) scale(1)`;
    });
    
    // Open modal on click — video cards open Vimeo link instead
    img.addEventListener('click', (e) => {
        const gallerySection = img.closest('.gallery-section');
        const activeFilter = gallerySection ? gallerySection.querySelector('.filter-btn.active') : null;
        const filterVal = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';

        if (gallerySection && (gallerySection.id === 'video-portfolio' || gallerySection.id === 'video-portfolio-overlay') && filterVal !== 'all') {
            return;
        }

        if (modal && modalImg) {
            currentModalIndex = index;
            if (img.tagName === 'IMG') {
                if (modalVideo) { modalVideo.style.display = 'none'; modalVideo.pause(); }
                modalImg.style.display = 'block';
                modalImg.src = img.src;
                modal.classList.add('show');
            }
            // Vimeo video cards: do nothing (no local src to show in modal)
        }
    });

    // Audio toggle removed — videos are now Vimeo iframes
});

// Close modal logic
const stopModalMedia = () => {
    if(modalVideo) {
        modalVideo.pause();
        modalVideo.currentTime = 0;
    }
};

if (modal && closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        stopModalMedia();
    });
    
    // Close when clicking outside the image/video
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            stopModalMedia();
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('show');
            stopModalMedia();
        } else if (e.key === 'ArrowLeft' && modal.classList.contains('show')) {
            navigateModal(-1);
        } else if (e.key === 'ArrowRight' && modal.classList.contains('show')) {
            navigateModal(1);
        }
    });
}

function navigateModal(direction) {
    if (visibleGalleryImages.length === 0) return;
    
    let currentSrc = "";
    if (modalVideo && modalVideo.style.display === 'block') {
        currentSrc = modalVideo.src;
    } else if (modalImg && modalImg.style.display === 'block') {
        currentSrc = modalImg.src;
    }

    let currentVisIndex = visibleGalleryImages.findIndex(el => {
        let elSrc = el.src;
        if (el.tagName === 'DIV' || el.querySelector) {
            const vid = el.querySelector('video source');
            if (vid) elSrc = vid.src;
        }
        return elSrc === currentSrc || (elSrc && currentSrc && currentSrc.includes(elSrc));
    });
    if (currentVisIndex === -1) currentVisIndex = 0;
    
    currentVisIndex = (currentVisIndex + direction + visibleGalleryImages.length) % visibleGalleryImages.length;
    
    const nextElem = visibleGalleryImages[currentVisIndex];
    const videoElem = nextElem.querySelector ? nextElem.querySelector('video source') : null;

    if (videoElem && modalVideo) {
        if (modalImg) modalImg.style.display = 'none';
        modalVideo.style.display = 'block';
        modalVideo.src = videoElem.src;
        modalVideo.play();
    } else if (modalImg) {
        if(modalVideo) {
            modalVideo.style.display = 'none';
            modalVideo.pause();
        }
        modalImg.style.display = 'block';
        modalImg.src = nextElem.src;
    }
}

if (prevModalBtn && nextModalBtn) {
    prevModalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(-1);
    });
    
    nextModalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(1);
    });
}

// --- Smooth Scroll Navigation ---
const portfolioLink = document.querySelector('a[href="#portfolio"]');

function smoothScrollToPortfolio(e) {
    if (!e.target.closest('a[href="#portfolio"]')) return;
    e.preventDefault();
    const targetSection = document.getElementById('portfolio');
    if (targetSection) {
        // Calculate position accounting for the sticky glass navbar
        const headerOffset = 100;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Removed smoothScrollToPortfolio logic as Portfolio link is removed


// --- Full Screen Gallery Navigation ---
const fullGalleryScreen = document.getElementById('fullGalleryScreen');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');


function openFullScreenGallery(e) {
    if (e) e.preventDefault();
    if (fullGalleryScreen) {
        fullGalleryScreen.classList.add('active');
        document.body.style.overflow = 'hidden'; 
        fullGalleryScreen.scrollTo(0, 0);
    }
}

function closeFullScreenGallery() {
    if (fullGalleryScreen) {
        fullGalleryScreen.classList.remove('active');
        // Only restore scroll if contact isn't open either
        if (!fullContactScreen || !fullContactScreen.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }
}

const navWorkBtn = document.getElementById('navWorkBtn');
const seeWorkBtn = document.getElementById('seeWorkBtn');
if (navWorkBtn) navWorkBtn.addEventListener('click', openFullScreenGallery);
if (seeWorkBtn) seeWorkBtn.addEventListener('click', openFullScreenGallery);
if (closeGalleryBtn) closeGalleryBtn.addEventListener('click', closeFullScreenGallery);

// --- Full Screen Contact Navigation ---
const contactNowBtn = document.getElementById('contactNowBtn');
const navContactBtn = document.getElementById('navContactBtn');
const fullContactScreen = document.getElementById('fullContactScreen');
const closeContactBtn = document.getElementById('closeContactBtn');

function openFullScreenContact(e) {
    if (e) e.preventDefault();
    if (fullContactScreen) {
        fullContactScreen.classList.add('active');
        document.body.style.overflow = 'hidden'; 
        fullContactScreen.scrollTo(0, 0);
    }
}

function closeFullScreenContact() {
    if (fullContactScreen) {
        fullContactScreen.classList.remove('active');
        document.body.style.overflow = '';
    }
}

if (contactNowBtn) contactNowBtn.addEventListener('click', openFullScreenContact);
if (navContactBtn) navContactBtn.addEventListener('click', openFullScreenContact);
if (closeContactBtn) closeContactBtn.addEventListener('click', closeFullScreenContact);

// --- Intro Transition Screen Logic ---
window.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('introScreen');
    const introHello = document.querySelector('.intro-hello');
    const introText = document.querySelector('.intro-text');
    
    if (introHello && introText) {
        const animateText = (element, delayOffset, outDelayOffset) => {
            const text = element.textContent;
            element.textContent = '';
            element.style.opacity = '1';
            
            text.split('').forEach((char, i) => {
                const span = document.createElement('span');
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.style.opacity = '0';
                span.style.display = 'inline-block';
                span.style.animation = `
                    letterIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delayOffset + i * 0.04}s forwards,
                    letterOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${outDelayOffset + i * 0.03}s forwards
                `;
                element.appendChild(span);
            });
        };
        
        animateText(introHello, 0.2, 1.6);
        animateText(introText, 2.0, 3.4);
    }

    // Force scroll to top on refresh and disable restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    
    // Wait for the animations to complete, then slide the screen up
    setTimeout(() => {
        if (introScreen) {
            introScreen.classList.add('hidden');
            document.body.classList.remove('loading');
            
            // Fully remove it from DOM after the transition completes
            setTimeout(() => {
                introScreen.style.display = 'none';
            }, 1200); // matches the 1.2s CSS transition
        }
    }, 4500); // Increased wait time to 4.5s
});

// Video loop controls removed — videos are now Vimeo iframes

// --- Vimeo Sound Toggle ---
(function initVimeoSound() {
    const MUTE_SVG = `<svg class="icon-muted" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>`;
    const SOUND_SVG = `<svg class="icon-sound" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>`;

    let activePlayer = null;   // track currently unmuted player
    let activeBtn = null;

    function muteActive() {
        if (activePlayer) {
            activePlayer.setVolume(0).catch(() => {});
            activePlayer = null;
        }
        if (activeBtn) {
            activeBtn.classList.remove('unmuted');
            activeBtn = null;
        }
    }

    // Wait for DOM + Vimeo SDK to be ready
    document.querySelectorAll('.interactive-img .vimeo-embed iframe').forEach(iframe => {
        const card = iframe.closest('.interactive-img');
        if (!card) return;

        // Inject button
        const btn = document.createElement('button');
        btn.className = 'sound-btn';
        btn.title = 'Toggle Sound';
        btn.innerHTML = MUTE_SVG + SOUND_SVG;
        card.appendChild(btn);

        // Init Vimeo Player SDK instance
        let player = null;
        let ready = false;

        function getPlayer() {
            if (!player) {
                player = new Vimeo.Player(iframe);
                player.ready().then(() => { ready = true; }).catch(() => {});
            }
            return player;
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = getPlayer();
            if (!ready) return;

            const isMuted = !btn.classList.contains('unmuted');

            if (isMuted) {
                // Mute previously active first
                if (activeBtn && activeBtn !== btn) muteActive();
                p.setVolume(1).then(() => {
                    btn.classList.add('unmuted');
                    activePlayer = p;
                    activeBtn = btn;
                }).catch(() => {});
            } else {
                p.setVolume(0).then(() => {
                    btn.classList.remove('unmuted');
                    activePlayer = null;
                    activeBtn = null;
                }).catch(() => {});
            }
        });

        // Pre-init player lazily when card is hovered
        card.addEventListener('mouseenter', () => { getPlayer(); }, { once: true });
    });
})();

// Apply initial active filters on page load to hide unrelated items
document.querySelectorAll('.gallery-section').forEach(section => {
    const activeBtn = section.querySelector('.filter-btn.active');
    if (activeBtn) {
        activeBtn.click();
    }
});

// --- FAQ Accordion Logic ---
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Close all others
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            // Toggle current
            if (!isActive) {
                item.classList.add('active');
            }
        });
    }
});

// --- Footer Navigation Logic ---
const footerWorkBtn = document.getElementById('footerWorkBtn');
if (footerWorkBtn) footerWorkBtn.addEventListener('click', (e) => { e.preventDefault(); openFullScreenGallery(); });

const footerContactBtn = document.getElementById('footerContactBtn');
if (footerContactBtn) footerContactBtn.addEventListener('click', (e) => { e.preventDefault(); openFullScreenContact(); });

// --- Send Message via Mailto ---
const sendMessageBtn = document.getElementById('sendMessageBtn');
if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', () => {
        const name = (document.getElementById('contactName')?.value || '').trim();
        const email = (document.getElementById('contactEmail')?.value || '').trim();
        const message = (document.getElementById('contactMessage')?.value || '').trim();

        if (!name && !message) {
            alert('Please fill in at least your name and message.');
            return;
        }

        const subject = encodeURIComponent(`Portfolio Inquiry from ${name || 'a visitor'}`);
        const body = encodeURIComponent(
            `Name: ${name || 'N/A'}\nEmail: ${email || 'N/A'}\n\nMessage:\n${message || 'N/A'}`
        );
        const gmailUrl = `https://mail.google.com/mail/?view=cm&to=visualzsoul@gmail.com&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
    });
}
