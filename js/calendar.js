// ============================================
// CALENDAR FUNCTIONALITY
// ============================================

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        this.init();
    }

    init() {
        // Check authentication
        if (!window.AuthManager.requireAuth()) {
            return;
        }

        // Display current user
        window.AuthManager.displayCurrentUser();

        this.setupEventListeners();
        this.displayCalendar();
    }

    setupEventListeners() {
        // Navigation buttons
        const prevButton = document.getElementById('prevMonth');
        const nextButton = document.getElementById('nextMonth');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousMonth());
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextMonth());
        }

        // Add appointment button
        const addAppointmentBtn = document.getElementById('addAppointmentBtn');
        if (addAppointmentBtn) {
            addAppointmentBtn.addEventListener('click', () => this.showAppointmentModal());
        }

        // Appointment modal
        this.setupAppointmentModal();
    }

    setupAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelAppointment');
        const appointmentForm = document.getElementById('appointmentForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideAppointmentModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideAppointmentModal());
        }

        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAppointmentModal();
                }
            });
        }
    }

    displayCalendar() {
        this.updateMonthDisplay();
        this.generateCalendarGrid();
        this.updateDayDetails();
    }

    updateMonthDisplay() {
        const monthElement = document.getElementById('currentMonth');
        if (monthElement) {
            monthElement.textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }

    generateCalendarGrid() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Clear existing grid
        grid.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate 6 weeks of calendar
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const dayElement = this.createDayElement(currentDate);
                grid.appendChild(dayElement);
            }
        }
    }

    createDayElement(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        const isToday = this.isToday(date);
        const isSelected = this.selectedDate && this.isSameDate(date, this.selectedDate);

        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        if (isSelected) {
            dayElement.classList.add('selected');
        }

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        // Events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        dayElement.appendChild(eventsContainer);

        // Add events for this day
        this.addEventsToDay(date, eventsContainer);

        // Click handler
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });

        return dayElement;
    }

    addEventsToDay(date, container) {
        const dateStr = date.toDateString();
        
        // Get medications for this day
        const medications = window.StorageManager.getMedications();
        const medicationEvents = this.getMedicationEventsForDate(date, medications);
        
        // Get appointments for this day
        const appointments = window.StorageManager.getAppointments();
        const appointmentEvents = appointments.filter(app => 
            new Date(app.appointmentDate).toDateString() === dateStr
        );

        // Get medication history for this day
        const history = window.StorageManager.getMedicationHistory();
        const historyEvents = history.filter(entry => 
            new Date(entry.timestamp).toDateString() === dateStr
        );

        // Add medication dots
        medicationEvents.forEach(event => {
            const dot = document.createElement('div');
            dot.className = 'event-dot medication';
            dot.title = `${event.name} - ${event.time}`;
            container.appendChild(dot);
        });

        // Add appointment dots
        appointmentEvents.forEach(appointment => {
            const dot = document.createElement('div');
            dot.className = 'event-dot appointment';
            dot.title = `${appointment.doctorName} - ${appointment.appointmentTime}`;
            container.appendChild(dot);
        });

        // Add missed medication dots
        const missedEvents = historyEvents.filter(entry => entry.action === 'missed');
        missedEvents.forEach(event => {
            const dot = document.createElement('div');
            dot.className = 'event-dot missed';
            dot.title = `Missed: ${event.medicationName}`;
            container.appendChild(dot);
        });

        // Add completed medication dots
        const completedEvents = historyEvents.filter(entry => entry.action === 'taken');
        completedEvents.forEach(event => {
            const dot = document.createElement('div');
            dot.className = 'event-dot completed';
            dot.title = `Completed: ${event.medicationName}`;
            container.appendChild(dot);
        });
    }

    getMedicationEventsForDate(date, medications) {
        const events = [];
        const dateStr = date.toDateString();
        
        medications.forEach(medication => {
            if (!medication.isActive || !medication.times) return;
            
            // Check if medication is active on this date
            const startDate = new Date(medication.startDate);
            const endDate = new Date(medication.endDate);
            
            if (date >= startDate && date <= endDate) {
                medication.times.forEach(time => {
                    events.push({
                        name: medication.medicineName,
                        time: time,
                        dosage: `${medication.dosageAmount} ${medication.dosageUnit}`,
                        instructions: medication.instructions
                    });
                });
            }
        });
        
        return events;
    }

    selectDate(date) {
        // Remove previous selection
        const previousSelected = document.querySelector('.calendar-day.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selection to new date
        this.selectedDate = date;
        const dayElements = document.querySelectorAll('.calendar-day');
        dayElements.forEach(dayElement => {
            const dayNumber = dayElement.querySelector('.day-number');
            if (dayNumber && parseInt(dayNumber.textContent) === date.getDate()) {
                const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), date.getDate());
                if (this.isSameDate(dayDate, date)) {
                    dayElement.classList.add('selected');
                }
            }
        });

        this.updateDayDetails();
    }

    updateDayDetails() {
        const dayDetails = document.getElementById('dayDetails');
        const selectedDateElement = document.getElementById('selectedDate');
        const dayEventsElement = document.getElementById('dayEvents');

        if (!dayDetails || !selectedDateElement || !dayEventsElement) return;

        const targetDate = this.selectedDate || new Date();
        
        // Update selected date display
        selectedDateElement.textContent = targetDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get events for selected date
        const medications = window.StorageManager.getMedications();
        const medicationEvents = this.getMedicationEventsForDate(targetDate, medications);
        
        const appointments = window.StorageManager.getAppointments();
        const appointmentEvents = appointments.filter(app => 
            new Date(app.appointmentDate).toDateString() === targetDate.toDateString()
        );

        const history = window.StorageManager.getMedicationHistory();
        const historyEvents = history.filter(entry => 
            new Date(entry.timestamp).toDateString() === targetDate.toDateString()
        );

        // Build events HTML
        let eventsHTML = '';

        if (medicationEvents.length > 0) {
            eventsHTML += '<h4><i class="fas fa-pills"></i> Medications</h4>';
            medicationEvents.forEach(event => {
                eventsHTML += `
                    <div class="event-item medication-event">
                        <div class="event-time">${event.time}</div>
                        <div class="event-details">
                            <strong>${event.name}</strong><br>
                            <small>${event.dosage}</small>
                            ${event.instructions ? `<br><small><i class="fas fa-info-circle"></i> ${event.instructions}</small>` : ''}
                        </div>
                    </div>
                `;
            });
        }

        if (appointmentEvents.length > 0) {
            eventsHTML += '<h4><i class="fas fa-user-md"></i> Appointments</h4>';
            appointmentEvents.forEach(appointment => {
                eventsHTML += `
                    <div class="event-item appointment-event">
                        <div class="event-time">${appointment.appointmentTime}</div>
                        <div class="event-details">
                            <strong>Dr. ${appointment.doctorName}</strong><br>
                            <small>${appointment.appointmentType}</small>
                            ${appointment.appointmentNotes ? `<br><small>${appointment.appointmentNotes}</small>` : ''}
                        </div>
                    </div>
                `;
            });
        }

        if (historyEvents.length > 0) {
            eventsHTML += '<h4><i class="fas fa-history"></i> History</h4>';
            historyEvents.forEach(event => {
                const actionClass = event.action === 'taken' ? 'success' : 'danger';
                const actionIcon = event.action === 'taken' ? 'check' : 'times';
                eventsHTML += `
                    <div class="event-item history-event">
                        <div class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
                        <div class="event-details">
                            <span class="badge badge-${actionClass}">
                                <i class="fas fa-${actionIcon}"></i> ${event.action}
                            </span>
                            <strong>${event.medicationName}</strong>
                            ${event.notes ? `<br><small>${event.notes}</small>` : ''}
                        </div>
                    </div>
                `;
            });
        }

        if (eventsHTML === '') {
            eventsHTML = '<p class="no-events">No events for this date</p>';
        }

        dayEventsElement.innerHTML = eventsHTML;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.displayCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.displayCalendar();
    }

    showAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            // Pre-fill date if a date is selected
            if (this.selectedDate) {
                const dateInput = document.getElementById('appointmentDate');
                if (dateInput) {
                    dateInput.value = this.selectedDate.toISOString().split('T')[0];
                }
            } else {
                // Set default date to today
                const dateInput = document.getElementById('appointmentDate');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
            }
            
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Focus on first input
            const firstInput = modal.querySelector('input[type="date"]');
            if (firstInput) {
                firstInput.focus();
            }
        } else {
            console.error('Appointment modal not found');
            alert('Error: Appointment modal not found. Please check the page setup.');
        }
    }

    hideAppointmentModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // Reset form
            const form = document.getElementById('appointmentForm');
            if (form) {
                form.reset();
            }
        }
    }

    handleAppointmentSubmit(event) {
        event.preventDefault();
        
        console.log('Appointment form submitted');
        
        const formData = new FormData(event.target);
        const appointment = {
            appointmentDate: formData.get('appointmentDate'),
            appointmentTime: formData.get('appointmentTime'),
            doctorName: formData.get('doctorName'),
            appointmentType: formData.get('appointmentType'),
            appointmentNotes: formData.get('appointmentNotes') || ''
        };

        console.log('Appointment data extracted:', appointment);
        console.log('Form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // Validate appointment
        if (!this.validateAppointment(appointment)) {
            console.log('Validation failed');
            return;
        }

        // Save appointment
        const success = window.StorageManager.addAppointment(appointment);
        
        console.log('Save result:', success);
        
        if (success) {
            this.showSuccess('Appointment added successfully!');
            this.hideAppointmentModal();
            this.displayCalendar();
            
            // Schedule reminder
            if (window.NotificationManager) {
                window.NotificationManager.scheduleAppointmentReminder(appointment);
            }
        } else {
            this.showError('Failed to add appointment');
        }
    }

    validateAppointment(appointment) {
        console.log('Validating appointment:', appointment);
        
        if (!appointment.appointmentDate || appointment.appointmentDate.toString().trim() === '') {
            console.log('Date validation failed:', appointment.appointmentDate);
            this.showError('Please select an appointment date');
            return false;
        }

        if (!appointment.appointmentTime || appointment.appointmentTime.toString().trim() === '') {
            console.log('Time validation failed:', appointment.appointmentTime);
            this.showError('Please select an appointment time');
            return false;
        }

        if (!appointment.doctorName || appointment.doctorName.toString().trim() === '') {
            console.log('Doctor name validation failed:', appointment.doctorName);
            this.showError('Please enter doctor name');
            return false;
        }

        if (!appointment.appointmentType || appointment.appointmentType.toString().trim() === '') {
            console.log('Appointment type validation failed:', appointment.appointmentType);
            this.showError('Please select appointment type');
            return false;
        }

        // Check if appointment is in the past
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        const now = new Date();
        
        // Only check if it's more than 1 minute in the past to account for processing time
        if (appointmentDateTime < new Date(now.getTime() - 60000)) {
            this.showError('Appointment cannot be in the past');
            return false;
        }

        return true;
    }

    // Utility methods
    isToday(date) {
        const today = new Date();
        return this.isSameDate(date, today);
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'times-circle',
            info: 'info-circle'
        };

        const colorMap = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${iconMap[type]}"></i>
                <span>${message}</span>
            </div>
        `;

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

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Export calendar data
    exportCalendar() {
        const appointments = window.StorageManager.getAppointments();
        const medications = window.StorageManager.getMedications();
        const history = window.StorageManager.getMedicationHistory();

        const calendarData = {
            appointments,
            medications,
            history,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(calendarData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calendar-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess('Calendar data exported successfully!');
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CalendarManager();
});

// Add CSS for calendar events
const style = document.createElement('style');
style.textContent = `
    .event-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #f8f9fa;
        border-left: 4px solid #667eea;
    }
    
    .medication-event {
        border-left-color: #28a745;
    }
    
    .appointment-event {
        border-left-color: #dc3545;
    }
    
    .history-event {
        border-left-color: #6c757d;
    }
    
    .event-time {
        font-weight: 600;
        color: #667eea;
        min-width: 60px;
    }
    
    .event-details {
        flex: 1;
    }
    
    .badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .badge-success {
        background: #28a745;
        color: white;
    }
    
    .badge-danger {
        background: #dc3545;
        color: white;
    }
    
    .no-events {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 20px;
    }
    
    .calendar-day.today {
        background: #e3f2fd;
        font-weight: 600;
    }
`;
document.head.appendChild(style);
