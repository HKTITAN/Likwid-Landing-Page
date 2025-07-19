// Loader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
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

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Mobile menu toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
let isMenuOpen = false;

mobileMenu.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'white';
        navLinks.style.padding = '2rem';
        navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        mobileMenu.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        navLinks.style.display = 'none';
        mobileMenu.innerHTML = '<i class="fas fa-bars"></i>';
    }
});



// Pricing toggle functionality
const toggleOptions = document.querySelectorAll('.toggle-option');
const monthlyPricing = document.querySelectorAll('.monthly-pricing');
const annualPricing = document.querySelectorAll('.annual-pricing');

toggleOptions.forEach(option => {
    option.addEventListener('click', function() {
        const period = this.dataset.period;
        
        // Update active states
        toggleOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // Show/hide pricing
        if (period === 'annual') {
            monthlyPricing.forEach(pricing => pricing.style.display = 'none');
            annualPricing.forEach(pricing => pricing.style.display = 'block');
        } else {
            monthlyPricing.forEach(pricing => pricing.style.display = 'block');
            annualPricing.forEach(pricing => pricing.style.display = 'none');
                            }
        });
    });

    // Pricing Calculator functionality
    let currentBilling = 'annual';
    let globalUserCount = 1;

    const planPricing = {
        starter: { monthly: 999, annual: 839 },
        growth: { monthly: 1299, annual: 1091 }
    };

    function changeUsers(plan, delta) {
        globalUserCount = Math.max(1, Math.min(1000, globalUserCount + delta));
        syncAllUserCounts();
    }

    function updateUserCount(plan) {
        const inputElement = document.getElementById(`${plan}-users`);
        const newValue = Math.max(1, Math.min(1000, parseInt(inputElement.value) || 1));
        
        // Update the input to show the corrected value
        inputElement.value = newValue;
        globalUserCount = newValue;
        syncAllUserCounts();
    }

    function syncAllUserCounts() {
        // Update all input fields
        document.getElementById('starter-users').value = globalUserCount;
        document.getElementById('growth-users').value = globalUserCount;
        
        // Update visualizations and pricing for all plans
        updateUserVisualization('starter');
        updateUserVisualization('growth');
        updatePlanPricing('starter');
        updatePlanPricing('growth');
        updateRecommendations();
    }

    function updateUserVisualization(plan) {
        const users = globalUserCount;
        const vizElement = document.getElementById(`${plan}-viz`);
        
        // Limit visual representation to 20 icons max for readability
        const iconsToShow = Math.min(users, 20);
        let iconsHtml = '';
        
        for (let i = 0; i < iconsToShow; i++) {
            iconsHtml += '<i class="fas fa-user"></i>';
        }
        
        if (users > 20) {
            iconsHtml += `<span style="color: var(--primary-color); font-weight: 600; margin-left: 8px;">+${users - 20}</span>`;
        }
        
        vizElement.innerHTML = iconsHtml;
    }

    function updateRecommendations() {
        const users = globalUserCount;
        const enterpriseRecommendation = document.getElementById('enterprise-recommendation');
        
        // Show enterprise recommendation if user count exceeds 25
        if (users > 25) {
            if (enterpriseRecommendation) {
                enterpriseRecommendation.style.display = 'block';
            }
        } else {
            if (enterpriseRecommendation) {
                enterpriseRecommendation.style.display = 'none';
            }
        }
        
        // Show individual plan recommendations
        updatePlanRecommendation('starter');
        updatePlanRecommendation('growth');
    }

    function updatePlanRecommendation(plan) {
        const users = globalUserCount;
        const recommendationElement = document.getElementById(`${plan}-recommendation`);
        
        if (users <= 5) {
            if (plan === 'starter') {
                recommendationElement.innerHTML = '👍 Perfect for small teams';
                recommendationElement.style.display = 'block';
            } else {
                recommendationElement.style.display = 'none';
            }
        } else if (users <= 15) {
            if (plan === 'growth') {
                recommendationElement.innerHTML = '⭐ Recommended for growing teams';
                recommendationElement.style.display = 'block';
            } else {
                recommendationElement.innerHTML = '💡 Consider Growth plan for better features';
                recommendationElement.style.display = 'block';
            }
        } else if (users <= 25) {
            if (plan === 'growth') {
                recommendationElement.innerHTML = '🚀 Great choice for medium teams';
                recommendationElement.style.display = 'block';
            } else {
                recommendationElement.innerHTML = '💡 Growth plan recommended for this size';
                recommendationElement.style.display = 'block';
            }
        } else {
            recommendationElement.innerHTML = '🏢 Consider Enterprise for 25+ users';
            recommendationElement.style.display = 'block';
        }
    }

    function updatePlanPricing(plan) {
        const users = globalUserCount;
        const pricing = planPricing[plan];
        
        // Update monthly totals
        const monthlyTotal = pricing.monthly * users;
        document.getElementById(`${plan}-monthly-total`).textContent = monthlyTotal.toLocaleString();
        
        // Update annual totals and savings
        const annualTotal = pricing.annual * users * 12;
        const annualSavings = (pricing.monthly * 12 - pricing.annual * 12) * users;
        document.getElementById(`${plan}-annual-total`).textContent = annualTotal.toLocaleString();
        document.getElementById(`${plan}-savings`).textContent = `Save ₹${annualSavings.toLocaleString()} per year`;
    }

    function updateAllPricing() {
        syncAllUserCounts();
    }

    // Initialize pricing
    document.addEventListener('DOMContentLoaded', function() {
        updateAllPricing();
    });

            // Interactive Modules functionality
