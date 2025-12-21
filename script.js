// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const navMenu = document.getElementById('navMenu');
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.querySelectorAll('.nav-link');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
    });
});

// Active navigation link on scroll
const sections = document.querySelectorAll('.section, .hero');
window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.glass-card, .job-card, .stat-card, .culture-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ===== JOB FILTERING =====
const filterBtns = document.querySelectorAll('.filter-btn');
const jobCards = document.querySelectorAll('.job-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        jobCards.forEach(card => {
            const category = card.getAttribute('data-category');

            if (filter === 'all' || category === filter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// Function to scroll to apply section and pre-fill position
function scrollToApply(position) {
    const applySection = document.getElementById('apply');
    const positionSelect = document.getElementById('position');

    // Scroll to apply section
    applySection.scrollIntoView({ behavior: 'smooth' });

    // Pre-fill position after a short delay
    setTimeout(() => {
        positionSelect.value = position;
        positionSelect.style.borderColor = 'var(--primary)';
        setTimeout(() => {
            positionSelect.style.borderColor = '';
        }, 1000);
    }, 800);
}

// ===== FILE UPLOAD =====
const fileInput = document.getElementById('cv');
const fileUpload = document.getElementById('fileUpload');
const fileNameDisplay = document.getElementById('fileName');

// Handle file selection
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Handle drag and drop
fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = 'var(--primary)';
    fileUpload.style.background = 'rgba(99, 102, 241, 0.1)';
});

fileUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '';
    fileUpload.style.background = '';
});

fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = '';
    fileUpload.style.background = '';

    const file = e.dataTransfer.files[0];
    if (file) {
        // Update the file input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        handleFile(file);
    }
});

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        alert('Vui lòng chọn file PDF, DOC hoặc DOCX');
        fileInput.value = '';
        return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        alert('File quá lớn. Vui lòng chọn file dưới 5MB');
        fileInput.value = '';
        return;
    }

    // Display file name
    fileNameDisplay.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileNameDisplay.style.display = 'inline-block';
}

// ===== FORM VALIDATION & SUBMISSION =====
const recruitmentForm = document.getElementById('recruitmentForm');

recruitmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(recruitmentForm);
    const data = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        position: document.getElementById('position').value,
        experience: document.getElementById('experience').value,
        coverLetter: document.getElementById('coverLetter').value,
        cv: fileInput.files[0]?.name || 'No file'
    };

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Email không hợp lệ');
        return;
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        alert('Số điện thoại không hợp lệ');
        return;
    }

    // Check if CV is uploaded
    if (!fileInput.files[0]) {
        alert('Vui lòng tải lên CV của bạn');
        return;
    }

    // Disable submit button
    const submitBtn = recruitmentForm.querySelector('.form-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    // Simulate form submission (in real app, send to server)
    setTimeout(() => {
        console.log('Form Data:', data);
        console.log('CV File:', fileInput.files[0]);

        // Show success message
        alert('✅ Cảm ơn bạn đã ứng tuyển! Chúng tôi sẽ liên hệ với bạn sớm nhất.');

        // Reset form
        recruitmentForm.reset();
        fileNameDisplay.style.display = 'none';

        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi Hồ Sơ';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
});

// Real-time validation
const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.trim() === '' && input.hasAttribute('required')) {
            input.style.borderColor = 'var(--secondary)';
        } else {
            input.style.borderColor = 'var(--primary)';
            setTimeout(() => {
                input.style.borderColor = '';
            }, 500);
        }
    });
});

// ===== SCROLL TO TOP BUTTON =====
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===== COUNTER ANIMATION FOR STATS =====
const statNumbers = document.querySelectorAll('.stat-number');

const animateCounter = (element) => {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    };

    updateCounter();
};

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            animateCounter(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => {
    statsObserver.observe(stat);
});

// ===== PARALLAX EFFECT FOR HERO =====
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroBackground = document.querySelector('.hero-background');
    const heroParticles = document.querySelectorAll('.particle');

    if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }

    heroParticles.forEach((particle, index) => {
        const speed = (index + 1) * 0.3;
        particle.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ===== CHATBOT FUNCTIONALITY =====
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const quickReplies = document.querySelectorAll('.quick-reply');

// Toggle chatbot window
chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('active');
    chatbotToggle.classList.toggle('active');

    if (chatbotWindow.classList.contains('active')) {
        chatbotInput.focus();
    }
});

