// ============================================
// DASHBOARD FUNCTIONALITY
// ============================================

class DashboardManager {
    constructor() {
        this.actionInProgress = false;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.AuthManager.requireAuth()) {
            return;
        }

        // Display current user
        window.AuthManager.displayCurrentUser();

        // Initialize dashboard
        this.updateCurrentTime();
        this.loadDashboardData();
        this.setupEventListeners();
        
        // Update time every second
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Refresh dashboard every 5 minutes
        setInterval(() => this.refreshDashboard(), 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.AuthManager.handleLogout();
            });
        }

        // Collapsible sections
        this.setupCollapsibleSections();

        // Medication card interactions
        this.setupMedicationCardListeners();
    }

    setupCollapsibleSections() {
        // All Medications section toggle
        const allMedicationsTitle = document.getElementById('allMedicationsTitle');
        if (allMedicationsTitle) {
            allMedicationsTitle.addEventListener('click', () => {
                this.toggleSection('allMedicationsContainer', allMedicationsTitle);
            });
        }
    }

    toggleSection(containerId, titleElement) {
        const container = document.getElementById(containerId);
        if (!container || !titleElement) return;

        const isExpanded = container.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            container.classList.remove('expanded');
            container.classList.add('collapsed');
            titleElement.classList.remove('expanded');
        } else {
            // Expand
            container.classList.remove('collapsed');
            container.classList.add('expanded');
            titleElement.classList.add('expanded');
        }
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }

    loadDashboardData() {
        this.updateStats();
        this.displayMedications();
    }

    updateStats() {
        const medications = window.StorageManager.getMedications();
        const history = window.StorageManager.getMedicationHistory();
        
        // Calculate stats
        const totalMedications = medications.filter(med => med.isActive).length;
        const takenToday = this.getTakenTodayCount(history);
        const missedDoses = this.getMissedDosesCount(medications);
        const nextDue = this.getNextDueTime(medications);

        // Update UI
        this.updateStatElement('totalMedications', totalMedications);
        this.updateStatElement('takenToday', takenToday);
        this.updateStatElement('missedDoses', missedDoses);
        this.updateStatElement('nextDue', nextDue);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getTakenTodayCount(history) {
        const today = new Date().toDateString();
        return history.filter(entry => 
            entry.action === 'taken' && 
            new Date(entry.timestamp).toDateString() === today
        ).length;
    }

    getMissedDosesCount(medications) {
        return medications.reduce((total, med) => total + (med.missedDoses || 0), 0);
    }

    getNextDueTime(medications) {
        const now = new Date();
        let nextDue = null;

        medications.forEach(medication => {
            if (!medication.isActive || !medication.times) return;

            medication.times.forEach(time => {
                const today = now.toDateString();
                const scheduleTime = new Date(`${today} ${time}`);
                
                if (scheduleTime > now) {
                    if (!nextDue || scheduleTime < nextDue) {
                        nextDue = scheduleTime;
                    }
                }
            });
        });

        if (!nextDue) {
            // Check next day
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toDateString();

            medications.forEach(medication => {
                if (!medication.isActive || !medication.times) return;

                medication.times.forEach(time => {
                    const scheduleTime = new Date(`${tomorrowStr} ${time}`);
                    if (!nextDue || scheduleTime < nextDue) {
                        nextDue = scheduleTime;
                    }
                });
            });
        }

        if (!nextDue) {
            return '--:--';
        }

        // Format date and time
        const timeStr = nextDue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const today = new Date().toDateString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        if (nextDue.toDateString() === today) {
            return timeStr; // Today - just show time
        } else if (nextDue.toDateString() === tomorrowStr) {
            return `${timeStr} (Tomorrow)`;
        } else {
            const dateStr = nextDue.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return `${timeStr} (${dateStr})`;
        }
    }

    displayMedications() {
        const medications = window.StorageManager.getMedications();
        const now = new Date();

        // Categorize medications
        const dueNow = [];
        const comingUp = [];
        const allMedications = [];

        medications.forEach(medication => {
            if (!medication.isActive) return;

            const medicationStatus = this.getMedicationStatus(medication, now);
            
            if (medicationStatus.isDue) {
                dueNow.push({ ...medication, status: medicationStatus });
            } else if (medicationStatus.isComingUp) {
                comingUp.push({ ...medication, status: medicationStatus });
            }
            
            allMedications.push({ ...medication, status: medicationStatus });
        });

        // Display in respective sections
        this.displayMedicationSection('dueNowContainer', dueNow, 'due-now');
        this.displayMedicationSection('comingUpContainer', comingUp, 'coming-up');
        this.displayMedicationSection('allMedicationsContainer', allMedications, 'all');
    }

    getMedicationStatus(medication, now) {
        if (!medication.times || medication.times.length === 0) {
            return { isDue: false, isComingUp: false, nextTime: null };
        }

        const today = now.toDateString();
        let nextTime = null;
        let isDue = false;
        let isComingUp = false;

        // Get medication history for today
        const history = window.StorageManager.getMedicationHistory();
        const todayHistory = history.filter(entry => 
            entry.medicationId === medication.id && 
            entry.action === 'taken' && 
            new Date(entry.timestamp).toDateString() === today
        );

        // Check today's times
        medication.times.forEach(time => {
            const scheduleTime = new Date(`${today} ${time}`);
            const timeDiff = scheduleTime.getTime() - now.getTime();
            
            // Check if this specific time was already taken today
            const wasAlreadyTaken = todayHistory.some(entry => {
                const entryTime = new Date(entry.timestamp);
                const scheduledTime = new Date(`${today} ${time}`);
                const timeDiffFromScheduled = Math.abs(entryTime.getTime() - scheduledTime.getTime());
                // Consider taken if within 30 minutes of scheduled time
                return timeDiffFromScheduled <= 30 * 60 * 1000;
            });

            // Skip if already taken
            if (wasAlreadyTaken) {
                return;
            }
            
            // Due now (within 5 minutes after scheduled time)
            if (timeDiff >= -5 * 60 * 1000 && timeDiff <= 0) {
                isDue = true;
            }
            
            // Coming up (within next 15 minutes)
            if (timeDiff > 0 && timeDiff <= 15 * 60 * 1000) {
                isComingUp = true;
                if (!nextTime || scheduleTime < nextTime) {
                    nextTime = scheduleTime;
                }
            }
            
            // Next scheduled time
            if (timeDiff > 0) {
                if (!nextTime || scheduleTime < nextTime) {
                    nextTime = scheduleTime;
                }
            }
        });

        // If no time found for today, check tomorrow
        if (!nextTime) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toDateString();

            if (medication.times.length > 0) {
                nextTime = new Date(`${tomorrowStr} ${medication.times[0]}`);
            }
        }

        return { isDue, isComingUp, nextTime };
    }

    displayMedicationSection(containerId, medications, sectionType) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (medications.length === 0) {
            container.innerHTML = '<p class="no-medications">No medications to display</p>';
            return;
        }

        container.innerHTML = medications.map(medication => 
            this.createMedicationCard(medication, sectionType)
        ).join('');

        // Add event listeners to new cards
        this.setupMedicationCardListeners();
    }

    createMedicationCard(medication, sectionType) {
        const cardClass = sectionType === 'due-now' ? 'due-now' : 
                         sectionType === 'coming-up' ? 'coming-up' : '';
        
        const nextTimeText = this.formatNextDueTime(medication.status.nextTime, sectionType);

        const imageUrl = medication.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTAiIGZpbGw9IiNmOGY5ZmEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxOCIgeT0iMTgiPgo8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MiAwLTgtMy41OC04LThzMy41OC04IDgtOCA4IDMuNTggOCA4LTMuNTggOC04IDh6bTMuNS05TDEyIDEwSDloNGwzLTMgMy41IDMuNXoiIGZpbGw9IiM2Yzc1N2QiLz4KPC9zdmc+Cjwvc3ZnPgo=';

        return `
            <div class="medication-card ${cardClass}" data-medication-id="${medication.id}">
                <div class="medication-header">
                    <img src="${imageUrl}" alt="${medication.medicineName}" class="medication-image">
                    <div class="medication-info">
                        <h3 title="${medication.medicineName || 'Unnamed Medication'}">${medication.medicineName || 'Unnamed Medication'}</h3>
                        <p title="${medication.dosageAmount} ${medication.dosageUnit}">${medication.dosageAmount} ${medication.dosageUnit}</p>
                        <div class="time-display ${sectionType === 'due-now' ? 'due-time' : 'next-time'}">
                            ${nextTimeText}
                        </div>
                    </div>
                </div>
                
                ${medication.instructions ? `
                    <div class="medication-instructions">
                        <small><i class="fas fa-info-circle"></i> ${medication.instructions}</small>
                    </div>
                ` : ''}
                
                <div class="medication-actions">
                    <button class="btn btn-success btn-take" data-medication-id="${medication.id}">
                        <i class="fas fa-check"></i> Mark as Taken
                    </button>
                    <button class="btn btn-danger btn-miss" data-medication-id="${medication.id}">
                        <i class="fas fa-times"></i> Mark as Missed
                    </button>
                    <button class="btn btn-secondary btn-edit" data-medication-id="${medication.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-warning btn-delete" data-medication-id="${medication.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    formatNextDueTime(nextTime, sectionType) {
        if (!nextTime) {
            return sectionType === 'due-now' ? 'Due now!' : 'No scheduled time';
        }

        if (sectionType === 'due-now') {
            return 'Due now!';
        }

        // Format with date like in the stats
        const timeStr = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const today = new Date().toDateString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        if (nextTime.toDateString() === today) {
            return `Next: ${timeStr}`;
        } else if (nextTime.toDateString() === tomorrowStr) {
            return `Next: ${timeStr} (Tomorrow)`;
        } else {
            const dateStr = nextTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return `Next: ${timeStr} (${dateStr})`;
        }
    }

    setupMedicationCardListeners() {
        // Use event delegation to avoid multiple listeners
        const container = document.querySelector('.dashboard-main');
        if (!container) return;

        // Remove existing listeners
        container.removeEventListener('click', this.handleMedicationClick);
        
        // Add single delegated listener
        this.handleMedicationClick = (e) => {
            const btnTake = e.target.closest('.btn-take');
            const btnMiss = e.target.closest('.btn-miss');
            const btnEdit = e.target.closest('.btn-edit');
            const btnDelete = e.target.closest('.btn-delete');
            
            if (btnTake) {
                e.preventDefault();
                e.stopPropagation();
                const medicationId = btnTake.dataset.medicationId;
                this.markMedicationAsTaken(medicationId);
            } else if (btnMiss) {
                e.preventDefault();
                e.stopPropagation();
                const medicationId = btnMiss.dataset.medicationId;
                this.markMedicationAsMissed(medicationId);
            } else if (btnEdit) {
                e.preventDefault();
                e.stopPropagation();
                const medicationId = btnEdit.dataset.medicationId;
                this.editMedication(medicationId);
            } else if (btnDelete) {
                e.preventDefault();
                e.stopPropagation();
                const medicationId = btnDelete.dataset.medicationId;
                this.deleteMedication(medicationId);
            }
        };

        container.addEventListener('click', this.handleMedicationClick);

        // Set up touch/context menu for editing
        document.querySelectorAll('.medication-card').forEach(card => {
            let longPressTimer;
            
            card.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    const medicationId = card.dataset.medicationId;
                    this.editMedication(medicationId);
                }, 1000);
            });
            
            card.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
            });
            
            card.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            });

            // Right click to edit (for desktop)
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const medicationId = card.dataset.medicationId;
                this.editMedication(medicationId);
            });
        });
    }

    markMedicationAsTaken(medicationId) {
        if (this.actionInProgress) return;
        
        const medication = window.StorageManager.getMedicationById(medicationId);
        if (!medication) return;

        // Prevent multiple rapid clicks
        this.actionInProgress = true;

        // Confirm action
        if (confirm(`Mark ${medication.medicineName} as taken?`)) {
            window.StorageManager.markMedicationAsTaken(medicationId);
            
            // Show success message
            this.showSuccess(`${medication.medicineName} marked as taken!`);
            
            // Hide card with animation
            this.hideMedicationCard(medicationId);
            
            // Refresh dashboard immediately
            setTimeout(() => {
                this.refreshDashboard();
                this.actionInProgress = false;
            }, 1000);
        } else {
            this.actionInProgress = false;
        }
    }

    markMedicationAsMissed(medicationId) {
        if (this.actionInProgress) return;
        
        const medication = window.StorageManager.getMedicationById(medicationId);
        if (!medication) return;

        // Prevent multiple rapid clicks
        this.actionInProgress = true;

        // Confirm action
        if (confirm(`Mark ${medication.medicineName} as missed?`)) {
            window.StorageManager.markMedicationAsMissed(medicationId);
            
            // Show warning message
            this.showWarning(`${medication.medicineName} marked as missed.`);
            
            // Hide card with animation
            this.hideMedicationCard(medicationId);
            
            // Refresh dashboard immediately
            setTimeout(() => {
                this.refreshDashboard();
                this.actionInProgress = false;
            }, 1000);
        } else {
            this.actionInProgress = false;
        }
    }

    hideMedicationCard(medicationId) {
        const card = document.querySelector(`[data-medication-id="${medicationId}"]`);
        if (card) {
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'translateX(100%)';
            card.style.opacity = '0';
            
            setTimeout(() => {
                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                }
            }, 300);
        }
    }

    editMedication(medicationId) {
        // Navigate to edit page
        window.location.href = `add-medication.html?id=${medicationId}`;
    }

    deleteMedication(medicationId) {
        if (this.actionInProgress) return;
        
        const medication = window.StorageManager.getMedicationById(medicationId);
        if (!medication) return;

        // Prevent multiple rapid clicks
        this.actionInProgress = true;

        // Confirm deletion
        if (confirm(`Are you sure you want to delete ${medication.medicineName}? This action cannot be undone.`)) {
            const success = window.StorageManager.deleteMedication(medicationId);
            
            if (success) {
                this.showSuccess(`${medication.medicineName} deleted successfully!`);
                
                // Hide card with animation
                this.hideMedicationCard(medicationId);
                
                // Refresh dashboard immediately
                setTimeout(() => {
                    this.refreshDashboard();
                    this.actionInProgress = false;
                }, 1000);
            } else {
                this.showError('Failed to delete medication');
                this.actionInProgress = false;
            }
        } else {
            this.actionInProgress = false;
        }
    }

    refreshDashboard() {
        this.loadDashboardData();
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };

        const colorMap = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${iconMap[type]}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colorMap[type]};
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
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Export functionality
    exportData() {
        const exportData = window.StorageManager.exportData('json');
        if (exportData) {
            this.downloadFile(exportData, 'tablet-alarm-data.json', 'application/json');
            this.showSuccess('Data exported successfully!');
        } else {
            this.showError('Failed to export data');
        }
    }

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});
