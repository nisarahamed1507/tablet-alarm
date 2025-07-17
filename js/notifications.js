// ============================================
// NOTIFICATION & ALARM SYSTEM
// ============================================

class NotificationManager {
    constructor() {
        this.alarms = new Map();
        this.notifications = new Map();
        this.audioContext = null;
        this.currentAlarm = null;
        this.snoozeCount = 0;
        this.maxSnoozes = 3;
        this.alarmDuration = 30000; // 30 seconds
        this.snoozeInterval = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    async init() {
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Initialize audio context
        this.initAudioContext();
        
        // Load settings
        this.loadSettings();
        
        // Start alarm scheduler
        this.startAlarmScheduler();
        
        // Set up alarm modal event listeners
        this.setupAlarmModalListeners();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }
            return Notification.permission === 'granted';
        }
        return false;
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }

    loadSettings() {
        const settings = window.StorageManager.getSettings();
        this.alarmDuration = (settings.alarmDuration || 30) * 1000;
        this.snoozeInterval = (settings.snoozeInterval || 5) * 60 * 1000;
        this.maxSnoozes = settings.maxSnoozes || 3;
    }

    startAlarmScheduler() {
        // Check for due medications every minute
        setInterval(() => {
            this.checkDueMedications();
        }, 60000);

        // Check immediately on start
        this.checkDueMedications();
    }

    checkDueMedications() {
        const medications = window.StorageManager.getMedications();
        const now = new Date();

        medications.forEach(medication => {
            if (!medication.isActive || !medication.times) return;

            // Check if medication is still within active period
            if (medication.endDate && new Date(medication.endDate) < now) {
                return;
            }

            medication.times.forEach(time => {
                const scheduledTime = new Date(`${now.toDateString()} ${time}`);
                const timeDiff = now.getTime() - scheduledTime.getTime();
                
                // If medication is due (within 1 minute window)
                if (timeDiff >= 0 && timeDiff <= 60000) {
                    this.triggerMedicationAlarm(medication, scheduledTime);
                }
            });
        });
    }

    triggerMedicationAlarm(medication, scheduledTime) {
        const alarmKey = `${medication.id}-${scheduledTime.getTime()}`;
        
        // Avoid duplicate alarms
        if (this.alarms.has(alarmKey)) {
            return;
        }

        // Create alarm
        const alarm = {
            id: alarmKey,
            medication: medication,
            scheduledTime: scheduledTime,
            triggeredTime: new Date(),
            snoozed: false,
            snoozeCount: 0
        };

        this.alarms.set(alarmKey, alarm);
        this.showAlarm(alarm);
    }

    showAlarm(alarm) {
        // Stop any current alarm
        this.stopCurrentAlarm();
        
        this.currentAlarm = alarm;
        
        // Show browser notification
        this.showBrowserNotification(alarm);
        
        // Play alarm sound
        this.playAlarmSound();
        
        // Show alarm modal
        this.showAlarmModal(alarm);
        
        // Auto-snooze after alarm duration
        setTimeout(() => {
            if (this.currentAlarm && this.currentAlarm.id === alarm.id) {
                this.autoSnooze(alarm);
            }
        }, this.alarmDuration);
    }

    showBrowserNotification(alarm) {
        if (Notification.permission === 'granted') {
            const notification = new Notification('Medication Reminder', {
                body: `Time to take ${alarm.medication.medicineName} (${alarm.medication.dosageAmount} ${alarm.medication.dosageUnit})`,
                icon: 'assets/icons/medication-icon.png',
                tag: alarm.id,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                this.showAlarmModal(alarm);
            };

            this.notifications.set(alarm.id, notification);
        }
    }

    playAlarmSound() {
        // Create oscillator for alarm sound
        if (this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
                
                // Repeat sound every 2 seconds
                this.alarmSoundInterval = setInterval(() => {
                    if (this.currentAlarm) {
                        this.playAlarmSound();
                    }
                }, 2000);
            } catch (error) {
                console.warn('Error playing alarm sound:', error);
            }
        }
    }

    stopAlarmSound() {
        if (this.alarmSoundInterval) {
            clearInterval(this.alarmSoundInterval);
            this.alarmSoundInterval = null;
        }
    }

    showAlarmModal(alarm) {
        const modal = document.getElementById('alarmModal');
        if (!modal) return;

        // Populate modal with medication info
        const medImage = document.getElementById('alarmMedImage');
        const medName = document.getElementById('alarmMedName');
        const medDosage = document.getElementById('alarmMedDosage');
        const medInstructions = document.getElementById('alarmMedInstructions');

        if (medImage) {
            medImage.src = alarm.medication.image || 'assets/icons/pill-placeholder.png';
            medImage.alt = alarm.medication.medicineName;
        }
        
        if (medName) {
            medName.textContent = alarm.medication.medicineName;
        }
        
        if (medDosage) {
            medDosage.textContent = `${alarm.medication.dosageAmount} ${alarm.medication.dosageUnit}`;
        }
        
        if (medInstructions) {
            medInstructions.textContent = alarm.medication.instructions || 'Take as prescribed';
        }

        // Show modal
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    hideAlarmModal() {
        const modal = document.getElementById('alarmModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }

    setupAlarmModalListeners() {
        const markAsTakenBtn = document.getElementById('markAsTakenBtn');
        const markAsMissedBtn = document.getElementById('markAsMissedBtn');
        const snoozeBtn = document.getElementById('snoozeBtn');
        const stopAlarmBtn = document.getElementById('stopAlarmBtn');

        if (markAsTakenBtn) {
            markAsTakenBtn.addEventListener('click', () => this.handleMarkAsTaken());
        }

        if (markAsMissedBtn) {
            markAsMissedBtn.addEventListener('click', () => this.handleMarkAsMissed());
        }

        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => this.handleSnooze());
        }

        if (stopAlarmBtn) {
            stopAlarmBtn.addEventListener('click', () => this.handleStopAlarm());
        }
    }

    handleMarkAsTaken() {
        if (!this.currentAlarm) return;

        const medication = this.currentAlarm.medication;
        const scheduledTime = this.currentAlarm.scheduledTime;
        
        // Mark medication as taken
        window.StorageManager.markMedicationAsTaken(medication.id, new Date().toISOString());
        
        // Show success message
        this.showAlarmSuccess(`${medication.medicineName} marked as taken!`);
        
        // Clean up alarm
        this.stopCurrentAlarm();
        this.hideAlarmModal();
        
        // Refresh dashboard if visible
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.reload();
        }
    }

    handleMarkAsMissed() {
        if (!this.currentAlarm) return;

        const medication = this.currentAlarm.medication;
        const scheduledTime = this.currentAlarm.scheduledTime;
        
        // Mark medication as missed
        window.StorageManager.markMedicationAsMissed(medication.id, scheduledTime.toISOString());
        
        // Show message
        this.showAlarmWarning(`${medication.medicineName} marked as missed.`);
        
        // Clean up alarm
        this.stopCurrentAlarm();
        this.hideAlarmModal();
        
        // Refresh dashboard if visible
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.reload();
        }
    }

    handleSnooze() {
        if (!this.currentAlarm) return;

        const alarm = this.currentAlarm;
        
        // Check snooze limit
        if (alarm.snoozeCount >= this.maxSnoozes) {
            this.showAlarmError('Maximum snoozes reached. Please take your medication.');
            return;
        }

        // Increase snooze count
        alarm.snoozeCount++;
        alarm.snoozed = true;
        
        // Schedule next alarm
        setTimeout(() => {
            if (alarm.snoozed) {
                this.showAlarm(alarm);
            }
        }, this.snoozeInterval);
        
        // Show snooze message
        this.showAlarmInfo(`Snoozed for 5 minutes. (${alarm.snoozeCount}/${this.maxSnoozes})`);
        
        // Hide current alarm
        this.stopCurrentAlarm();
        this.hideAlarmModal();
    }

    handleStopAlarm() {
        if (!this.currentAlarm) return;

        // Just stop the alarm without marking as taken or missed
        this.stopCurrentAlarm();
        this.hideAlarmModal();
    }

    autoSnooze(alarm) {
        if (alarm.snoozeCount < this.maxSnoozes) {
            this.handleSnooze();
        } else {
            // Max snoozes reached, force decision
            this.showAlarmError('Maximum snoozes reached! Please take your medication or mark as missed.');
        }
    }

    stopCurrentAlarm() {
        if (this.currentAlarm) {
            // Stop alarm sound
            this.stopAlarmSound();
            
            // Close notification
            const notification = this.notifications.get(this.currentAlarm.id);
            if (notification) {
                notification.close();
                this.notifications.delete(this.currentAlarm.id);
            }
            
            // Clear current alarm
            this.currentAlarm = null;
        }
    }

    // Appointment reminders
    scheduleAppointmentReminder(appointment) {
        const appointmentDate = new Date(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
        const now = new Date();
        
        // Schedule reminder 1 hour before
        const reminderTime = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
        
        if (reminderTime > now) {
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            
            setTimeout(() => {
                this.showAppointmentReminder(appointment);
            }, timeUntilReminder);
        }
    }

    showAppointmentReminder(appointment) {
        if (Notification.permission === 'granted') {
            const notification = new Notification('Doctor Appointment Reminder', {
                body: `You have an appointment with ${appointment.doctorName} in 1 hour`,
                icon: 'assets/icons/appointment-icon.png',
                tag: `appointment-${appointment.id}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                // Navigate to calendar
                window.location.href = 'calendar.html';
            };
        }
    }

    // UI Feedback Methods
    showAlarmSuccess(message) {
        this.showToast(message, 'success');
    }

    showAlarmWarning(message) {
        this.showToast(message, 'warning');
    }

    showAlarmError(message) {
        this.showToast(message, 'error');
    }

    showAlarmInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getToastColor(type) {
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        return colors[type] || '#17a2b8';
    }

    // Test alarm (for debugging)
    testAlarm() {
        const testMedication = {
            id: 'test-medication',
            medicineName: 'Test Medication',
            dosageAmount: 10,
            dosageUnit: 'mg',
            instructions: 'Take with water'
        };

        const testAlarm = {
            id: 'test-alarm',
            medication: testMedication,
            scheduledTime: new Date(),
            triggeredTime: new Date(),
            snoozed: false,
            snoozeCount: 0
        };

        this.showAlarm(testAlarm);
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager();

// Export for use in other files
window.NotificationManager = notificationManager;

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);