function initModules() {
    const navItems = document.querySelectorAll('.nav-item');
    const moduleContents = document.querySelectorAll('.module-content');
    
    // Check if module elements exist
    if (!navItems.length || !moduleContents.length) {
        console.log('Module navigation elements not found, skipping modules initialization');
        return;
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const moduleId = item.dataset.module;
            
            // Remove active class from all nav items and contents
            navItems.forEach(nav => nav.classList.remove('active'));
            moduleContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked item and corresponding content
            item.classList.add('active');
            const targetContent = document.querySelector(`.module-content[data-module="${moduleId}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Manufacturing Flow interaction
function initFeatures() {
    const flowStages = document.querySelectorAll('.flow-stage');
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Check if elements exist
    if (!flowStages.length && !featureCards.length) {
        console.log('Feature elements not found, skipping features initialization');
        return;
    }
    
    // Add simple hover interactions for flow stages
    flowStages.forEach((stage, index) => {
        stage.addEventListener('mouseenter', () => {
            stage.style.background = 'rgba(126, 68, 238, 0.1)';
        });
        
        stage.addEventListener('mouseleave', () => {
            stage.style.background = '';
        });
    });
    
    // Add scroll-triggered animations for feature cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}



            // Typing text functionality
const typingTexts = [
    'Intelligence',
    'Automation',
    'Innovation',
    'Efficiency',
    'Growth',
    'Excellence'
];

let currentTextIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let isTyping = false;
const rotatingElement = document.getElementById('rotating-text');

function typeText() {
    if (!rotatingElement) return;
    
    const currentText = typingTexts[currentTextIndex];
    
    if (!isTyping) {
        isTyping = true;
        // Add cursor if not present
        if (!rotatingElement.querySelector('.typing-cursor')) {
            rotatingElement.innerHTML = '<span class="typing-text"></span><span class="typing-cursor"></span>';
        }
    }
    
    const typingTextElement = rotatingElement.querySelector('.typing-text');
    
    if (isDeleting) {
        // Deleting characters
        typingTextElement.textContent = currentText.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        
        if (currentCharIndex === 0) {
            isDeleting = false;
            currentTextIndex = (currentTextIndex + 1) % typingTexts.length;
            setTimeout(typeText, 500); // Pause before typing next word
            return;
        }
        
        setTimeout(typeText, 50); // Faster deletion
    } else {
        // Typing characters
        typingTextElement.textContent = currentText.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        
        if (currentCharIndex === currentText.length) {
            isDeleting = true;
            setTimeout(typeText, 2000); // Pause when word is complete
            return;
        }
        
        setTimeout(typeText, 100); // Normal typing speed
    }
}
    
        // Carousel functionality
function initCarousel() {
    const track = document.getElementById('carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    
    // Check if carousel elements exist, if not, exit gracefully
    if (!track || !slides.length || !dots.length || !prevBtn || !nextBtn || !carouselWrapper) {
        console.log('Carousel elements not found, skipping carousel initialization');
        return;
    }
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoAdvanceInterval;

    function updateCarousel() {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide and dot
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        
        // Move the track
        const translateX = -(currentSlide * 25);
        track.style.transform = `translateX(${translateX}%)`;
        
        // Update button states
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    }

    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }

    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateCarousel();
    }

    function startAutoAdvance() {
        autoAdvanceInterval = setInterval(() => {
            if (currentSlide < totalSlides - 1) {
                nextSlide();
            } else {
                currentSlide = 0;
                updateCarousel();
            }
        }, 8000);
    }

    function stopAutoAdvance() {
        clearInterval(autoAdvanceInterval);
    }

    // Event listeners
    nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoAdvance();
        setTimeout(startAutoAdvance, 3000); // Restart after 3 seconds
    });
    
    prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoAdvance();
        setTimeout(startAutoAdvance, 3000);
    });
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            stopAutoAdvance();
            setTimeout(startAutoAdvance, 3000);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoAdvance();
            setTimeout(startAutoAdvance, 3000);
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoAdvance();
            setTimeout(startAutoAdvance, 3000);
        }
    });

    // Touch/swipe support
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    carouselWrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        stopAutoAdvance();
    });

    carouselWrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX;
    });

    carouselWrapper.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diffX = startX - currentX;
        const threshold = 50;
        
        if (diffX > threshold) {
            nextSlide();
        } else if (diffX < -threshold) {
            prevSlide();
        }
        
        setTimeout(startAutoAdvance, 3000);
    });

    // Pause auto-advance on hover
    carouselWrapper.addEventListener('mouseenter', stopAutoAdvance);
    carouselWrapper.addEventListener('mouseleave', startAutoAdvance);

    // Initialize
    updateCarousel();
    startAutoAdvance();
}

// AI Assistant Chat Functionality
function initAIAssistant() {
    const typingIndicator = document.getElementById('typing-indicator');
    const insightResponse = document.getElementById('insight-response');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    // Ensure elements exist before proceeding
    if (!typingIndicator || !insightResponse || !chatInput || !sendBtn || !chatMessages) {
        console.log('AI Assistant elements not found, retrying...');
        setTimeout(() => initAIAssistant(), 500);
        return;
    }
    
    let hasShownInitialResponse = false;
    let userHasTyped = false;
    let isShowingTyping = false;
    
    // Make sure typing indicator starts hidden
    typingIndicator.style.display = 'none';
    
    // Sample AI responses for different types of questions
    const aiResponses = [
        "Based on your current production data, I can see that Line 2 has the most optimization potential. Would you like me to analyze specific efficiency metrics?",
        "Your quality control metrics show excellent performance! Line 1 is maintaining a 98.2% success rate. I can provide detailed breakdown if needed.",
        "I've identified 3 areas where we can improve energy efficiency by 15-20%. Shall I walk you through the optimization recommendations?",
        "Great question! Your inventory turnover rate has improved by 23% this quarter. I can show you which products are driving this improvement.",
        "I'm analyzing your maintenance schedules now. There are 2 machines that could benefit from predictive maintenance. Want to see the details?",
        "Your production forecast looks positive! Based on current trends, we're on track to exceed targets by 12% this month.",
        "I can help optimize your supply chain routes. Current analysis shows potential savings of ₹2.8L annually with route optimization.",
        "Looking at your labor efficiency data, I notice peak productivity between 10 AM - 2 PM. We could schedule critical operations during these hours.",
        "Your raw material costs have fluctuated recently. I can suggest 3 alternative suppliers that could reduce costs by 8-12%.",
        "Quality inspection data shows a pattern - defects increase on Fridays. This might be related to workforce fatigue. Should we adjust schedules?",
        "I've detected unusual vibration patterns in Machine #7. Preventive maintenance within the next 2 weeks could prevent costly breakdowns.",
        "Your packaging efficiency has room for improvement. By optimizing the packaging line sequence, we could save 18 minutes per batch."
    ];
    
    // Function to get contextual response based on user input
    function getContextualResponse(userMessage) {
        const msg = userMessage.toLowerCase();
        
        if (msg.includes('efficiency') || msg.includes('optimize') || msg.includes('performance')) {
            return "I'm analyzing your efficiency metrics right now. Your overall equipment effectiveness (OEE) is at 87%, which is above industry average! I can identify specific bottlenecks if you'd like.";
        }
        if (msg.includes('quality') || msg.includes('defect') || msg.includes('error')) {
            return "Quality metrics look good overall! Current defect rate is 2.3%, down from 3.1% last month. Line 3 needs attention though - shall I show you the details?";
        }
        if (msg.includes('maintenance') || msg.includes('repair') || msg.includes('breakdown')) {
            return "Perfect timing! I've been monitoring your equipment health. 3 machines are due for preventive maintenance, and I've optimized the schedule to minimize production impact.";
        }
        if (msg.includes('inventory') || msg.includes('stock') || msg.includes('supply')) {
            return "Your inventory management is looking sharp! Current stock levels are optimal for 89% of items. I've identified 4 items that need reordering in the next week.";
        }
        if (msg.includes('cost') || msg.includes('savings') || msg.includes('money') || msg.includes('budget')) {
            return "Great question about costs! I've identified potential savings of ₹3.2L this quarter through energy optimization, reduced waste, and supplier negotiations. Want the breakdown?";
        }
        if (msg.includes('production') || msg.includes('output') || msg.includes('manufacturing')) {
            return "Production is running smoothly! Today's output is 103% of target. Line 1 is our star performer at 96% efficiency. Line 2 has room for a 12% improvement.";
        }
        if (msg.includes('energy') || msg.includes('power') || msg.includes('electricity')) {
            return "Energy consumption analysis shows we can reduce costs by 15% with smart scheduling. Peak hour usage could be shifted to save ₹45,000 monthly.";
        }
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return "Hello! I'm Jack, your AI manufacturing assistant. I'm currently monitoring 47 production parameters across your facility. What would you like to know about your operations?";
        }
        if (msg.includes('help') || msg.includes('what can you do')) {
            return "I can help you with production optimization, quality control, predictive maintenance, inventory management, cost analysis, and much more! Just ask me about any aspect of your manufacturing operations.";
        }
        
        // Default responses for general questions
        return aiResponses[Math.floor(Math.random() * aiResponses.length)];
    }
    
    // Factory insights to showcase
    const factoryInsights = [
        {
            icon: "fas fa-chart-line",
            title: "Production Efficiency Analysis",
            metric: "↗ 23%",
            metricLabel: "improvement vs last month",
            breakdown: [
                { label: "Line 1 Efficiency:", value: "92%" },
                { label: "Line 2 Efficiency:", value: "78%" }
            ],
            suggestion: "Optimize Line 2 schedule during 2-4 PM slot for 15% more output"
        },
        {
            icon: "fas fa-exclamation-triangle",
            title: "Quality Alert - Line 3",
            metric: "↓ 8%",
            metricLabel: "quality score drop detected",
            breakdown: [
                { label: "Defect Rate:", value: "4.2%" },
                { label: "Previous Average:", value: "2.1%" }
            ],
            suggestion: "Machine recalibration recommended - Schedule for next maintenance window"
        },
        {
            icon: "fas fa-boxes",
            title: "Inventory Optimization",
            metric: "₹1.2L",
            metricLabel: "potential savings identified",
            breakdown: [
                { label: "Overstock Items:", value: "12" },
                { label: "Critical Low Stock:", value: "3" }
            ],
            suggestion: "Rebalance inventory: Reduce overstock by 30%, increase critical items by 150%"
        }
    ];
    
    let currentInsightIndex = 0;
    
    // Show initial loading and insights demonstration
    function showInitialInsights() {
        // Show typing indicator initially
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
        }
        
        // After 2 seconds, hide typing indicator and show first insight
        setTimeout(() => {
            if (typingIndicator && insightResponse) {
                // Hide typing indicator and show first insight
                typingIndicator.style.display = 'none';
                showInsight(factoryInsights[currentInsightIndex]);
                
                // Enable chat input after first insight is shown (already enabled in HTML now)
                setTimeout(() => {
                    hasShownInitialResponse = true;
                    
                    // Automatically cycle through insights every 8 seconds only if user hasn't typed
                    startInsightCycle();
                }, 1000);
            }
        }, 2000); // Show typing for 2 seconds initially
    }
    
    // Show a specific insight
    function showInsight(insight) {
        insightResponse.innerHTML = `
            <div class="insight-header">
                <i class="${insight.icon}"></i>
                <span>${insight.title}</span>
            </div>
            <div class="insight-metric">
                <span class="metric-value">${insight.metric}</span>
                <span class="metric-label">${insight.metricLabel}</span>
            </div>
            <div class="efficiency-breakdown">
                ${insight.breakdown.map(item => `
                    <div class="breakdown-item">
                        <span class="breakdown-label">${item.label}</span>
                        <span class="breakdown-value">${item.value}</span>
                    </div>
                `).join('')}
            </div>
            <div class="insight-suggestion">
                <i class="fas fa-lightbulb"></i>
                <span><strong>AI Suggestion:</strong> ${insight.suggestion}</span>
            </div>
        `;
        insightResponse.style.display = 'block';
        
        // Add a subtle animation
        insightResponse.style.opacity = '0';
        insightResponse.style.transform = 'translateY(10px)';
        setTimeout(() => {
            insightResponse.style.transition = 'all 0.5s ease';
            insightResponse.style.opacity = '1';
            insightResponse.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Cycle through insights automatically
    function startInsightCycle() {
        setInterval(() => {
            if (!userHasTyped && hasShownInitialResponse) {
                currentInsightIndex = (currentInsightIndex + 1) % factoryInsights.length;
                showInsight(factoryInsights[currentInsightIndex]);
            }
        }, 8000);
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        if (isShowingTyping) return;
        isShowingTyping = true;
        
        // Create typing message
        const typingMessage = document.createElement('div');
        typingMessage.className = 'message ai-message typing-message';
        typingMessage.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return typingMessage;
    }
    
    // Remove typing indicator
    function hideTypingIndicator() {
        const typingMessage = chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
        isShowingTyping = false;
    }
    
    // Handle user input
    function handleUserMessage() {
        console.log('handleUserMessage called');
        const message = chatInput.value.trim();
        console.log('Message:', message);
        
        if (!message) {
            console.log('No message, returning');
            return;
        }
        
        userHasTyped = true;
        console.log('Processing message:', message);
        
        // Add user message to chat
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.innerHTML = `
            <div class="message-content">
                <p class="message-text">${message}</p>
            </div>
        `;
        chatMessages.appendChild(userMessage);
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        const typingMsg = showTypingIndicator();
        
        // After 1-2 seconds, show AI response
        setTimeout(() => {
            hideTypingIndicator();
            
            // Get a contextual AI response based on user input
            const aiResponse = getContextualResponse(message);
            
            const aiMessage = document.createElement('div');
            aiMessage.className = 'message ai-message';
            aiMessage.innerHTML = `
                <div class="message-content">
                    <p class="message-text">${aiResponse}</p>
                </div>
            `;
            chatMessages.appendChild(aiMessage);
            
            // After 3 more messages, show trial prompt
            const messageCount = chatMessages.querySelectorAll('.user-message').length;
            if (messageCount >= 3) {
                setTimeout(() => {
                    const trialMessage = document.createElement('div');
                    trialMessage.className = 'message ai-message';
                    trialMessage.innerHTML = `
                        <div class="message-content">
                            <p class="message-text">I'd love to continue helping you optimize your manufacturing operations! To unlock my full potential and get personalized insights for your specific factory data, let's get you set up with a free trial.</p>
                            <div class="trial-prompt">
                                <h4>🚀 Unlock Full Jack AI Experience</h4>
                                <p>Get real-time insights, predictive analytics, and personalized optimization recommendations</p>
                                <a href="onboarding.html" class="trial-prompt-btn">Start Free Trial →</a>
                            </div>
                        </div>
                    `;
                    chatMessages.appendChild(trialMessage);
                    
                    // Update input state
                    chatInput.disabled = true;
                    chatInput.placeholder = "Start your free trial to unlock full Jack AI capabilities...";
                    sendBtn.disabled = true;
                    
                    // Scroll to bottom
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, 1000);
            }
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, Math.random() * 1000 + 1000); // Random delay between 1-2 seconds
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Event listeners
    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Send button clicked');
            handleUserMessage();
        });
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed');
                handleUserMessage();
            }
        });
        
        // Add input focus effect
        chatInput.addEventListener('focus', () => {
            userHasTyped = true; // Stop auto-cycling when user starts interacting
        });
    }
    
    // Start the initial insights demonstration
    showInitialInsights();
}



// Mobile responsive adjustments for new section
function initMobileResponsive() {
    function adjustForMobile() {
        const isMobile = window.innerWidth <= 768;
        
        // Adjust calculator grid for mobile
        const calculatorGrid = document.querySelector('.calculator-grid');
        if (calculatorGrid) {
            if (isMobile) {
                calculatorGrid.style.gridTemplateColumns = '1fr';
                calculatorGrid.style.gap = '2rem';
            } else {
                calculatorGrid.style.gridTemplateColumns = '1fr 1fr';
                calculatorGrid.style.gap = '4rem';
            }
        }
        
        // Adjust comparison grid for mobile
        const comparisonGrid = document.querySelector('.comparison-grid');
        if (comparisonGrid) {
            if (isMobile) {
                comparisonGrid.style.gridTemplateColumns = '1fr';
                comparisonGrid.style.gap = '2rem';
                
                // Reorder elements for mobile
                const transformArrow = comparisonGrid.querySelector('.transformation-arrow');
                if (transformArrow) {
                    transformArrow.style.order = '2';
                    const arrowIcon = transformArrow.querySelector('.arrow-icon');
                    if (arrowIcon) {
                        arrowIcon.style.transform = 'rotate(90deg)';
                    }
                }
            } else {
                comparisonGrid.style.gridTemplateColumns = '1fr auto 1fr';
                comparisonGrid.style.gap = '3rem';
                
                const transformArrow = comparisonGrid.querySelector('.transformation-arrow');
                if (transformArrow) {
                    transformArrow.style.order = 'initial';
                    const arrowIcon = transformArrow.querySelector('.arrow-icon');
                    if (arrowIcon) {
                        arrowIcon.style.transform = '';
                    }
                }
            }
        }
    }
    
    // Run on load and resize
    adjustForMobile();
    window.addEventListener('resize', adjustForMobile);
}

// Test function to check AI Assistant elements
function testAIAssistantElements() {
    console.log('Testing AI Assistant elements...');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    console.log('Chat input:', chatInput);
    console.log('Send button:', sendBtn);
    console.log('Chat messages:', chatMessages);
    
    if (chatInput && sendBtn) {
        console.log('Elements found! Adding basic event listeners...');
        
        // Add a direct click event listener for testing
        sendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Send button clicked!');
            const message = chatInput.value.trim();
            console.log('Message value:', message);
            if (message) {
                console.log('Message is valid, processing...');
                alert('Message received: ' + message); // Temporary alert for testing
                chatInput.value = ''; // Clear input
            } else {
                console.log('Message is empty');
            }
        });
        
        // Add Enter key listener
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter key pressed');
                sendBtn.click();
            }
        });
        
        console.log('Basic event listeners added successfully');
    } else {
        console.error('Chat elements not found!');
    }
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    initModules();
    initFeatures();
    setTimeout(typeText, 1000); // Start typing effect after 1 second
    updateAllPricing(); // Initialize pricing
    initAboutSection();
    initInsightsSection();
    initCarousel(); // Initialize carousel
    
    // Initialize AI assistant with error handling
    try {
        console.log('Initializing AI Assistant...');
        initAIAssistant(); // Initialize AI assistant
        console.log('AI Assistant initialized successfully');
    } catch (error) {
        console.error('Error initializing AI Assistant:', error);
        // Fallback to basic functionality
        console.log('Falling back to basic AI Assistant functionality...');
        testAIAssistantElements();
    }

    initMobileResponsive(); // Initialize mobile responsive features
});

// About Section Story Navigation
function initAboutSection() {
    const storyNavs = document.querySelectorAll('.story-nav');
    const storyContents = document.querySelectorAll('.story-content');
    
    // Check if elements exist
    if (!storyNavs.length || !storyContents.length) {
        console.log('About section elements not found, skipping about section initialization');
        return;
    }
    
    storyNavs.forEach(nav => {
        nav.addEventListener('click', () => {
            const story = nav.dataset.story;
            
            // Remove active classes
            storyNavs.forEach(n => n.classList.remove('active'));
            storyContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked nav and corresponding content
            nav.classList.add('active');
            const targetContent = document.querySelector(`.story-content[data-story="${story}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}





// Insights Section Navigation
function initInsightsSection() {
    const navFilters = document.querySelectorAll('.nav-filter');
    const insightCards = document.querySelectorAll('.insight-card');
    
    // Check if elements exist
    if (!navFilters.length || !insightCards.length) {
        console.log('Insights section elements not found, skipping insights section initialization');
        return;
    }
    
    navFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            const category = filter.dataset.filter;
            
            // Remove active classes
            navFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            
            // Filter cards
            insightCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        if (card.style.opacity === '0') {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });
    });
}
// Onboarding Flow
function openOnboarding() {
    document.getElementById('onboardingModal').style.display = 'block';
    document.getElementById('step1').classList.add('active');
    document.getElementById('progressFill').style.width = '33%';
}

function closeOnboarding() {
    document.getElementById('onboardingModal').style.display = 'none';
    // Reset state
    document.querySelectorAll('.business-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector('.btn-continue').disabled = true;
    document.getElementById('progressFill').style.width = '0';
}

function selectBusinessType(type) {
    document.querySelectorAll('.business-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`.business-type-card[onclick*="${type}"]`);
    selectedCard.classList.add('selected');
    document.querySelector('.btn-continue').disabled = false;
}

function nextStep() {
    // For now, just close the modal since we only have step 1
    // In a full implementation, you would show the next step
    closeOnboarding();
}

// Add click event listener to all "Start Free Trial" buttons
document.querySelectorAll('.cta-button, .primary-cta').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'onboarding.html';
    });
});

