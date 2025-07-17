// ============================================
// EXERCISE MANAGEMENT
// ============================================

class ExerciseManager {
    constructor() {
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
        this.loadExercises();
        this.updateStats();
    }

    setupEventListeners() {
        // Add exercise button
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => this.showExerciseModal());
        }

        // Exercise modal
        this.setupExerciseModal();
    }

    setupExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        const closeBtn = document.getElementById('closeExerciseModal');
        const cancelBtn = document.getElementById('cancelExercise');
        const exerciseForm = document.getElementById('exerciseForm');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideExerciseModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideExerciseModal());
        }

        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => this.handleExerciseSubmit(e));
        }

        // Image upload
        const imageInput = document.getElementById('exerciseImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideExerciseModal();
                }
            });
        }
    }

    loadExercises() {
        const exercises = window.StorageManager.getExercises();
        this.displayExercises(exercises);
    }

    displayExercises(exercises) {
        const exerciseList = document.getElementById('exerciseList');
        const emptyState = document.getElementById('emptyState');

        if (!exerciseList || !emptyState) return;

        if (exercises.length === 0) {
            exerciseList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        exerciseList.style.display = 'grid';
        emptyState.style.display = 'none';

        exerciseList.innerHTML = exercises.map(exercise => 
            this.createExerciseCard(exercise)
        ).join('');

        // Add event listeners to exercise cards
        this.setupExerciseCardListeners();
    }

    createExerciseCard(exercise) {
        const imageUrl = exercise.image || this.getDefaultExerciseImage();
        const lastCompleted = exercise.lastCompleted ? 
            new Date(exercise.lastCompleted).toLocaleDateString() : 
            'Never';

        return `
            <div class="exercise-card" data-exercise-id="${exercise.id}">
                <div class="exercise-header">
                    <div class="exercise-image">
                        <img src="${imageUrl}" alt="${exercise.exerciseName}" onerror="this.src='${this.getDefaultExerciseImage()}'">
                    </div>
                    <div class="exercise-info">
                        <h3>${exercise.exerciseName}</h3>
                        <p class="exercise-frequency">${this.formatFrequency(exercise.exerciseFrequency)}</p>
                        <p class="exercise-duration">
                            <i class="fas fa-clock"></i> ${exercise.exerciseDuration ? exercise.exerciseDuration + ' min' : 'No duration set'}
                        </p>
                        <p class="exercise-time">
                            <i class="fas fa-calendar"></i> ${exercise.exerciseTime ? exercise.exerciseTime : 'No time set'}
                        </p>
                    </div>
                </div>

                ${exercise.exerciseDescription ? `
                    <div class="exercise-description">
                        <p>${exercise.exerciseDescription}</p>
                    </div>
                ` : ''}

                <div class="exercise-stats">
                    <div class="stat">
                        <span class="stat-value">${exercise.totalSessions || 0}</span>
                        <span class="stat-label">Sessions</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${exercise.streak || 0}</span>
                        <span class="stat-label">Streak</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${lastCompleted}</span>
                        <span class="stat-label">Last Done</span>
                    </div>
                </div>

                <div class="exercise-actions">
                    <button class="btn btn-success btn-complete" data-exercise-id="${exercise.id}">
                        <i class="fas fa-check"></i> Mark as Done
                    </button>
                    <button class="btn btn-secondary btn-edit" data-exercise-id="${exercise.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-delete" data-exercise-id="${exercise.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    setupExerciseCardListeners() {
        // Mark as complete buttons
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.closest('.btn-complete').dataset.exerciseId;
                this.markExerciseAsCompleted(exerciseId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.closest('.btn-edit').dataset.exerciseId;
                this.editExercise(exerciseId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseId = e.target.closest('.btn-delete').dataset.exerciseId;
                this.deleteExercise(exerciseId);
            });
        });
    }

    markExerciseAsCompleted(exerciseId) {
        const exercises = window.StorageManager.getExercises();
        const exercise = exercises.find(ex => ex.id === exerciseId);
        
        if (!exercise) return;

        // Check if already completed today
        const today = new Date().toDateString();
        const lastCompleted = exercise.lastCompleted ? 
            new Date(exercise.lastCompleted).toDateString() : null;

        if (lastCompleted === today) {
            this.showWarning('Exercise already completed today!');
            return;
        }

        // Confirm completion
        if (confirm(`Mark "${exercise.exerciseName}" as completed?`)) {
            const success = window.StorageManager.markExerciseAsCompleted(exerciseId);
            
            if (success) {
                this.showSuccess(`${exercise.exerciseName} marked as completed!`);
                this.loadExercises();
                this.updateStats();
            } else {
                this.showError('Failed to mark exercise as completed');
            }
        }
    }

    editExercise(exerciseId) {
        const exercises = window.StorageManager.getExercises();
        const exercise = exercises.find(ex => ex.id === exerciseId);
        
        if (!exercise) return;

        // Populate form with exercise data
        this.populateExerciseForm(exercise);
        this.showExerciseModal(exerciseId);
    }

    deleteExercise(exerciseId) {
        const exercises = window.StorageManager.getExercises();
        const exercise = exercises.find(ex => ex.id === exerciseId);
        
        if (!exercise) return;

        if (confirm(`Are you sure you want to delete "${exercise.exerciseName}"?`)) {
            const success = window.StorageManager.deleteExercise(exerciseId);
            
            if (success) {
                this.showSuccess('Exercise deleted successfully');
                this.loadExercises();
                this.updateStats();
            } else {
                this.showError('Failed to delete exercise');
            }
        }
    }

    showExerciseModal(exerciseId = null) {
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            // Set form mode
            const modalTitle = modal.querySelector('.modal-header h2');
            if (modalTitle) {
                modalTitle.textContent = exerciseId ? 'Edit Exercise' : 'Add Exercise';
            }

            // Store exercise ID for editing
            modal.dataset.exerciseId = exerciseId || '';

            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }

    hideExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // Reset form
            const form = document.getElementById('exerciseForm');
            if (form) {
                form.reset();
            }

            // Clear image preview
            const preview = document.getElementById('exerciseImagePreview');
            if (preview) {
                preview.innerHTML = `
                    <i class="fas fa-running"></i>
                    <p>Upload exercise image</p>
                `;
            }

            // Clear exercise ID
            modal.dataset.exerciseId = '';
        }
    }

    async handleExerciseSubmit(event) {
        event.preventDefault();
        
        console.log('Exercise form submitted');
        
        const formData = new FormData(event.target);
        console.log('Form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        const exerciseData = await this.extractExerciseData(formData);
        console.log('Exercise data extracted:', exerciseData);
        
        // Validate form data
        if (!this.validateExerciseData(exerciseData)) {
            console.log('Validation failed');
            return;
        }

        // Check if editing
        const modal = document.getElementById('exerciseModal');
        const exerciseId = modal ? modal.dataset.exerciseId : null;

        if (exerciseId) {
            this.updateExercise(exerciseId, exerciseData);
        } else {
            this.addExercise(exerciseData);
        }
    }

    async extractExerciseData(formData) {
        const exercise = {};
        
        exercise.exerciseName = formData.get('exerciseName').trim();
        exercise.exerciseDescription = formData.get('exerciseDescription')?.trim() || '';
        exercise.exerciseDuration = formData.get('exerciseDuration') ? 
            parseInt(formData.get('exerciseDuration')) : null;
        exercise.exerciseFrequency = formData.get('exerciseFrequency');
        exercise.exerciseTime = formData.get('exerciseTime') || null;

        // Handle image asynchronously
        const imageInput = document.getElementById('exerciseImage');
        if (imageInput && imageInput.files[0]) {
            const file = imageInput.files[0];
            try {
                exercise.image = await this.readFileAsDataURL(file);
            } catch (error) {
                console.error('Error reading image file:', error);
                this.showError('Error reading image file');
            }
        }

        return exercise;
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    validateExerciseData(exercise) {
        if (!exercise.exerciseName) {
            this.showError('Exercise name is required');
            return false;
        }

        if (exercise.exerciseDuration && exercise.exerciseDuration <= 0) {
            this.showError('Duration must be a positive number');
            return false;
        }

        return true;
    }

    addExercise(exerciseData) {
        const success = window.StorageManager.addExercise(exerciseData);
        
        if (success) {
            this.showSuccess('Exercise added successfully!');
            this.hideExerciseModal();
            this.loadExercises();
            this.updateStats();
        } else {
            this.showError('Failed to add exercise');
        }
    }

    updateExercise(exerciseId, exerciseData) {
        const success = window.StorageManager.updateExercise(exerciseId, exerciseData);
        
        if (success) {
            this.showSuccess('Exercise updated successfully!');
            this.hideExerciseModal();
            this.loadExercises();
            this.updateStats();
        } else {
            this.showError('Failed to update exercise');
        }
    }

    populateExerciseForm(exercise) {
        // Populate form fields
        const nameInput = document.getElementById('exerciseName');
        if (nameInput) nameInput.value = exercise.exerciseName || '';

        const descriptionInput = document.getElementById('exerciseDescription');
        if (descriptionInput) descriptionInput.value = exercise.exerciseDescription || '';

        const durationInput = document.getElementById('exerciseDuration');
        if (durationInput) durationInput.value = exercise.exerciseDuration || '';

        const frequencySelect = document.getElementById('exerciseFrequency');
        if (frequencySelect) frequencySelect.value = exercise.exerciseFrequency || 'daily';

        const timeInput = document.getElementById('exerciseTime');
        if (timeInput) timeInput.value = exercise.exerciseTime || '';

        // Show image if exists
        if (exercise.image) {
            const preview = document.getElementById('exerciseImagePreview');
            if (preview) {
                preview.innerHTML = `<img src="${exercise.image}" alt="Exercise Image">`;
            }
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.showError('Image size must be less than 2MB');
            return;
        }

        // Create file reader
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('exerciseImagePreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Exercise Preview">`;
            }
        };
        reader.readAsDataURL(file);
    }

    updateStats() {
        const exercises = window.StorageManager.getExercises();
        
        // Calculate stats
        const totalExercises = exercises.length;
        const completedToday = this.getCompletedTodayCount(exercises);
        const maxStreak = this.getMaxStreak(exercises);

        // Update UI
        this.updateStatElement('totalExercises', totalExercises);
        this.updateStatElement('completedToday', completedToday);
        this.updateStatElement('streakDays', maxStreak);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getCompletedTodayCount(exercises) {
        const today = new Date().toDateString();
        return exercises.filter(exercise => {
            const lastCompleted = exercise.lastCompleted ? 
                new Date(exercise.lastCompleted).toDateString() : null;
            return lastCompleted === today;
        }).length;
    }

    getMaxStreak(exercises) {
        return Math.max(...exercises.map(exercise => exercise.streak || 0), 0);
    }

    formatFrequency(frequency) {
        const frequencyMap = {
            'daily': 'Daily',
            'weekly': 'Weekly',
            'alternate': 'Alternate Days',
            'custom': 'Custom'
        };
        return frequencyMap[frequency] || frequency;
    }

    getDefaultExerciseImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTAiIGZpbGw9IiNmOGY5ZmEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxOCIgeT0iMTgiPgo8cGF0aCBkPSJNMTMuNDkgNS40OGMwLTEuMTAtLjktMi0yLTJzLTIgLjktMiAyIC45IDIgMiAyIDItLjkgMi0yem0tMy4zIDEzLjdsLTEuNDItNC4yNWMtLjMtLjg4LjE4LTEuOCAxLjA4LTIuMWwxLjIxLS40MWMuODMtLjI4IDEuNzMtLjI4IDIuNTYgMGwxLjIxLjQxYy45LjMgMS4zOCAxLjIyIDEuMDggMi4xbC0xLjQyIDQuMjVjLS4zNC45Mi0xLjQyIDEuMjktMi4zNC43MUwyIDIyLjQyVjI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOUw0IDI0aC0uNVYyMC4zOGMwLS4yNi4xMS0uNTIuMjktLjcxbDMuMjUtMy4xMi0uNDItMS4xOSIgZmlsbD0iIzZjNzU3ZCIvPgo8L3N2Zz4KPC9zdmc+Cg==';
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
}

// Initialize exercise manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ExerciseManager();
});

// Add CSS for exercise stats
const style = document.createElement('style');
style.textContent = `
    .exercise-stats {
        display: flex;
        justify-content: space-around;
        margin: 15px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .stat {
        text-align: center;
    }
    
    .stat-value {
        display: block;
        font-size: 1.2rem;
        font-weight: 600;
        color: #667eea;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #6c757d;
    }
    
    .exercise-description {
        margin: 10px 0;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #666;
    }
    
    .exercise-frequency {
        color: #667eea;
        font-weight: 600;
    }
    
    .exercise-duration,
    .exercise-time {
        font-size: 0.9rem;
        color: #6c757d;
        margin: 2px 0;
    }
    
    .exercise-duration i,
    .exercise-time i {
        margin-right: 5px;
    }
`;
document.head.appendChild(style);