// Send message function
function sendMessage(text) {
    if (!text.trim()) return;

    // Add user message
    addMessage(text, 'user');
    chatbotInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate bot response
    setTimeout(() => {
        hideTypingIndicator();
        const response = getBotResponse(text);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 1000);
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
    <div class="message-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
    <div>
      <div class="message-content">${text}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-message';
    typingDiv.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingMessage = chatbotMessages.querySelector('.typing-message');
    if (typingMessage) {
        typingMessage.remove();
    }
}

// Bot response logic
function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Job-related queries
    if (message.includes('tuyển dụng') || message.includes('vị trí') || message.includes('job')) {
        return 'Chúng tôi đang tuyển dụng nhiều vị trí hấp dẫn như Full Stack Developer, UI/UX Designer, DevOps Engineer và nhiều hơn nữa! Bạn có thể xem chi tiết tại mục <a href="#jobs" style="color: var(--primary-light); text-decoration: underline;">Tuyển Dụng</a> nhé. 💼';
    }

    // Culture queries
    if (message.includes('văn hóa') || message.includes('môi trường') || message.includes('culture')) {
        return 'TechVision tự hào với văn hóa làm việc năng động, sáng tạo và tôn trọng con người. Chúng tôi khuyến khích đổi mới, học hỏi liên tục và cân bằng cuộc sống. Xem thêm tại mục <a href="#culture" style="color: var(--primary-light); text-decoration: underline;">Văn Hóa</a>! 🏢';
    }

    // Application process
    if (message.includes('quy trình') || message.includes('ứng tuyển') || message.includes('apply')) {
        return 'Quy trình ứng tuyển rất đơn giản: <br>1️⃣ Điền form ứng tuyển<br>2️⃣ Upload CV<br>3️⃣ HR sẽ liên hệ trong 3-5 ngày<br>4️⃣ Phỏng vấn (1-2 vòng)<br>5️⃣ Nhận offer! 🎉<br><br>Bạn có thể <a href="#apply" style="color: var(--primary-light); text-decoration: underline;">ứng tuyển ngay</a> tại đây.';
    }

    // Contact queries
    if (message.includes('liên hệ') || message.includes('contact') || message.includes('hr')) {
        return 'Bạn có thể liên hệ với đội ngũ HR của chúng tôi qua:<br>📧 Email: hr@techvision.vn<br>📱 Hotline: +84 123 456 789<br>📍 Địa chỉ: Hà Nội, Việt Nam<br><br>Chúng tôi luôn sẵn sàng hỗ trợ bạn! 😊';
    }

    // Salary queries
    if (message.includes('lương') || message.includes('salary') || message.includes('thu nhập')) {
        return 'Mức lương của chúng tôi rất cạnh tranh và phụ thuộc vào vị trí, kinh nghiệm:<br>💰 Junior: 800-1500 USD<br>💰 Middle: 1500-2500 USD<br>💰 Senior: 2000-3500 USD<br><br>Ngoài ra còn có thưởng KPI, bảo hiểm đầy đủ và nhiều phúc lợi khác! 🎁';
    }

    // Benefits queries
    if (message.includes('phúc lợi') || message.includes('benefit') || message.includes('chế độ')) {
        return 'Phúc lợi tại TechVision:<br>✅ Bảo hiểm sức khỏe cao cấp<br>✅ Thưởng hiệu suất hàng quý<br>✅ Du lịch công ty hàng năm<br>✅ Đào tạo & phát triển<br>✅ Làm việc linh hoạt<br>✅ Gym & thể thao miễn phí<br>✅ Snack & coffee không giới hạn ☕';
    }

    // Working hours
    if (message.includes('giờ làm') || message.includes('working hour') || message.includes('thời gian')) {
        return 'Giờ làm việc linh hoạt tại TechVision:<br>⏰ 8:30 - 17:30 (T2-T6)<br>🏠 Hỗ trợ làm việc từ xa<br>⚡ Không OT bắt buộc<br>🎯 Tập trung vào hiệu quả công việc, không phải số giờ ngồi văn phòng!';
    }

    // Technology stack
    if (message.includes('công nghệ') || message.includes('tech stack') || message.includes('technology')) {
        return 'Chúng tôi sử dụng công nghệ hiện đại nhất:<br>💻 Frontend: React, Vue.js, Next.js<br>⚙️ Backend: Node.js, Python, Java<br>☁️ Cloud: AWS, Google Cloud<br>📱 Mobile: React Native, Flutter<br>🗄️ Database: MongoDB, PostgreSQL<br>🔧 DevOps: Docker, Kubernetes, CI/CD';
    }

    // Greeting
    if (message.includes('xin chào') || message.includes('hello') || message.includes('hi')) {
        return 'Xin chào! Rất vui được hỗ trợ bạn. Bạn muốn tìm hiểu về điều gì tại TechVision? 👋';
    }

    // Thanks
    if (message.includes('cảm ơn') || message.includes('thank')) {
        return 'Rất vui được giúp đỡ bạn! Nếu có bất kỳ câu hỏi nào khác, đừng ngại hỏi nhé. Chúc bạn một ngày tuyệt vời! 🌟';
    }

    // Default response
    const defaultResponses = [
        'Cảm ơn bạn đã quan tâm! Bạn có thể hỏi tôi về:<br>💼 Vị trí tuyển dụng<br>🏢 Văn hóa công ty<br>📝 Quy trình ứng tuyển<br>💰 Lương & phúc lợi<br>📞 Thông tin liên hệ',
        'Tôi có thể giúp bạn tìm hiểu về TechVision! Bạn muốn biết về vị trí tuyển dụng, văn hóa công ty hay quy trình ứng tuyển? 🤔',
        'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi tôi về tuyển dụng, văn hóa, phúc lợi hoặc liên hệ HR nhé! 😊'
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Send button click
chatbotSend.addEventListener('click', () => {
    sendMessage(chatbotInput.value);
});

// Enter key to send
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(chatbotInput.value);
    }
});

// Quick replies
quickReplies.forEach(btn => {
    btn.addEventListener('click', () => {
        const reply = btn.getAttribute('data-reply');
        sendMessage(reply);
    });
});

// Auto-open chatbot after 5 seconds (optional)
setTimeout(() => {
    if (!chatbotWindow.classList.contains('active')) {
        // Show a subtle notification
        chatbotToggle.style.animation = 'bounce 0.5s ease 3';
    }
}, 5000);

// Bounce animation for chatbot button
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);

// ===== CONSOLE MESSAGE =====

console.log('%c🚀 TechVision - Công ty công nghệ hàng đầu', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cChào mừng bạn đến với TechVision! Hãy tham gia đội ngũ của chúng tôi.', 'color: #a0a0b8; font-size: 14px;');