// Workflow Demo Animation
function startWorkflowDemo() {
    const timer = document.getElementById('workflow-timer');
    const steps = document.querySelectorAll('.action-step');
    const spinners = document.querySelectorAll('.processing-indicator .spinner');
    
    let seconds = 0;
    const interval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timer.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds >= 52) {
            clearInterval(interval);
            spinners.forEach(spinner => spinner.style.display = 'none');
        }
    }, 100); // Speed up for demo
}

// Module switching is now handled in initModules() function above

// Scenario tab switching
function switchScenario(scenario) {
    document.querySelectorAll('.scenario-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelector(`[data-scenario="${scenario}"]`).classList.add('active');
    
    // You can add different workflow demos for different scenarios here
    startWorkflowDemo();
}

// Module navigation event listeners are now handled in initModules()
// Scenario tabs event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Scenario tabs
    document.querySelectorAll('.scenario-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const scenario = this.getAttribute('data-scenario');
            switchScenario(scenario);
        });
    });

    // Start workflow demo when integration section comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startWorkflowDemo();
                observer.unobserve(entry.target); // Only run once
            }
        });
    });

    const workflowDemo = document.querySelector('.workflow-demo');
    if (workflowDemo) {
        observer.observe(workflowDemo);
    }
});

// Demo functionality for Rise module
document.addEventListener('DOMContentLoaded', function() {
    // Handle demo link clicks
    const demoLinks = document.querySelectorAll('.demo-link');
    
    demoLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if this is the Rise module demo
            const riseModule = this.closest('[data-module="rise"]');
            if (riseModule) {
                toggleRiseDemo(riseModule);
            }
        });
    });
    
    function toggleRiseDemo(riseModule) {
        const dashboardFrame = riseModule.querySelector('.dashboard-frame');
        const demoLink = riseModule.querySelector('.demo-link');
        
        if (!dashboardFrame || !demoLink) return;
        
        // Check if demo is currently showing
        const currentContent = dashboardFrame.innerHTML;
        const isShowingDemo = currentContent.includes('supademo.com');
        
        if (isShowingDemo) {
            // Switch back to screenshot with frame
            dashboardFrame.innerHTML = `
                <div class="frame-header">
                    <div class="frame-controls">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="frame-title">Rise Dashboard</div>
                </div>
                <div class="frame-content">
                    <img src="assets/screenshots/rise_dashboard.png" alt="Rise CRM Dashboard">
                </div>
            `;
            demoLink.textContent = 'View Demo';
            demoLink.classList.remove('showing-demo');
        } else {
            // Switch to interactive demo without any container
            dashboardFrame.innerHTML = `
                <iframe src="https://app.supademo.com/embed/cmd8gcbfx7ma7c4kjzlk05sj9?embed_v=2" 
                        loading="lazy" 
                        title="How to manage your leads and quotations effectively" 
                        allow="clipboard-write" 
                        frameborder="0" 
                        webkitallowfullscreen="true" 
                        mozallowfullscreen="true" 
                        allowfullscreen 
                        style="width: 100%; height: 100%; min-height: 400px; border: none; border-radius: 16px; display: block;">
                </iframe>
            `;
            demoLink.textContent = 'View Screenshot';
            demoLink.classList.add('showing-demo');
        }
    }
});

