// ============================================
// STORAGE MANAGEMENT SYSTEM
// ============================================

class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize storage structure if needed
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize users array if not exists
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        
        // Initialize app settings if not exists
        if (!localStorage.getItem('appSettings')) {
            const defaultSettings = {
                alarmDuration: 30, // seconds
                snoozeInterval: 5, // minutes
                maxSnoozes: 3,
                notificationsEnabled: true,
                voiceEnabled: true,
                theme: 'light',
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
        }
    }

    // User Management
    getCurrentUser() {
        return localStorage.getItem('currentUser');
    }

    getCurrentUserData() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const users = this.getUsers();
        return users.find(user => user.username === currentUser);
    }

    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    updateUserData(data) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.username === currentUser);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...data };
            localStorage.setItem('users', JSON.stringify(users));
            return true;
        }
        return false;
    }

    // Medication Management
    getMedications() {
        const userData = this.getCurrentUserData();
        return userData ? userData.medications || [] : [];
    }

    addMedication(medication) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        medication.id = this.generateId();
        medication.createdAt = new Date().toISOString();
        medication.lastTaken = null;
        medication.missedDoses = 0;
        medication.totalDoses = 0;
        medication.isActive = true;

        const medications = userData.medications || [];
        medications.push(medication);
        
        return this.updateUserData({ medications });
    }

    updateMedication(medicationId, updates) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const medications = userData.medications || [];
        const medicationIndex = medications.findIndex(med => med.id === medicationId);
        
        if (medicationIndex !== -1) {
            medications[medicationIndex] = { ...medications[medicationIndex], ...updates };
            return this.updateUserData({ medications });
        }
        return false;
    }

    deleteMedication(medicationId) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const medications = userData.medications || [];
        const filteredMedications = medications.filter(med => med.id !== medicationId);
        
        return this.updateUserData({ medications: filteredMedications });
    }

    getMedicationById(medicationId) {
        const medications = this.getMedications();
        return medications.find(med => med.id === medicationId);
    }

    // Medication History
    getMedicationHistory() {
        const userData = this.getCurrentUserData();
        return userData ? userData.medicationHistory || [] : [];
    }

    addMedicationHistory(entry) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        entry.id = this.generateId();
        entry.timestamp = new Date().toISOString();

        const history = userData.medicationHistory || [];
        history.push(entry);
        
        // Keep only last 1000 entries to prevent storage overflow
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
        
        return this.updateUserData({ medicationHistory: history });
    }

    markMedicationAsTaken(medicationId, timestamp = null) {
        const medication = this.getMedicationById(medicationId);
        if (!medication) return false;

        const takenTime = timestamp || new Date().toISOString();
        
        // Update medication
        const updates = {
            lastTaken: takenTime,
            totalDoses: (medication.totalDoses || 0) + 1
        };
        
        this.updateMedication(medicationId, updates);
        
        // Add to history
        const historyEntry = {
            medicationId: medicationId,
            medicationName: medication.medicineName,
            action: 'taken',
            scheduledTime: this.getNextScheduledTime(medication),
            actualTime: takenTime,
            dosage: `${medication.dosageAmount} ${medication.dosageUnit}`,
            notes: 'Marked as taken'
        };
        
        return this.addMedicationHistory(historyEntry);
    }

    markMedicationAsMissed(medicationId, scheduledTime = null) {
        const medication = this.getMedicationById(medicationId);
        if (!medication) return false;

        const missedTime = scheduledTime || new Date().toISOString();
        
        // Update medication
        const updates = {
            missedDoses: (medication.missedDoses || 0) + 1
        };
        
        this.updateMedication(medicationId, updates);
        
        // Add to history
        const historyEntry = {
            medicationId: medicationId,
            medicationName: medication.medicineName,
            action: 'missed',
            scheduledTime: missedTime,
            actualTime: new Date().toISOString(),
            dosage: `${medication.dosageAmount} ${medication.dosageUnit}`,
            notes: 'Marked as missed'
        };
        
        return this.addMedicationHistory(historyEntry);
    }

    // Exercise Management
    getExercises() {
        const userData = this.getCurrentUserData();
        return userData ? userData.exercises || [] : [];
    }

    addExercise(exercise) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        exercise.id = this.generateId();
        exercise.createdAt = new Date().toISOString();
        exercise.lastCompleted = null;
        exercise.totalSessions = 0;
        exercise.streak = 0;

        const exercises = userData.exercises || [];
        exercises.push(exercise);
        
        return this.updateUserData({ exercises });
    }

    updateExercise(exerciseId, updates) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const exercises = userData.exercises || [];
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        
        if (exerciseIndex !== -1) {
            exercises[exerciseIndex] = { ...exercises[exerciseIndex], ...updates };
            return this.updateUserData({ exercises });
        }
        return false;
    }

    deleteExercise(exerciseId) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const exercises = userData.exercises || [];
        const filteredExercises = exercises.filter(ex => ex.id !== exerciseId);
        
        return this.updateUserData({ exercises: filteredExercises });
    }

    markExerciseAsCompleted(exerciseId) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const exercises = userData.exercises || [];
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        
        if (exerciseIndex !== -1) {
            const today = new Date().toDateString();
            const lastCompleted = exercises[exerciseIndex].lastCompleted;
            const lastCompletedDate = lastCompleted ? new Date(lastCompleted).toDateString() : null;
            
            exercises[exerciseIndex].lastCompleted = new Date().toISOString();
            exercises[exerciseIndex].totalSessions = (exercises[exerciseIndex].totalSessions || 0) + 1;
            
            // Update streak
            if (lastCompletedDate === today) {
                // Already completed today, don't update streak
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();
                
                if (lastCompletedDate === yesterdayStr) {
                    exercises[exerciseIndex].streak = (exercises[exerciseIndex].streak || 0) + 1;
                } else {
                    exercises[exerciseIndex].streak = 1;
                }
            }
            
            return this.updateUserData({ exercises });
        }
        return false;
    }

    // Appointment Management
    getAppointments() {
        const userData = this.getCurrentUserData();
        return userData ? userData.appointments || [] : [];
    }

    addAppointment(appointment) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        appointment.id = this.generateId();
        appointment.createdAt = new Date().toISOString();

        const appointments = userData.appointments || [];
        appointments.push(appointment);
        
        return this.updateUserData({ appointments });
    }

    updateAppointment(appointmentId, updates) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const appointments = userData.appointments || [];
        const appointmentIndex = appointments.findIndex(app => app.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex] = { ...appointments[appointmentIndex], ...updates };
            return this.updateUserData({ appointments });
        }
        return false;
    }

    deleteAppointment(appointmentId) {
        const userData = this.getCurrentUserData();
        if (!userData) return false;

        const appointments = userData.appointments || [];
        const filteredAppointments = appointments.filter(app => app.id !== appointmentId);
        
        return this.updateUserData({ appointments: filteredAppointments });
    }

    // Settings Management
    getSettings() {
        const settings = localStorage.getItem('appSettings');
        return settings ? JSON.parse(settings) : {};
    }

    updateSettings(updates) {
        const currentSettings = this.getSettings();
        const newSettings = { ...currentSettings, ...updates, lastUpdated: new Date().toISOString() };
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        return true;
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getNextScheduledTime(medication) {
        if (!medication.times || medication.times.length === 0) return null;

        const now = new Date();
        const today = now.toDateString();
        
        // Check if medication is still active
        if (medication.endDate && new Date(medication.endDate) < now) {
            return null;
        }
        
        // Find next scheduled time today
        const todayTimes = medication.times.map(time => {
            const scheduleTime = new Date(`${today} ${time}`);
            return scheduleTime;
        }).filter(time => time > now);
        
        if (todayTimes.length > 0) {
            return todayTimes[0];
        }
        
        // If no more times today, return first time tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();
        
        if (medication.times.length > 0) {
            return new Date(`${tomorrowStr} ${medication.times[0]}`);
        }
        
        return null;
    }

    // Data Export/Import
    exportData(format = 'json') {
        const userData = this.getCurrentUserData();
        if (!userData) return null;

        const exportData = {
            username: userData.username,
            medications: userData.medications || [],
            exercises: userData.exercises || [],
            appointments: userData.appointments || [],
            medicationHistory: userData.medicationHistory || [],
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(exportData);
        }
        
        return null;
    }

    importData(importData) {
        try {
            const data = typeof importData === 'string' ? JSON.parse(importData) : importData;
            
            // Validate data structure
            if (!data.username || !Array.isArray(data.medications)) {
                throw new Error('Invalid data format');
            }
            
            // Update user data
            const updates = {
                medications: data.medications || [],
                exercises: data.exercises || [],
                appointments: data.appointments || [],
                medicationHistory: data.medicationHistory || []
            };
            
            return this.updateUserData(updates);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    convertToCSV(data) {
        let csv = '';
        
        // Medications CSV
        csv += 'MEDICATIONS\n';
        csv += 'Name,Dosage,Frequency,Times,Instructions,Start Date,End Date,Created At\n';
        data.medications.forEach(med => {
            csv += `"${med.medicineName}","${med.dosageAmount} ${med.dosageUnit}","${med.frequency}","${med.times ? med.times.join(';') : ''}","${med.instructions || ''}","${med.startDate || ''}","${med.endDate || ''}","${med.createdAt}"\n`;
        });
        
        csv += '\n';
        
        // Exercises CSV
        csv += 'EXERCISES\n';
        csv += 'Name,Description,Duration,Frequency,Time,Created At\n';
        data.exercises.forEach(ex => {
            csv += `"${ex.exerciseName}","${ex.exerciseDescription || ''}","${ex.exerciseDuration || ''}","${ex.exerciseFrequency || ''}","${ex.exerciseTime || ''}","${ex.createdAt}"\n`;
        });
        
        csv += '\n';
        
        // Appointments CSV
        csv += 'APPOINTMENTS\n';
        csv += 'Date,Time,Doctor,Type,Notes,Created At\n';
        data.appointments.forEach(app => {
            csv += `"${app.appointmentDate}","${app.appointmentTime}","${app.doctorName}","${app.appointmentType}","${app.appointmentNotes || ''}","${app.createdAt}"\n`;
        });
        
        return csv;
    }

    // Clear all data (for testing/reset)
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.clear();
            this.initializeStorage();
            window.location.href = 'index.html';
        }
    }

    // Get storage usage
    getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
}

// Initialize storage manager
const storageManager = new StorageManager();

// Export for use in other files
window.StorageManager = storageManager;
