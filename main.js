/* ==========================================================================
   NexaPOS Landing Page - Interactive Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const header = document.querySelector('.main-header');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');
    
    const downloadTriggers = document.querySelectorAll('.download-trigger, #hero-download-windows, #hero-download-mac');
    const downloadModal = document.getElementById('download-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalFilename = document.getElementById('modal-filename');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const downloadStatus = document.getElementById('download-status');
    const modalDirectLink = document.getElementById('modal-direct-link');

    // --- Header Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Navigation Menu ---
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close menu when link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars';
            });
        });
    }

    // --- Download Modal & Simulated Progress ---
    const simulatedFiles = {
        'windows-installer': { name: 'NexaPOS-Setup-1.0.0.exe', url: 'https://github.com/nexapos/desktop-app/releases/download/v1.0.0/NexaPOS-Setup-1.0.0.exe' },
        'windows-portable': { name: 'NexaPOS-Portable-1.0.0.zip', url: 'https://github.com/nexapos/desktop-app/releases/download/v1.0.0/NexaPOS-Portable-1.0.0.zip' },
        'mac-dmg': { name: 'NexaPOS-1.0.0.dmg', url: 'https://github.com/nexapos/desktop-app/releases/download/v1.0.0/NexaPOS-1.0.0.dmg' }
    };

    function triggerSimulatedDownload(fileName, fileUrl) {
        // Reset Progress Bar
        progressBarFill.style.width = '0%';
        modalFilename.textContent = fileName;
        modalDirectLink.setAttribute('href', fileUrl);
        modalDirectLink.setAttribute('download', fileName);
        
        // Show Modal
        downloadModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
        
        // Progress States
        const statuses = [
            { threshold: 0, text: 'Đang khởi tạo kết nối an toàn...' },
            { threshold: 25, text: 'Đang xác minh chữ ký bảo mật...' },
            { threshold: 55, text: 'Đang kết nối máy chủ phân phối Cloud...' },
            { threshold: 85, text: 'Chuẩn bị tải tệp xuống...' },
            { threshold: 100, text: 'Bắt đầu tải xuống tự động!' }
        ];

        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            if (progress > 100) progress = 100;
            
            progressBarFill.style.width = `${progress}%`;
            
            // Update status text based on progress
            const currentStatus = statuses.reduce((prev, curr) => {
                return (progress >= curr.threshold) ? curr : prev;
            }, statuses[0]);
            
            downloadStatus.textContent = `${currentStatus.text} (${progress}%)`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Simulate window location change/trigger download anchor
                setTimeout(() => {
                    // Create an temporary link and trigger click
                    const tempLink = document.createElement('a');
                    tempLink.href = fileUrl;
                    tempLink.download = fileName;
                    tempLink.target = '_blank';
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                    
                    downloadStatus.textContent = 'Hoàn tất! Tệp tin của bạn đang được tải xuống.';
                }, 500);
            }
        }, 50);
    }

    // Bind triggers
    downloadTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // Determine file type
            let fileKey = 'windows-installer'; // Default
            
            const targetId = trigger.getAttribute('id');
            const dataFileAttr = trigger.getAttribute('data-file');
            
            if (targetId === 'hero-download-windows' || targetId === 'btn-dl-win-installer' || dataFileAttr === 'NexaPOS-Setup-1.0.0.exe') {
                fileKey = 'windows-installer';
            } else if (targetId === 'btn-dl-win-portable' || dataFileAttr === 'NexaPOS-Portable-1.0.0.zip') {
                fileKey = 'windows-portable';
            } else if (targetId === 'hero-download-mac' || targetId === 'btn-dl-mac' || dataFileAttr === 'NexaPOS-1.0.0.dmg') {
                fileKey = 'mac-dmg';
            }
            
            const selectedFile = simulatedFiles[fileKey];
            
            // Prevent default jump for anchor links if they trigger download popup
            e.preventDefault();
            triggerSimulatedDownload(selectedFile.name, selectedFile.url);
        });
    });

    // Close Modal Events
    function closeModal() {
        downloadModal.classList.remove('active');
        document.body.style.overflow = ''; // Unlock scrolling
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (downloadModal) {
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) {
                closeModal();
            }
        });
    }

    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && downloadModal.classList.contains('active')) {
            closeModal();
        }
    });

    // --- Simple Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.feature-card, .tech-card, .dev-card, .download-card');
    
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight * 0.85;
        
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            // Adding dynamic inline styles initially, then letting CSS transition work
            if (elementTop < triggerBottom) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    // Initialize initial styles for reveal effect
    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load
});