// Enhanced AI Intelligence Hub with Organic Flow Layout
class OrganicFlowAIHub {
    constructor() {
        this.isActive = false;
        this.updateIntervals = [];
        this.animationFrames = [];
        
        // Enhanced data sets
        this.feedMessages = [
            { action: 'Production line 3 efficiency ↑ 12%', impact: '+₹3,600 gain', time: null },
            { action: 'Raw material procurement optimized', impact: '-₹8,200 saved', time: null },
            { action: 'Defect prediction model updated', impact: '+4.7% quality', time: null },
            { action: 'Predictive maintenance scheduled', impact: '48hrs prevented', time: null },
            { action: 'Auto-reorder triggered for Steel A', impact: 'Zero stockout', time: null },
            { action: 'Power consumption optimized', impact: '-₹1,800 saved', time: null },
            { action: 'Production schedule rebalanced', impact: '+6% throughput', time: null },
            { action: 'Alternative supplier activated', impact: '15% faster', time: null }
        ];
        
        this.predictions = [
            { label: 'Machine B2 Maintenance', time: '68 hours', confidence: 96, icon: 'fas fa-wrench' },
            { label: 'Seasonal Demand Peak', time: 'Next month', confidence: 89, icon: 'fas fa-chart-trending-up' },
            { label: 'Supply Chain Disruption', time: '12 days', confidence: 93, icon: 'fas fa-truck' },
            { label: 'Quality Issue - Batch 447', time: '4 hours', confidence: 87, icon: 'fas fa-exclamation-triangle' },
            { label: 'Energy Cost Spike', time: 'Tomorrow 2PM', confidence: 91, icon: 'fas fa-bolt' }
        ];
        
        this.automationTasks = [
            { name: 'Production Schedule', status: 'executing', progress: 67 },
            { name: 'Material Reorder', status: 'pending', progress: 0 },
            { name: 'Quality Analysis', status: 'completed', progress: 100 },
            { name: 'Maintenance Windows', status: 'executing', progress: 23 },
            { name: 'Workload Balance', status: 'pending', progress: 0 }
        ];
        
        this.metrics = {
            decisionsPerMin: 2847,
            responseTime: 247,
            revenue: 47200,
            efficiency: 18.5
        };
        
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.initializeTimestamps();
        this.setupInteractiveElements();
        this.startParticleAnimations();
        this.setupHoverEffects();
    }

