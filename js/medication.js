// ============================================
// MEDICATION MANAGEMENT
// ============================================

class MedicationManager {
    constructor() {
        this.isEditMode = false;
        this.currentMedicationId = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.AuthManager.requireAuth()) {
            return;
        }

        // Display current user
        window.AuthManager.displayCurrentUser();

        // Check if editing existing medication
        this.checkEditMode();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize form
        this.initializeForm();
    }

    checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const medicationId = urlParams.get('id');
        
        if (medicationId) {
            this.isEditMode = true;
            this.currentMedicationId = medicationId;
            this.loadMedicationData(medicationId);
        }
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('medicationForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Frequency change
        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', (e) => this.updateTimeInputs(e.target.value));
        }

        // Voice input
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        }

        // Set start date to today by default
        const startDateInput = document.getElementById('startDate');
        if (startDateInput && !this.isEditMode) {
            startDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    initializeForm() {
        // Initialize time inputs based on default frequency
        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect && !this.isEditMode) {
            this.updateTimeInputs(frequencySelect.value);
        }
    }

    updateTimeInputs(frequency) {
        const timesContainer = document.getElementById('timesContainer');
        if (!timesContainer) return;

        // Handle special frequency types
        if (frequency === 'weekly') {
            this.createWeeklySchedule();
            return;
        }

        if (frequency === 'as-needed') {
            this.createAsNeededSchedule();
            return;
        }

        const count = parseInt(frequency);
        let defaultTimes = [];

        // Suggest default times based on frequency
        switch (count) {
            case 1:
                defaultTimes = ['09:00'];
                break;
            case 2:
                defaultTimes = ['09:00', '21:00'];
                break;
            case 3:
                defaultTimes = ['09:00', '14:00', '21:00'];
                break;
            case 4:
                defaultTimes = ['08:00', '14:00', '18:00', '22:00'];
                break;
            case 6:
                defaultTimes = ['08:00', '12:00', '16:00', '20:00', '00:00', '04:00'];
                break;
            default:
                defaultTimes = ['09:00'];
        }

        // Clear existing inputs
        timesContainer.innerHTML = '';

        // Create time inputs
        for (let i = 0; i < count; i++) {
            const timeInput = document.createElement('div');
            timeInput.className = 'time-input';
            timeInput.innerHTML = `
                <label for="time${i}">Time ${i + 1}</label>
                <input type="time" id="time${i}" name="time${i}" value="${defaultTimes[i] || '09:00'}" required>
            `;
            timesContainer.appendChild(timeInput);
        }
    }

    createWeeklySchedule() {
        const timesContainer = document.getElementById('timesContainer');
        if (!timesContainer) return;

        timesContainer.innerHTML = `
            <div class="weekly-schedule">
                <h3>Weekly Schedule</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="weeklyDay">Day of Week</label>
                        <select id="weeklyDay" name="weeklyDay" required>
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="weeklyTime">Time</label>
                        <input type="time" id="weeklyTime" name="weeklyTime" value="09:00" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="weeklyRecurring" name="weeklyRecurring" checked>
                        Repeat weekly
                    </label>
                </div>
            </div>
        `;
    }

    createAsNeededSchedule() {
        const timesContainer = document.getElementById('timesContainer');
        if (!timesContainer) return;

        timesContainer.innerHTML = `
            <div class="as-needed-schedule">
                <h3>As Needed (PRN)</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="maxDailyDoses">Maximum doses per day</label>
                        <input type="number" id="maxDailyDoses" name="maxDailyDoses" min="1" max="12" value="1" required>
                    </div>
                    <div class="form-group">
                        <label for="minInterval">Minimum interval between doses (hours)</label>
                        <input type="number" id="minInterval" name="minInterval" min="1" max="24" value="4" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="asNeededCondition">When to take</label>
                    <textarea id="asNeededCondition" name="asNeededCondition" rows="2" placeholder="e.g., For pain, For nausea, etc." required></textarea>
                </div>
            </div>
        `;
    }

    handleVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showError('Speech recognition not supported in this browser');
            return;
        }

        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');

        recognition.onstart = () => {
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Listening';
            voiceStatus.textContent = 'Listening... Please speak clearly';
            voiceBtn.classList.add('listening');
        };

        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            this.processVoiceInput(result);
        };

        recognition.onerror = (event) => {
            this.showError('Speech recognition error: ' + event.error);
            this.resetVoiceButton();
        };

        recognition.onend = () => {
            this.resetVoiceButton();
        };

        recognition.start();
    }

    processVoiceInput(transcript) {
        // Simple voice command processing
        const text = transcript.toLowerCase();
        
        // Extract medication name
        const nameMatch = text.match(/(?:medication|medicine|drug|pill|tablet) (?:is |called |named )?(.+?)(?:\s|$)/);
        if (nameMatch) {
            const nameInput = document.getElementById('medicineName');
            if (nameInput) {
                nameInput.value = nameMatch[1].trim();
            }
        }

        // Extract dosage
        const dosageMatch = text.match(/(\d+(?:\.\d+)?)\s*(mg|ml|tablets?|capsules?|drops?|tsp|tbsp)/);
        if (dosageMatch) {
            const amountInput = document.getElementById('dosageAmount');
            const unitSelect = document.getElementById('dosageUnit');
            
            if (amountInput) amountInput.value = dosageMatch[1];
            if (unitSelect) {
                // Map voice input to select options
                const unitMap = {
                    'milligram': 'mg',
                    'milligrams': 'mg',
                    'milliliter': 'ml',
                    'milliliters': 'ml',
                    'tablet': 'tablets',
                    'tablets': 'tablets',
                    'capsule': 'capsules',
                    'capsules': 'capsules',
                    'drop': 'drops',
                    'drops': 'drops',
                    'teaspoon': 'tsp',
                    'tablespoon': 'tbsp'
                };
                
                const unit = unitMap[dosageMatch[2]] || dosageMatch[2];
                unitSelect.value = unit;
            }
        }

        // Extract frequency
        const frequencyMatch = text.match(/(?:take|taken)\s+(?:it\s+)?(\d+)\s+times?\s+(?:a\s+)?(?:per\s+)?day/);
        if (frequencyMatch) {
            const frequencySelect = document.getElementById('frequency');
            if (frequencySelect) {
                frequencySelect.value = frequencyMatch[1];
                this.updateTimeInputs(frequencyMatch[1]);
            }
        }

        // Extract instructions
        const instructionsMatch = text.match(/(?:take|taken)\s+(?:it\s+)?(?:with|before|after|during)\s+(.+)/);
        if (instructionsMatch) {
            const instructionsInput = document.getElementById('instructions');
            if (instructionsInput) {
                instructionsInput.value = instructionsMatch[1].trim();
            }
        }

        this.showSuccess('Voice input processed successfully!');
    }

    resetVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (voiceBtn) {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Add by Voice';
            voiceBtn.classList.remove('listening');
        }
        
        if (voiceStatus) {
            voiceStatus.textContent = 'Click to start voice input';
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const medicationData = this.extractFormData(formData);
        
        // Validate form data
        if (!this.validateFormData(medicationData)) {
            return;
        }

        // Save medication directly
        this.saveMedication(medicationData);
    }

    saveMedication(medicationData) {
        // Save medication
        if (this.isEditMode) {
            this.updateMedication(medicationData);
        } else {
            this.addMedication(medicationData);
        }
    }

    extractFormData(formData) {
        const medication = {};
        
        // Basic information
        medication.medicineName = formData.get('medicineName').trim();
        medication.dosageAmount = parseFloat(formData.get('dosageAmount'));
        medication.dosageUnit = formData.get('dosageUnit');
        medication.frequency = formData.get('frequency'); // Keep as string to handle 'weekly' and 'as-needed'
        medication.startDate = formData.get('startDate');
        medication.endDate = formData.get('endDate');
        medication.instructions = formData.get('instructions')?.trim() || '';

        // Extract schedule based on frequency type
        if (medication.frequency === 'weekly') {
            medication.weeklyDay = formData.get('weeklyDay');
            medication.weeklyTime = formData.get('weeklyTime');
            medication.weeklyRecurring = formData.has('weeklyRecurring');
            medication.times = [medication.weeklyTime]; // Store as single time for compatibility
        } else if (medication.frequency === 'as-needed') {
            medication.maxDailyDoses = parseInt(formData.get('maxDailyDoses'));
            medication.minInterval = parseInt(formData.get('minInterval'));
            medication.asNeededCondition = formData.get('asNeededCondition')?.trim() || '';
            medication.times = []; // No fixed times for as-needed
        } else {
            // Regular daily frequency
            const frequencyCount = parseInt(medication.frequency);
            medication.times = [];
            for (let i = 0; i < frequencyCount; i++) {
                const time = formData.get(`time${i}`);
                if (time) {
                    medication.times.push(time);
                }
            }
        }

        return medication;
    }

    validateFormData(medication) {
        // Required fields
        if (!medication.medicineName) {
            this.showError('Medicine name is required');
            return false;
        }

        if (!medication.dosageAmount || medication.dosageAmount <= 0) {
            this.showError('Valid dosage amount is required');
            return false;
        }

        if (!medication.startDate) {
            this.showError('Start date is required');
            return false;
        }

        if (!medication.endDate) {
            this.showError('End date is required');
            return false;
        }

        // Date validation
        const startDate = new Date(medication.startDate);
        const endDate = new Date(medication.endDate);
        
        if (endDate <= startDate) {
            this.showError('End date must be after start date');
            return false;
        }

        // Frequency-specific validation
        if (medication.frequency === 'weekly') {
            if (!medication.weeklyDay) {
                this.showError('Please select a day of the week');
                return false;
            }
            if (!medication.weeklyTime) {
                this.showError('Please specify the weekly time');
                return false;
            }
        } else if (medication.frequency === 'as-needed') {
            if (!medication.maxDailyDoses || medication.maxDailyDoses <= 0) {
                this.showError('Please specify maximum daily doses');
                return false;
            }
            if (!medication.minInterval || medication.minInterval <= 0) {
                this.showError('Please specify minimum interval between doses');
                return false;
            }
            if (!medication.asNeededCondition) {
                this.showError('Please specify when to take this medication');
                return false;
            }
        } else {
            // Regular daily frequency validation
            const frequencyCount = parseInt(medication.frequency);
            if (medication.times.length !== frequencyCount) {
                this.showError('Please specify all medication times');
                return false;
            }
        }

        return true;
    }

    addMedication(medicationData) {
        const success = window.StorageManager.addMedication(medicationData);
        
        if (success) {
            this.showSuccess('Medication added successfully!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            this.showError('Failed to add medication');
        }
    }

    updateMedication(medicationData) {
        const success = window.StorageManager.updateMedication(this.currentMedicationId, medicationData);
        
        if (success) {
            this.showSuccess('Medication updated successfully!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            this.showError('Failed to update medication');
        }
    }

    loadMedicationData(medicationId) {
        const medication = window.StorageManager.getMedicationById(medicationId);
        if (!medication) {
            this.showError('Medication not found');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }

        // Update page title
        const titleElement = document.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = 'Edit Medication';
        }

        // Populate form fields
        this.populateForm(medication);
    }

    populateForm(medication) {
        // Basic information
        const nameInput = document.getElementById('medicineName');
        if (nameInput) nameInput.value = medication.medicineName || '';

        const dosageAmountInput = document.getElementById('dosageAmount');
        if (dosageAmountInput) dosageAmountInput.value = medication.dosageAmount || '';

        const dosageUnitSelect = document.getElementById('dosageUnit');
        if (dosageUnitSelect) dosageUnitSelect.value = medication.dosageUnit || 'mg';

        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect) {
            frequencySelect.value = medication.frequency || 1;
            this.updateTimeInputs(medication.frequency || 1);
        }

        const startDateInput = document.getElementById('startDate');
        if (startDateInput) startDateInput.value = medication.startDate || '';

        const endDateInput = document.getElementById('endDate');
        if (endDateInput) endDateInput.value = medication.endDate || '';

        const instructionsInput = document.getElementById('instructions');
        if (instructionsInput) instructionsInput.value = medication.instructions || '';

        // Populate times after inputs are created
        setTimeout(() => {
            if (medication.times) {
                medication.times.forEach((time, index) => {
                    const timeInput = document.getElementById(`time${index}`);
                    if (timeInput) timeInput.value = time;
                });
            }
        }, 100);

        // Show image if exists
        if (medication.image) {
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.innerHTML = `<img src="${medication.image}" alt="Medication Image">`;
            }
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.form-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create alert
        const alert = document.createElement('div');
        alert.className = `form-alert alert-${type}`;
        
        const bgColor = type === 'success' ? '#28a745' : '#dc3545';
        const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
        
        alert.innerHTML = `
            <div style="background: ${bgColor}; color: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        // Insert alert at top of form
        const form = document.querySelector('.medication-form');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }

        // Remove alert after 5 seconds
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }
}

// Initialize medication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicationManager();
});

// Add CSS for voice button animation
const style = document.createElement('style');
style.textContent = `
    .btn.listening {
        animation: pulse 1.5s ease-in-out infinite;
        background: #dc3545 !important;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
