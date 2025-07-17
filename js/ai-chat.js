// ============================================
// AI ASSISTANT CHAT SYSTEM
// ============================================

class AIChatManager {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.AuthManager.requireAuth()) {
            return;
        }

        // Display current user
        window.AuthManager.displayCurrentUser();

        // Setup event listeners
        this.setupEventListeners();
        
        // Load chat history
        this.loadChatHistory();
        
        // Initialize chat
        this.initializeChat();
    }

    setupEventListeners() {
        // Chat form submission
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
        }

        // Clear chat button
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }

        // Voice input button
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => this.handleVoiceInput());
        }

        // Auto-resize textarea
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('input', this.autoResizeTextarea);
        }
    }

    initializeChat() {
        // Add welcome message if chat is empty
        if (this.chatHistory.length === 0) {
            this.addMessage('ai', 'Hello! I\'m your AI assistant. I can help you with medication reminders, health questions, and managing your tablet alarm app. How can I assist you today?');
        }
        
        this.scrollToBottom();
    }

    loadChatHistory() {
        const currentUser = window.AuthManager.getCurrentUser();
        if (currentUser) {
            const saved = localStorage.getItem(`aiChatHistory_${currentUser}`);
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                this.renderChatHistory();
            }
        }
    }

    saveChatHistory() {
        const currentUser = window.AuthManager.getCurrentUser();
        if (currentUser) {
            localStorage.setItem(`aiChatHistory_${currentUser}`, JSON.stringify(this.chatHistory));
        }
    }

    handleChatSubmit(event) {
        event.preventDefault();
        
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Process AI response
        this.processAIResponse(message);
    }

    addMessage(type, message) {
        const messageObj = {
            type: type,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.push(messageObj);
        this.renderMessage(messageObj);
        this.saveChatHistory();
        this.scrollToBottom();
    }

    renderMessage(messageObj) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${messageObj.type}-message`;
        
        const time = new Date(messageObj.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(messageObj.message)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        chatContainer.appendChild(messageElement);
    }

    renderChatHistory() {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        chatContainer.innerHTML = '';
        this.chatHistory.forEach(messageObj => {
            this.renderMessage(messageObj);
        });
    }

    formatMessage(message) {
        // Simple formatting for links, bold, etc.
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    processAIResponse(userMessage) {
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI processing time
        setTimeout(() => {
            this.hideTypingIndicator();
            
            // Generate AI response based on user message
            const aiResponse = this.generateAIResponse(userMessage);
            this.addMessage('ai', aiResponse);
        }, 1000 + Math.random() * 2000); // 1-3 seconds delay
    }

    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Medical and medication related responses
        if (message.includes('medication') || message.includes('medicine') || message.includes('pill')) {
            return this.getMedicationResponse(message);
        }
        
        // Health related responses
        if (message.includes('health') || message.includes('symptom') || message.includes('pain')) {
            return this.getHealthResponse(message);
        }
        
        // App related responses
        if (message.includes('alarm') || message.includes('reminder') || message.includes('schedule')) {
            return this.getAppResponse(message);
        }
        
        // Exercise related responses
        if (message.includes('exercise') || message.includes('workout') || message.includes('fitness')) {
            return this.getExerciseResponse(message);
        }
        
        // Appointment related responses
        if (message.includes('appointment') || message.includes('doctor') || message.includes('visit')) {
            return this.getAppointmentResponse(message);
        }
        
        // Default responses
        return this.getDefaultResponse(message);
    }

    getMedicationResponse(message) {
        const responses = [
            "I can help you manage your medications! You can add new medications, set reminders, and track your dosages using the app. Would you like me to guide you through adding a new medication?",
            "It's important to take medications as prescribed. If you've missed a dose, check with your doctor or pharmacist about what to do. You can use the app to set multiple daily reminders.",
            "For medication management, I recommend setting up all your medications in the app with proper dosage times. The app will remind you and help you track your medication history.",
            "Remember to never stop taking prescribed medications without consulting your doctor. The app can help you stay consistent with your medication schedule."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getHealthResponse(message) {
        const responses = [
            "I'm not a medical professional, but I can help you track your health information using this app. For medical advice, always consult with your healthcare provider.",
            "It's great that you're paying attention to your health! Consider tracking your symptoms and medications in the app, and share this information with your doctor.",
            "While I can't provide medical diagnosis, I can help you organize your health information. Would you like help setting up medication reminders or scheduling appointments?",
            "For any health concerns, please consult with a qualified healthcare professional. I'm here to help you stay organized with your medications and appointments."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getAppResponse(message) {
        const responses = [
            "This app helps you manage medications, set reminders, track exercises, and schedule appointments. You can also export your data and use voice commands!",
            "The alarm system will notify you when it's time to take your medications. You can snooze for 5 minutes up to 3 times, and mark doses as taken or missed.",
            "You can customize your medication schedules, add photos of your pills, and even use voice commands to interact with the app. What would you like to set up?",
            "The app syncs all your data locally and allows family members to access shared information using the same username. Your privacy and data are secure."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getExerciseResponse(message) {
        const responses = [
            "Regular exercise is great for your health! You can track your workouts and set exercise reminders using the Exercise section of the app.",
            "I can help you plan and track your exercise routine. You can add different types of exercises, set schedules, and monitor your progress.",
            "Exercise is important for overall health, especially when managing medications. Some medications work better with regular physical activity.",
            "You can set up exercise reminders just like medication reminders. Consistency is key to building healthy habits!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getAppointmentResponse(message) {
        const responses = [
            "You can schedule and track doctor appointments using the Calendar section. The app will remind you of upcoming appointments.",
            "It's important to keep regular appointments with your healthcare providers. You can add appointment details, notes, and set reminders.",
            "The calendar view shows all your appointments and medication schedules in one place. This helps you prepare for doctor visits.",
            "Remember to bring your medication list and any questions to your appointments. The app can help you export this information."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getDefaultResponse(message) {
        const responses = [
            "I'm here to help you with medication management, health tracking, and using this app effectively. What would you like to know more about?",
            "That's an interesting question! I'm specialized in helping with medication reminders, health tracking, and app features. How can I assist you today?",
            "I'd be happy to help! I can guide you through setting up medications, scheduling appointments, tracking exercises, or using any app features.",
            "Thanks for chatting with me! I'm designed to help you stay healthy and organized. Is there something specific about your medications or health routine you'd like help with?",
            "I'm your personal health assistant for this app. I can help you manage medications, set reminders, track activities, and organize your health information."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showTypingIndicator() {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'chat-message ai-message typing-indicator';
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(typingElement);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingElement = document.getElementById('typingIndicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.chatHistory = [];
            this.saveChatHistory();
            
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                chatContainer.innerHTML = '';
            }
            
            this.initializeChat();
        }
    }

    handleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        const voiceBtn = document.getElementById('voiceInputBtn');
        const chatInput = document.getElementById('chatInput');

        recognition.onstart = () => {
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            voiceBtn.classList.add('listening');
        };

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            chatInput.value = result;
            this.handleChatSubmit(new Event('submit'));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.classList.remove('listening');
        };

        recognition.start();
    }

    autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Future integration placeholder for actual AI API
    async callGeminiAPI(message) {
        // This is a placeholder for future Gemini AI integration
        // For now, we use the local response generation
        console.log('Gemini API integration placeholder - message:', message);
        return 'This would be a response from Gemini AI';
    }
}

// Initialize AI chat manager
const aiChatManager = new AIChatManager();

// Export for use in other files
window.AIChatManager = aiChatManager;