    setupIntersectionObserver() {
        const flowContainer = document.querySelector('.intelligence-flow-container');
        if (!flowContainer) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isActive) {
                    this.startRealTimeUpdates();
                    this.startFlowAnimations();
                } else if (!entry.isIntersecting && this.isActive) {
                    this.stopRealTimeUpdates();
                    this.stopFlowAnimations();
                }
            });
        }, { threshold: 0.2 });

        observer.observe(flowContainer);
    }

    initializeTimestamps() {
        this.feedMessages.forEach((message, index) => {
            message.time = this.generateTime(index * 30);
        });
    }

    generateTime(secondsAgo = 0) {
        const now = new Date();
        now.setSeconds(now.getSeconds() - secondsAgo);
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    setupInteractiveElements() {
        // Hub core interaction
        const hubCore = document.querySelector('.hub-core');
        if (hubCore) {
            hubCore.addEventListener('click', () => this.activateHubPulse());
        }

        // Node interactions
        const nodes = document.querySelectorAll('.intelligence-node');
        nodes.forEach((node, index) => {
            node.addEventListener('click', () => this.handleNodeClick(node, index));
            node.addEventListener('mouseenter', () => this.handleNodeHover(node));
        });

        // Floating panel interactions
        const panel = document.querySelector('.floating-status-panel');
        if (panel) {
            panel.addEventListener('click', () => this.refreshAllMetrics());
        }
    }

    startParticleAnimations() {
        this.animateParticles();
        this.animateStreamPaths();
    }

    animateParticles() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            const animate = () => {
                if (!this.isActive) return;
                
                const time = Date.now() * 0.001 + index * 2;
                const x = Math.sin(time * 0.5) * 30;
                const y = Math.cos(time * 0.3) * 20;
                const opacity = 0.4 + Math.sin(time * 2) * 0.3;
                
                particle.style.transform = `translate(${x}px, ${y}px)`;
                particle.style.opacity = opacity;
                
                this.animationFrames.push(requestAnimationFrame(animate));
            };
            setTimeout(animate, index * 1000);
        });
    }

    animateStreamPaths() {
        const paths = document.querySelectorAll('.stream-path');
        paths.forEach((path, index) => {
            const animate = () => {
                if (!this.isActive) return;
                
                const time = Date.now() * 0.002 + index * 1.5;
                const intensity = 0.6 + Math.sin(time) * 0.4;
                const scale = 1 + Math.sin(time * 1.5) * 0.2;
                
                path.style.opacity = intensity;
                path.style.transform = `translate(-50%, -50%) scaleX(${scale})`;
                
                this.animationFrames.push(requestAnimationFrame(animate));
            };
            animate();
        });
    }

    setupHoverEffects() {
        const nodes = document.querySelectorAll('.intelligence-node');
        nodes.forEach(node => {
            const glow = node.querySelector('.node-glow');
            node.addEventListener('mousemove', (e) => {
                const rect = node.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                if (glow) {
                    glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(126, 68, 238, 0.2) 0%, transparent 60%)`;
                }
            });
        });
    }

    handleNodeClick(node, index) {
        // Create ripple effect
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.top = '50%';
        ripple.style.left = '50%';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.background = 'rgba(126, 68, 238, 0.3)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'rippleExpand 0.6s ease-out forwards';
        
        node.style.position = 'relative';
        node.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
        
        // Trigger specific updates
        this.triggerNodeUpdate(index);
    }

    handleNodeHover(node) {
        const icon = node.querySelector('.node-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }, 300);
        }
    }

    activateHubPulse() {
        const hubCore = document.querySelector('.hub-core');
        const rings = document.querySelectorAll('.pulse-ring');
        
        if (hubCore) {
            hubCore.style.transform = 'scale(1.15)';
            hubCore.style.boxShadow = '0 30px 60px rgba(126, 68, 238, 0.8)';
            
            rings.forEach((ring, index) => {
                setTimeout(() => {
                    ring.style.animation = 'pulseRing 1s ease-out forwards';
                }, index * 200);
            });
            
            setTimeout(() => {
                hubCore.style.transform = 'scale(1)';
                hubCore.style.boxShadow = '0 20px 40px rgba(126, 68, 238, 0.4)';
            }, 800);
        }
    }

    startRealTimeUpdates() {
        this.isActive = true;
        
        // Staggered updates for natural feel
        this.updateIntervals.push(setInterval(() => this.updateLiveFeed(), 5000));
        this.updateIntervals.push(setInterval(() => this.updatePredictions(), 10000));
        this.updateIntervals.push(setInterval(() => this.updateAutomation(), 7000));
        this.updateIntervals.push(setInterval(() => this.updateMetrics(), 8000));
        this.updateIntervals.push(setInterval(() => this.updatePanelMetrics(), 3000));
        
        // Initial updates
        setTimeout(() => this.updateLiveFeed(), 1000);
        setTimeout(() => this.updatePredictions(), 2000);
        setTimeout(() => this.updateAutomation(), 3000);
    }

    startFlowAnimations() {
        this.animateFlowIndicators();
        this.animateNodeGlows();
    }

    animateFlowIndicators() {
        const indicators = document.querySelectorAll('.flow-indicator');
        indicators.forEach(indicator => {
            const animate = () => {
                if (!this.isActive) return;
                
                const time = Date.now() * 0.001;
                const opacity = 0.6 + Math.sin(time * 3) * 0.3;
                indicator.style.opacity = opacity;
                
                this.animationFrames.push(requestAnimationFrame(animate));
            };
            animate();
        });
    }

    animateNodeGlows() {
        const nodes = document.querySelectorAll('.intelligence-node');
        nodes.forEach((node, index) => {
            const glow = node.querySelector('.node-glow');
            if (!glow) return;
            
            const animate = () => {
                if (!this.isActive) return;
                
                const time = Date.now() * 0.001 + index * 2;
                const rotation = time * 20;
                glow.style.transform = `rotate(${rotation}deg)`;
                
                this.animationFrames.push(requestAnimationFrame(animate));
            };
            animate();
        });
    }

    stopRealTimeUpdates() {
        this.isActive = false;
        this.updateIntervals.forEach(interval => clearInterval(interval));
        this.updateIntervals = [];
    }

    stopFlowAnimations() {
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        this.animationFrames = [];
    }

    updateLiveFeed() {
        const feedContainer = document.querySelector('.live-feed-flow');
        if (!feedContainer) return;

        const randomMessage = this.feedMessages[Math.floor(Math.random() * this.feedMessages.length)];
        randomMessage.time = this.generateTime(Math.floor(Math.random() * 60));

        const newBubble = document.createElement('div');
        newBubble.className = 'feed-bubble active';
        newBubble.innerHTML = `
            <div class="bubble-content">
                <div class="action">${randomMessage.action}</div>
                <div class="impact positive">${randomMessage.impact}</div>
            </div>
            <div class="bubble-time">${randomMessage.time}</div>
        `;

        // Animate entrance
        newBubble.style.opacity = '0';
        newBubble.style.transform = 'translateY(-20px)';
        feedContainer.insertBefore(newBubble, feedContainer.firstChild);
        
        requestAnimationFrame(() => {
            newBubble.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            newBubble.style.opacity = '1';
            newBubble.style.transform = 'translateY(0)';
        });

        // Remove old bubbles
        const bubbles = feedContainer.querySelectorAll('.feed-bubble');
        if (bubbles.length > 2) {
            bubbles[bubbles.length - 1].style.transition = 'all 0.3s ease';
            bubbles[bubbles.length - 1].style.opacity = '0';
            bubbles[bubbles.length - 1].style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (bubbles[bubbles.length - 1].parentNode) {
                    bubbles[bubbles.length - 1].remove();
                }
            }, 300);
        }
    }

    updatePredictions() {
        const predictionBubbles = document.querySelectorAll('.prediction-bubble');
        
        predictionBubbles.forEach((bubble, index) => {
            if (this.predictions[index]) {
                const prediction = this.predictions[index];
                prediction.confidence += (Math.random() - 0.5) * 2;
                prediction.confidence = Math.max(85, Math.min(97, prediction.confidence));
                
                const confBar = bubble.querySelector('.conf-bar');
                const confText = bubble.querySelector('.confidence-indicator span');
                
                if (confBar && confText) {
                    confBar.style.width = `${prediction.confidence}%`;
                    confText.textContent = `${Math.round(prediction.confidence)}%`;
                    
                    // Add glow effect
                    bubble.style.boxShadow = '0 8px 25px rgba(126, 68, 238, 0.3)';
                    setTimeout(() => {
                        bubble.style.boxShadow = '';
                    }, 1000);
                }
            }
        });
    }

    updateAutomation() {
        this.automationTasks.forEach(task => {
            if (task.status === 'executing') {
                task.progress += Math.random() * 10 + 2;
                if (task.progress >= 100) {
                    task.progress = 100;
                    task.status = 'completed';
                }
            }
        });

        // Start new tasks randomly
        if (Math.random() < 0.3) {
            const pendingTasks = this.automationTasks.filter(task => task.status === 'pending');
            if (pendingTasks.length > 0) {
                pendingTasks[0].status = 'executing';
                pendingTasks[0].progress = Math.random() * 15;
            }
        }

        // Update DOM
        const automationTasks = document.querySelectorAll('.automation-task');
        automationTasks.forEach((taskElement, index) => {
            if (this.automationTasks[index]) {
                const task = this.automationTasks[index];
                const waveDiv = taskElement.querySelector('.wave-fill');
                const progressText = taskElement.querySelector('.progress-text');
                const taskIcon = taskElement.querySelector('.task-icon');
                
                taskElement.className = `automation-task ${task.status}`;
                
                if (task.status === 'executing' && waveDiv && progressText) {
                    waveDiv.style.width = `${task.progress}%`;
                    progressText.textContent = `${Math.round(task.progress)}%`;
                    taskIcon.innerHTML = '<i class="fas fa-cog fa-spin"></i>';
                } else if (task.status === 'completed') {
                    taskIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                } else {
                    taskIcon.innerHTML = '<i class="fas fa-clock"></i>';
                }
            }
        });
    }

    updateMetrics() {
        // Update metric bubbles
        this.metrics.revenue += Math.floor(Math.random() * 2000) + 500;
        this.metrics.efficiency += (Math.random() - 0.5) * 1;
        this.metrics.efficiency = Math.max(16, Math.min(22, this.metrics.efficiency));

        const metricBubbles = document.querySelectorAll('.metric-bubble');
        metricBubbles.forEach(bubble => {
            const value = bubble.querySelector('.metric-value');
            if (value && value.textContent.includes('₹')) {
                value.textContent = `+₹${this.metrics.revenue.toLocaleString()}`;
                this.animateMetricUpdate(value);
            } else if (value && value.textContent.includes('%')) {
                value.textContent = `+${this.metrics.efficiency.toFixed(1)}%`;
                this.animateMetricUpdate(value);
            }
        });
    }

    updatePanelMetrics() {
        this.metrics.decisionsPerMin += Math.floor(Math.random() * 30) - 15;
        this.metrics.decisionsPerMin = Math.max(2500, Math.min(3200, this.metrics.decisionsPerMin));
        
        this.metrics.responseTime += Math.floor(Math.random() * 20) - 10;
        this.metrics.responseTime = Math.max(200, Math.min(300, this.metrics.responseTime));

        const decisionsCounter = document.getElementById('decisions-count-flow');
        const responseCounter = document.getElementById('response-time-flow');

        if (decisionsCounter) {
            decisionsCounter.textContent = this.metrics.decisionsPerMin.toLocaleString();
            this.animateMetricUpdate(decisionsCounter);
        }

        if (responseCounter) {
            responseCounter.textContent = `${this.metrics.responseTime}ms`;
            this.animateMetricUpdate(responseCounter);
        }
    }

    animateMetricUpdate(element) {
        element.style.transform = 'scale(1.1)';
        element.style.color = '#10b981';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 300);
    }

    triggerNodeUpdate(index) {
        switch(index) {
            case 0:
                this.updateLiveFeed();
                break;
            case 1:
                this.updatePredictions();
                break;
            case 2:
                this.updateAutomation();
                break;
            case 3:
                this.updateMetrics();
                break;
        }
    }

    refreshAllMetrics() {
        this.updateLiveFeed();
        this.updatePredictions();
        this.updateAutomation();
        this.updateMetrics();
        this.updatePanelMetrics();
        
        // Visual feedback
        const panel = document.querySelector('.floating-status-panel');
        if (panel) {
            panel.style.transform = 'scale(1.05)';
            panel.style.boxShadow = '0 20px 40px rgba(126, 68, 238, 0.2)';
            setTimeout(() => {
                panel.style.transform = 'scale(1)';
                panel.style.boxShadow = '';
            }, 300);
        }
    }
}

// Initialize Organic Flow AI Hub when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OrganicFlowAIHub();
    
    // Enhanced node hover effects
    const nodes = document.querySelectorAll('.intelligence-node');
    nodes.forEach(node => {
        node.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.05)';
            this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        node.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
    });
    
    // Floating panel hover effect
    const panel = document.querySelector('.floating-status-panel');
    if (panel) {
        panel.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        
        panel.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // Hub core enhanced interaction
    const hubCore = document.querySelector('.hub-core');
    if (hubCore) {
        hubCore.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 25px 50px rgba(126, 68, 238, 0.5)';
        });
        
        hubCore.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 20px 40px rgba(126, 68, 238, 0.4)';
        });
    }
});