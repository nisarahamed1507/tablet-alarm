// ============================================
// VOICE RECOGNITION SYSTEM
// ============================================

class VoiceManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.languages = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'hi-IN': 'Hindi (India)',
            'te-IN': 'Telugu (India)',
            'ta-IN': 'Tamil (India)',
            'bn-IN': 'Bengali (India)',
            'mr-IN': 'Marathi (India)',
            'gu-IN': 'Gujarati (India)',
            'kn-IN': 'Kannada (India)',
            'ml-IN': 'Malayalam (India)',
            'or-IN': 'Odia (India)',
            'pa-IN': 'Punjabi (India)',
            'ur-IN': 'Urdu (India)'
        };
        this.currentLanguage = 'en-US';
        this.init();
    }

    init() {
        this.checkSupport();
        this.setupRecognition();
    }

    checkSupport() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.isSupported = true;
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    setupRecognition() {
        if (!this.isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = this.currentLanguage;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.onStart();
        };

        this.recognition.onresult = (event) => {
            const results = [];
            for (let i = 0; i < event.results.length; i++) {
                for (let j = 0; j < event.results[i].length; j++) {
                    results.push({
                        transcript: event.results[i][j].transcript,
                        confidence: event.results[i][j].confidence
                    });
                }
            }
            this.onResult(results);
        };

        this.recognition.onerror = (event) => {
            this.onError(event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onEnd();
        };
    }

    startListening(options = {}) {
        if (!this.isSupported) {
            this.onError('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
            return false;
        }

        // Set options
        if (options.language) {
            this.recognition.lang = options.language;
            this.currentLanguage = options.language;
        }

        if (options.continuous !== undefined) {
            this.recognition.continuous = options.continuous;
        }

        if (options.interimResults !== undefined) {
            this.recognition.interimResults = options.interimResults;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            this.onError(error.message);
            return false;
        }
    }

    stopListening() {
        if (this.isListening && this.recognition) {
            this.recognition.stop();
        }
    }

    // Voice command processing for medication management
    processMedicationCommand(transcript) {
        const text = transcript.toLowerCase();
        const command = {
            action: null,
            medication: null,
            dosage: null,
            frequency: null,
            times: [],
            instructions: null
        };

        // Action detection
        if (text.includes('add') || text.includes('create') || text.includes('new')) {
            command.action = 'add';
        } else if (text.includes('take') || text.includes('taken')) {
            command.action = 'take';
        } else if (text.includes('miss') || text.includes('missed')) {
            command.action = 'miss';
        } else if (text.includes('edit') || text.includes('update') || text.includes('change')) {
            command.action = 'edit';
        } else if (text.includes('delete') || text.includes('remove')) {
            command.action = 'delete';
        } else if (text.includes('show') || text.includes('list') || text.includes('display')) {
            command.action = 'show';
        }

        // Medication name extraction
        const medicationPatterns = [
            /(?:medication|medicine|drug|pill|tablet|capsule) (?:called|named|is) (.+?)(?:\s|$)/,
            /(?:take|taking|add|adding) (.+?)(?:\s(?:tablet|pill|capsule|mg|ml)|$)/,
            /mark (.+?) as (?:taken|missed)/
        ];

        for (const pattern of medicationPatterns) {
            const match = text.match(pattern);
            if (match) {
                command.medication = this.cleanMedicationName(match[1]);
                break;
            }
        }

        // Dosage extraction
        const dosageMatch = text.match(/(\d+(?:\.\d+)?)\s*(mg|ml|milligrams?|milliliters?|tablets?|capsules?|drops?|teaspoons?|tablespoons?|tsp|tbsp)/i);
        if (dosageMatch) {
            command.dosage = {
                amount: parseFloat(dosageMatch[1]),
                unit: this.normalizeUnit(dosageMatch[2])
            };
        }

        // Frequency extraction
        const frequencyPatterns = [
            /(\d+)\s*times?\s*(?:a\s*|per\s*)?day/i,
            /once\s*(?:a\s*|per\s*)?day/i,
            /twice\s*(?:a\s*|per\s*)?day/i,
            /three\s*times\s*(?:a\s*|per\s*)?day/i,
            /four\s*times\s*(?:a\s*|per\s*)?day/i
        ];

        for (const pattern of frequencyPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[0].includes('once')) {
                    command.frequency = 1;
                } else if (match[0].includes('twice')) {
                    command.frequency = 2;
                } else if (match[0].includes('three')) {
                    command.frequency = 3;
                } else if (match[0].includes('four')) {
                    command.frequency = 4;
                } else {
                    command.frequency = parseInt(match[1]);
                }
                break;
            }
        }

        // Time extraction
        const timePatterns = [
            /at (\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi,
            /(\d{1,2})\s*(?:o'clock|oclock)/gi,
            /(?:morning|afternoon|evening|night)/gi
        ];

        for (const pattern of timePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const time = this.parseTime(match);
                    if (time) {
                        command.times.push(time);
                    }
                });
            }
        }

        // Instructions extraction
        const instructionPatterns = [
            /(?:take|taking)\s+(?:it\s+)?(?:with|before|after|during)\s+(.+)/,
            /(?:instruction|instructions?):\s*(.+)/,
            /(?:note|notes?):\s*(.+)/
        ];

        for (const pattern of instructionPatterns) {
            const match = text.match(pattern);
            if (match) {
                command.instructions = match[1].trim();
                break;
            }
        }

        return command;
    }

    cleanMedicationName(name) {
        // Remove common words and clean up
        const cleanName = name
            .replace(/\b(?:tablet|pill|capsule|mg|ml|milligrams?|milliliters?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Capitalize first letter of each word
        return cleanName.replace(/\b\w/g, l => l.toUpperCase());
    }

    normalizeUnit(unit) {
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
            'teaspoons': 'tsp',
            'tablespoon': 'tbsp',
            'tablespoons': 'tbsp'
        };
        
        return unitMap[unit.toLowerCase()] || unit.toLowerCase();
    }

    parseTime(timeStr) {
        const cleanTime = timeStr.toLowerCase().replace(/at\s+/, '').trim();
        
        // Handle named times
        const namedTimes = {
            'morning': '09:00',
            'afternoon': '14:00',
            'evening': '18:00',
            'night': '21:00'
        };
        
        if (namedTimes[cleanTime]) {
            return namedTimes[cleanTime];
        }
        
        // Handle "o'clock" format
        const oclockMatch = cleanTime.match(/(\d{1,2})\s*(?:o'clock|oclock)/);
        if (oclockMatch) {
            const hour = parseInt(oclockMatch[1]);
            return `${hour.toString().padStart(2, '0')}:00`;
        }
        
        // Handle AM/PM format
        const ampmMatch = cleanTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
        if (ampmMatch) {
            let hour = parseInt(ampmMatch[1]);
            const minute = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
            const period = ampmMatch[3];
            
            if (period === 'pm' && hour !== 12) {
                hour += 12;
            } else if (period === 'am' && hour === 12) {
                hour = 0;
            }
            
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        
        return null;
    }

    // Execute voice command
    executeCommand(command) {
        if (!command.action) return false;

        switch (command.action) {
            case 'add':
                return this.executeAddCommand(command);
            case 'take':
                return this.executeTakeCommand(command);
            case 'miss':
                return this.executeMissCommand(command);
            case 'show':
                return this.executeShowCommand(command);
            default:
                return false;
        }
    }

    executeAddCommand(command) {
        // Navigate to add medication page and pre-fill form
        const params = new URLSearchParams();
        
        if (command.medication) {
            params.append('name', command.medication);
        }
        
        if (command.dosage) {
            params.append('amount', command.dosage.amount);
            params.append('unit', command.dosage.unit);
        }
        
        if (command.frequency) {
            params.append('frequency', command.frequency);
        }
        
        if (command.times.length > 0) {
            params.append('times', command.times.join(','));
        }
        
        if (command.instructions) {
            params.append('instructions', command.instructions);
        }
        
        window.location.href = `add-medication.html?${params.toString()}`;
        return true;
    }

    executeTakeCommand(command) {
        if (!command.medication) return false;

        // Find medication by name
        const medications = window.StorageManager.getMedications();
        const medication = medications.find(med => 
            med.medicineName.toLowerCase().includes(command.medication.toLowerCase())
        );

        if (medication) {
            window.StorageManager.markMedicationAsTaken(medication.id);
            this.onCommandSuccess(`Marked ${medication.medicineName} as taken`);
            return true;
        } else {
            this.onCommandError(`Medication "${command.medication}" not found`);
            return false;
        }
    }

    executeMissCommand(command) {
        if (!command.medication) return false;

        // Find medication by name
        const medications = window.StorageManager.getMedications();
        const medication = medications.find(med => 
            med.medicineName.toLowerCase().includes(command.medication.toLowerCase())
        );

        if (medication) {
            window.StorageManager.markMedicationAsMissed(medication.id);
            this.onCommandSuccess(`Marked ${medication.medicineName} as missed`);
            return true;
        } else {
            this.onCommandError(`Medication "${command.medication}" not found`);
            return false;
        }
    }

    executeShowCommand(command) {
        if (command.medication) {
            // Show specific medication details
            const medications = window.StorageManager.getMedications();
            const medication = medications.find(med => 
                med.medicineName.toLowerCase().includes(command.medication.toLowerCase())
            );

            if (medication) {
                this.onCommandSuccess(`${medication.medicineName}: ${medication.dosageAmount} ${medication.dosageUnit}, ${medication.frequency} times daily`);
                return true;
            } else {
                this.onCommandError(`Medication "${command.medication}" not found`);
                return false;
            }
        } else {
            // Show all medications
            window.location.href = 'dashboard.html';
            return true;
        }
    }

    // Event handlers (to be overridden)
    onStart() {
        console.log('Voice recognition started');
    }

    onResult(results) {
        console.log('Voice recognition results:', results);
        
        if (results.length > 0) {
            const bestResult = results[0];
            const command = this.processMedicationCommand(bestResult.transcript);
            
            if (command.action) {
                this.executeCommand(command);
            } else {
                this.onCommandError('Could not understand the command');
            }
        }
    }

    onError(error) {
        console.error('Voice recognition error:', error);
        
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone access denied or unavailable.',
            'not-allowed': 'Speech recognition not allowed. Please enable microphone access.',
            'network': 'Network error. Please check your connection.',
            'service-not-allowed': 'Speech recognition service not available.'
        };
        
        const message = errorMessages[error] || `Speech recognition error: ${error}`;
        this.onCommandError(message);
    }

    onEnd() {
        console.log('Voice recognition ended');
    }

    onCommandSuccess(message) {
        console.log('Voice command success:', message);
        
        // Show success toast
        if (window.NotificationManager) {
            window.NotificationManager.showAlarmSuccess(message);
        }
    }

    onCommandError(message) {
        console.error('Voice command error:', message);
        
        // Show error toast
        if (window.NotificationManager) {
            window.NotificationManager.showAlarmError(message);
        }
    }

    // Utility methods
    setLanguage(languageCode) {
        if (this.languages[languageCode]) {
            this.currentLanguage = languageCode;
            if (this.recognition) {
                this.recognition.lang = languageCode;
            }
            return true;
        }
        return false;
    }

    getAvailableLanguages() {
        return this.languages;
    }

    isCurrentlyListening() {
        return this.isListening;
    }

    isVoiceSupported() {
        return this.isSupported;
    }

    // Test voice recognition
    testVoice() {
        if (!this.isSupported) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        this.onStart = () => {
            console.log('Test: Voice recognition started');
        };

        this.onResult = (results) => {
            console.log('Test: Voice recognition results:', results);
            alert(`You said: "${results[0].transcript}"`);
        };

        this.onError = (error) => {
            console.error('Test: Voice recognition error:', error);
            alert(`Error: ${error}`);
        };

        this.onEnd = () => {
            console.log('Test: Voice recognition ended');
        };

        this.startListening();
    }
}

// Initialize voice manager
const voiceManager = new VoiceManager();

// Export for use in other files
window.VoiceManager = voiceManager;
