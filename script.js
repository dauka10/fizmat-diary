// FizmatDiary Application
class FizmatDiary {
    constructor() {
        this.currentHomeworkId = null;
        this.isEditing = false;
        this.highContrastMode = false;
        this.reducedMotionMode = false;
        this.currentUser = this.getCurrentUser();
        this.homework = this.loadHomework();
        this.currentCategory = '10H';
        this.adminPassword = '551373'; // Secret admin password
        this.isAdminLoggedIn = false;
        // Votes state - HIDDEN
        // this.votes = [];
        // this.currentVoteId = null;
        // this.currentVoteChoices = [];
        
        this.initializeElements();
        this.bindEvents();
        this.initializeAccessibility();
        
        if (this.currentUser) {
            this.showMainApp();
        } else {
            // Show login screen
            this.showLoginScreen();
        }
    }

    // Votes helpers (class-scoped storage) - HIDDEN
    /*
    getClassVotesKey(category) {
        const cat = category || this.currentCategory || '10H';
        return `fizmat-diary-votes-class-${cat}`;
    }

    loadVotes(category) {
        const key = this.getClassVotesKey(category);
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading votes:', error);
            return [];
        }
    }

    saveVotes(category) {
        try {
            const key = this.getClassVotesKey(category);
            localStorage.setItem(key, JSON.stringify(this.votes));
        } catch (error) {
            console.error('Error saving votes:', error);
            this.showNotification('Error saving votes. Please try again.', 'warning');
        }
    }
    */

    // Votes UI Logic - HIDDEN
    /*
    startNewVote() {
        if (!this.currentUser || this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can create votes.', 'warning');
            return;
        }
        this.currentVoteId = this.generateId();
        this.currentVoteChoices = [];
        if (this.voteTopic) this.voteTopic.value = '';
        if (this.voteGivenDate) this.voteGivenDate.value = '';
        if (this.voteDueDate) this.voteDueDate.value = '';
        if (this.choicesList) this.choicesList.innerHTML = '';
        if (this.votesEditor) this.votesEditor.style.display = 'block';
        if (this.voteTopic) this.voteTopic.focus();
        this.announceToScreenReader('Creating new vote');
    }

    addChoice() {
        const text = (this.newChoiceInput?.value || '').trim();
        if (!text) return;
        this.currentVoteChoices.push({ text, votes: 0 });
        this.newChoiceInput.value = '';
        this.renderChoiceList();
    }

    renderChoiceList() {
        if (!this.choicesList) return;
        this.choicesList.innerHTML = '';
        this.currentVoteChoices.forEach((choice, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${this.escapeHtml(choice.text)}</span>
                <button class="btn btn-danger btn-sm" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            li.querySelector('button').addEventListener('click', () => {
                this.currentVoteChoices.splice(index, 1);
                this.renderChoiceList();
            });
            this.choicesList.appendChild(li);
        });
    }

    saveVote() {
        if (!this.currentUser || this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can create votes.', 'warning');
            return;
        }
        const topic = (this.voteTopic?.value || '').trim();
        if (!topic) {
            this.showNotification('Please enter a topic.', 'warning');
            return;
        }
        if (!this.currentVoteChoices.length) {
            this.showNotification('Add at least one choice.', 'warning');
            return;
        }
        const vote = {
            id: this.currentVoteId || this.generateId(),
            topic,
            category: this.currentCategory,
            givenDate: this.voteGivenDate?.value || null,
            dueDate: this.voteDueDate?.value || null,
            choices: this.currentVoteChoices.map(c => ({ text: c.text, votes: c.votes || 0 })),
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.id
        };
        // insert at top; ensure unique by id
        const existing = this.loadVotes(this.currentCategory).filter(v => v.id !== vote.id);
        this.votes = [vote, ...existing];
        this.saveVotes(this.currentCategory);
        this.renderVotes();
        this.showNotification('Vote created successfully!', 'success');
        this.cancelVote();
    }

    cancelVote() {
        this.currentVoteId = null;
        this.currentVoteChoices = [];
        if (this.voteTopic) this.voteTopic.value = '';
        if (this.voteGivenDate) this.voteGivenDate.value = '';
        if (this.voteDueDate) this.voteDueDate.value = '';
        if (this.choicesList) this.choicesList.innerHTML = '';
    }

    castVote(voteId, choiceIndex) {
        if (!this.currentUser || this.currentUser.role !== 'student') {
            this.showNotification('Only students can vote.', 'warning');
            return;
        }
        const votes = this.loadVotes(this.currentCategory);
        const vote = votes.find(v => v.id === voteId);
        if (!vote) return;
        const votedKey = `fizmat-diary-voted-${voteId}-${this.currentUser.id}`;
        if (localStorage.getItem(votedKey)) {
            this.showNotification('You have already voted.', 'info');
            return;
        }
        const choice = vote.choices[choiceIndex];
        if (!choice) return;
        choice.votes = (choice.votes || 0) + 1;
        localStorage.setItem(votedKey, '1');
        this.votes = votes;
        this.saveVotes(this.currentCategory);
        this.renderVotes();
        this.showNotification('Vote recorded!', 'success');
    }

    renderVotes() {
        this.votes = this.loadVotes(this.currentCategory);
        if (!this.votesList || !this.votesCount) return;
        this.votesList.innerHTML = '';
        const count = this.votes.length;
        this.votesCount.textContent = `${count} ${count === 1 ? 'vote' : 'votes'}`;
        if (count === 0) {
            this.votesList.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 1rem;">
                    <i class=\"fas fa-poll\" style=\"font-size: 1.5rem; margin-bottom: 0.5rem; display: block;\"></i>
                    <p>No votes yet. Teachers can start one using \"Add your idea\".</p>
                </div>
            `;
            return;
        }
        this.votes.forEach(vote => {
            const item = document.createElement('div');
            item.className = 'votes-item';
            const totalVotes = vote.choices.reduce((acc, c) => acc + (c.votes || 0), 0);
            item.innerHTML = `
                <div class=\"votes-item-title\" style=\"font-weight:600; display:flex; align-items:center; justify-content:space-between;\">
                    <span>${this.escapeHtml(vote.topic)}</span>
                    ${this.currentUser && this.currentUser.role === 'teacher' ? `
                        <span>
                            <button class=\\\"btn btn-outline btn-sm vote-edit\\\" data-vote-id=\\\"${vote.id}\\\">Edit</button>
                            <button class=\\\"btn btn-danger btn-sm vote-delete\\\" data-vote-id=\\\"${vote.id}\\\">Delete</button>
                        </span>
                    ` : ''}
                </div>
                <div style=\"font-size:.875rem; color:#64748b;\">${vote.category} • ${totalVotes} vote${totalVotes===1?'':'s'}</div>
                <div class=\"votes-item-choices\" style=\"margin-top:.5rem; display:flex; flex-direction:column; gap:.5rem;\"></div>
            `;
            const choicesContainer = item.querySelector('.votes-item-choices');
            vote.choices.forEach((choice, idx) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.innerHTML = `
                    <span>${this.escapeHtml(choice.text)}</span>
                    <div style=\"display:flex; align-items:center; gap:.5rem;\">
                        <span style=\"color:#64748b; font-size:.875rem;\">${choice.votes || 0}</span>
                        <button class=\"btn btn-outline btn-sm vote-cast\" data-vote-id=\"${vote.id}\" data-choice-index=\"${idx}\">Vote</button>
                    </div>
                `;
                const button = row.querySelector('button');
                button.addEventListener('click', () => this.castVote(vote.id, idx));
                if (this.currentUser && this.currentUser.role !== 'student') {
                    button.disabled = true;
                }
                choicesContainer.appendChild(row);
            });
            this.votesList.appendChild(item);
        });
        this.bindVoteButtons();
        
        // Update polls window if it's visible
        if (this.pollsWindow && this.pollsWindow.style.display !== 'none') {
            this.renderPollsWindow();
        }
    }

    bindVoteButtons() {
        if (!this.votesList) return;
        if (this.currentUser && this.currentUser.role === 'teacher') {
            this.votesList.querySelectorAll('.vote-edit').forEach(btn => {
                btn.addEventListener('click', () => this.editVote(btn.getAttribute('data-vote-id')));
            });
            this.votesList.querySelectorAll('.vote-delete').forEach(btn => {
                btn.addEventListener('click', () => this.deleteVote(btn.getAttribute('data-vote-id')));
            });
        }
    }

    editVote(voteId) {
        const votes = this.loadVotes(this.currentCategory);
        const vote = votes.find(v => v.id === voteId);
        if (!vote) return;
        this.currentVoteId = vote.id;
        this.currentVoteChoices = vote.choices.map(c => ({ text: c.text, votes: c.votes || 0 }));
        if (this.voteTopic) this.voteTopic.value = vote.topic;
        if (this.voteGivenDate) this.voteGivenDate.value = vote.givenDate || '';
        if (this.voteDueDate) this.voteDueDate.value = vote.dueDate || '';
        this.renderChoiceList();
        if (this.votesEditor) this.votesEditor.style.display = 'block';
        if (this.voteTopic) this.voteTopic.focus();
    }

    deleteVote(voteId) {
        this.showConfirmModal(
            'Delete Vote',
            'Are you sure you want to delete this vote? This action cannot be undone.',
            () => {
                const remaining = this.loadVotes(this.currentCategory).filter(v => v.id !== voteId);
                this.votes = remaining;
                this.saveVotes(this.currentCategory);
                this.renderVotes();
                this.showNotification('Vote deleted successfully', 'success');
                if (this.currentVoteId === voteId) {
                    this.cancelVote();
                }
            }
        );
    }
    */

    initializeElements() {
        // Main elements
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.homeworkEditor = document.getElementById('homeworkEditor');
        this.homeworkList = document.getElementById('homeworkList');
        this.homeworkCount = document.getElementById('homeworkCount');
        this.searchInput = document.getElementById('searchInput');
        this.subjectsGrid = document.getElementById('subjectsGrid');
        this.selectedClassSpan = document.getElementById('selectedClass');
        this.subjectWindow = document.getElementById('subjectWindow');
        this.subjectWindowTitle = document.getElementById('subjectWindowTitle');
        this.subjectWindowClass = document.getElementById('subjectWindowClass');
        this.subjectHomeworkList = document.getElementById('subjectHomeworkList');
        this.backToSubjectsBtn = document.getElementById('backToSubjectsBtn');
        this.addSubjectHomeworkBtn = document.getElementById('addSubjectHomeworkBtn');
        this.backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
        
        // Admin login modal elements
        this.adminLoginModal = document.getElementById('adminLoginModal');
        this.adminPasswordInput = document.getElementById('adminPassword');
        this.adminPasswordToggle = document.getElementById('adminPasswordToggle');
        this.adminLoginError = document.getElementById('adminLoginError');
        this.adminLoginCancel = document.getElementById('adminLoginCancel');
        this.adminLoginConfirm = document.getElementById('adminLoginConfirm');
        
        // Secret admin access elements
        this.secretAdminAccess = document.getElementById('secretAdminAccess');
        this.secretPassword = document.getElementById('secretPassword');
        this.secretAccessBtn = document.getElementById('secretAccessBtn');
        this.secretCancelBtn = document.getElementById('secretCancelBtn');
        
        // Editor elements
        this.homeworkTitle = document.getElementById('homeworkTitle');
        this.homeworkContent = document.getElementById('homeworkContent');
        this.homeworkCategory = document.getElementById('homeworkCategory');
        this.homeworkSubject = document.getElementById('homeworkSubject');
        this.homeworkGivenDate = document.getElementById('homeworkGivenDate');
        this.homeworkDueDate = document.getElementById('homeworkDueDate');
        this.homeworkDate = document.getElementById('homeworkDate');
        this.wordCount = document.getElementById('wordCount');
        
        // File upload elements
        this.fileUploadSection = document.getElementById('fileUploadSection');
        this.homeworkFiles = document.getElementById('homeworkFiles');
        this.filePreviewContainer = document.getElementById('filePreviewContainer');
        
        // Buttons
        this.welcomeAddBtn = document.getElementById('welcomeAddBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Modal elements
        this.confirmModal = document.getElementById('confirmModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.modalCancel = document.getElementById('modalCancel');
        this.modalConfirm = document.getElementById('modalConfirm');
        
        // Accessibility / Theme elements
        this.liveRegion = document.getElementById('liveRegion');
        // this.themeToggle = document.getElementById('themeToggle'); // REMOVED - Dark mode button not working
        
        // Admin panel elements
        this.adminPanel = document.getElementById('adminPanel');
        this.refreshDataBtn = document.getElementById('refreshDataBtn');
        this.backToAppBtn = document.getElementById('backToAppBtn');
        this.userSearch = document.getElementById('userSearch');
        this.exportUsersBtn = document.getElementById('exportUsersBtn');
        this.usersTableBody = document.getElementById('usersTableBody');
        this.totalUsers = document.getElementById('totalUsers');
        this.totalEntries = document.getElementById('totalEntries');
        
        this.todayEntries = document.getElementById('todayEntries');
        this.activeUsers = document.getElementById('activeUsers');
        this.storageUsed = document.getElementById('storageUsed');
        this.lastBackup = document.getElementById('lastBackup');
        
        // Authentication elements
        this.authContainer = document.getElementById('authContainer');
        this.mainApp = document.getElementById('mainApp');
        this.signInForm = document.getElementById('signInForm');
        this.signUpForm = document.getElementById('signUpForm');
        this.signInFormElement = document.getElementById('signInFormElement');
        this.signUpFormElement = document.getElementById('signUpFormElement');
        this.showSignUpBtn = document.getElementById('showSignUp');
        this.showSignInBtn = document.getElementById('showSignIn');
        this.userMenuBtn = document.getElementById('userMenuBtn');
        this.userDropdown = document.getElementById('userDropdown');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userName = document.getElementById('userName');
        this.userDisplayName = document.getElementById('userDisplayName');
        this.userEmail = document.getElementById('userEmail');

        // Votes elements - HIDDEN
        /*
        this.votesSidebar = document.getElementById('votesSidebar');
        this.votesList = document.getElementById('votesList');
        this.votesCount = document.getElementById('votesCount');
        this.votesEditor = document.getElementById('votesEditor');
        this.voteTopic = document.getElementById('voteTopic');
        this.voteGivenDate = document.getElementById('voteGivenDate');
        this.voteDueDate = document.getElementById('voteDueDate');
        this.addIdeaBtn = document.getElementById('addIdeaBtn');
        this.saveVoteBtn = document.getElementById('saveVoteBtn');
        this.cancelVoteBtn = document.getElementById('cancelVoteBtn');
        this.newChoiceInput = document.getElementById('newChoiceInput');
        this.addChoiceBtn = document.getElementById('addChoiceBtn');
        this.choicesList = document.getElementById('choicesList');
        this.votesWelcome = document.getElementById('votesWelcome');
        this.startPollBtn = document.getElementById('startPollBtn');
        
        // Polls Window elements
        this.pollsWindow = document.getElementById('pollsWindow');
        this.pollsList = document.getElementById('pollsList');
        this.seeVotesBtn = document.getElementById('seeVotesBtn');
        */
    }

    bindEvents() {
        // Add homework buttons
        this.welcomeAddBtn.addEventListener('click', () => this.createNewHomework());
        
        // Editor events
        this.saveBtn.addEventListener('click', () => this.saveHomework());
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.filterHomework(e.target.value));
        
        // Word count update
        this.homeworkContent.addEventListener('input', () => this.updateWordCount());
        
        // Ensure Enter and Space keys work in textarea
        this.homeworkContent.addEventListener('keydown', (e) => {
            // Allow Enter and Space keys to work normally in textarea
            if (e.key === 'Enter' || e.key === ' ') {
                // Stop propagation to prevent other handlers from interfering
                e.stopPropagation();
                // Don't prevent default - let these keys work normally
                return;
            }
        }, true); // Use capture phase to handle before other listeners
        
        // File upload events
        this.homeworkFiles.addEventListener('change', (e) => this.handleFileUpload(e));
        this.fileUploadSection.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadSection.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadSection.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Category selection
        this.homeworkCategory.addEventListener('change', (e) => this.handleCategoryChange(e));
        
        // Class selection
        document.addEventListener('click', (e) => this.handleClassClick(e));
        document.addEventListener('keydown', (e) => this.handleClassKeydown(e));
        
        // Subject selection
        document.addEventListener('click', (e) => this.handleSubjectClick(e));
        document.addEventListener('keydown', (e) => this.handleSubjectKeydown(e));
        
        // Subject window events
        this.backToSubjectsBtn.addEventListener('click', () => this.backToSubjects());
        this.addSubjectHomeworkBtn.addEventListener('click', () => this.addSubjectHomework());
        if (this.backToWelcomeBtn) {
            this.backToWelcomeBtn.addEventListener('click', () => this.backToWelcome());
        }
        
        // Admin login events
        this.adminLoginCancel.addEventListener('click', () => this.closeAdminLogin());
        this.adminLoginConfirm.addEventListener('click', () => this.handleAdminLogin());
        this.adminPasswordToggle.addEventListener('click', () => this.toggleAdminPasswordVisibility());
        this.adminPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleAdminLogin();
            }
        });
        
        // Secret admin access events
        this.secretAccessBtn.addEventListener('click', () => this.handleSecretAdminAccess());
        this.secretCancelBtn.addEventListener('click', () => this.closeSecretAdminAccess());
        this.secretPassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSecretAdminAccess();
            } else if (e.key === 'Escape') {
                this.closeSecretAdminAccess();
            }
        });
        
        // Modal events
        this.modalCancel.addEventListener('click', () => this.closeModal());
        this.modalConfirm.addEventListener('click', () => this.confirmAction());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Auto-save functionality
        this.homeworkContent.addEventListener('input', () => this.autoSave());
        this.homeworkTitle.addEventListener('input', () => this.autoSave());
        
        // Ensure Enter and Space keys work in title input
        this.homeworkTitle.addEventListener('keydown', (e) => {
            // Allow Enter and Space keys to work normally in input
            if (e.key === 'Enter' || e.key === ' ') {
                // Stop propagation to prevent other handlers from interfering
                e.stopPropagation();
                // Don't prevent default - let these keys work normally
                return;
            }
        }, true); // Use capture phase to handle before other listeners
        
        // Ensure Enter and Space keys work in other input fields
        [this.homeworkSubject, this.homeworkGivenDate, this.homeworkDueDate].forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    // Allow Enter and Space keys to work normally in input
                    if (e.key === 'Enter' || e.key === ' ') {
                        // Stop propagation to prevent other handlers from interfering
                        e.stopPropagation();
                        // Don't prevent default - let these keys work normally
                        return;
                    }
                }, true); // Use capture phase to handle before other listeners
            }
        });

        // Vote-related input fields - HIDDEN
        /*
        // Ensure Enter and Space keys work in other input fields
        [this.homeworkSubject, this.homeworkGivenDate, this.homeworkDueDate, this.voteGivenDate, this.voteDueDate, this.newChoiceInput].forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    // Allow Enter and Space keys to work normally in input
                    if (e.key === 'Enter' || e.key === ' ') {
                        // Stop propagation to prevent other handlers from interfering
                        e.stopPropagation();
                        // Don't prevent default - let these keys work normally
                        return;
                    }
                }, true); // Use capture phase to handle before other listeners
            }
        });

        // Ensure Enter and Space keys work in vote topic input (same as Add First Assignment title)
        if (this.voteTopic) {
            this.voteTopic.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    return;
                }
            }, true);
        }
        */
        
        // Theme control - REMOVED (Dark mode button not working properly)
        // if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Modal accessibility
        this.confirmModal.addEventListener('keydown', (e) => this.handleModalKeyboard(e));
        
        // Trap focus in modal
        this.modalCancel.addEventListener('keydown', (e) => this.handleModalFocus(e));
        this.modalConfirm.addEventListener('keydown', (e) => this.handleModalFocus(e));
        
        // Authentication events
        this.signInFormElement.addEventListener('submit', (e) => this.handleSignIn(e));
        this.signUpFormElement.addEventListener('submit', (e) => this.handleSignUp(e));
        this.showSignUpBtn.addEventListener('click', () => this.showSignUpForm());
        this.showSignInBtn.addEventListener('click', () => this.showSignInForm());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.userMenuBtn.addEventListener('click', () => this.toggleUserMenu());
        
        // Password toggle events
        this.setupPasswordToggles();
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Admin panel events
        this.refreshDataBtn.addEventListener('click', () => this.refreshAdminData());
        this.backToAppBtn.addEventListener('click', () => this.hideAdminPanel());
        this.userSearch.addEventListener('input', (e) => this.filterUsers(e.target.value));
        this.exportUsersBtn.addEventListener('click', () => this.exportUsers());
        this.viewRegistrationBtn.addEventListener('click', () => this.showRegistrationWindow());
        
        // Edit and Delete button event listeners
        this.bindEditDeleteButtons();
        
        // Votes events - HIDDEN
        /*
        if (this.addIdeaBtn) this.addIdeaBtn.addEventListener('click', () => this.startNewVote());
        if (this.saveVoteBtn) this.saveVoteBtn.addEventListener('click', () => this.saveVote());
        if (this.cancelVoteBtn) this.cancelVoteBtn.addEventListener('click', () => this.cancelVote());
        if (this.addChoiceBtn) this.addChoiceBtn.addEventListener('click', () => this.addChoice());
        if (this.startPollBtn) this.startPollBtn.addEventListener('click', () => {
            if (this.votesWelcome) this.votesWelcome.style.display = 'none';
            if (this.votesEditor) this.votesEditor.style.display = 'block';
            this.startNewVote();
        });

        // See Votes button
        if (this.seeVotesBtn) this.seeVotesBtn.addEventListener('click', () => this.togglePollsWindow());
        */

    }

    // Poll-related methods - HIDDEN
    /*
    togglePollsWindow() {
        if (!this.pollsWindow) return;
        
        const isVisible = this.pollsWindow.style.display !== 'none';
        if (isVisible) {
            this.pollsWindow.style.display = 'none';
        } else {
            this.pollsWindow.style.display = 'block';
            this.renderPollsWindow();
        }
    }

    renderPollsWindow() {
        if (!this.pollsList) return;
        
        const votes = this.loadVotes(this.currentCategory);
        const now = new Date();
        
        // Filter active polls
        const activePolls = votes.filter(vote => {
            if (!vote.isActive) return false;
            if (vote.dueDate) {
                const dueDate = new Date(vote.dueDate);
                return dueDate >= now;
            }
            return true;
        });

        if (activePolls.length === 0) {
            this.pollsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #64748b;">
                    <i class="fas fa-poll" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No active polls available</p>
                </div>
            `;
            return;
        }

        this.pollsList.innerHTML = activePolls.map(poll => {
            const isClosed = poll.dueDate && new Date(poll.dueDate) < now;
            const statusClass = isClosed ? 'closed' : 'active';
            const statusText = isClosed ? 'Closed' : 'Active';
            
            return `
                <div class="poll-item">
                    <div class="poll-item-title">${this.escapeHtml(poll.title || poll.topic)}</div>
                    <div class="poll-item-meta">
                        <span class="poll-status ${statusClass}">${statusText}</span>
                        <span>•</span>
                        <span>${poll.category}</span>
                        <span>•</span>
                        <span>${new Date(poll.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${poll.content ? `<div class="poll-item-content">${this.escapeHtml(poll.content)}</div>` : ''}
                    ${poll.files && poll.files.length > 0 ? `
                        <div class="poll-item-files">
                            ${poll.files.map(file => `
                                <div class="file-item">
                                    <i class="fas fa-paperclip"></i>
                                    ${this.escapeHtml(file.name)}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="poll-item-actions">
                        <button class="btn btn-outline btn-sm" onclick="app.respondToPoll('${poll.id}')">
                            <i class="fas fa-reply"></i>
                            ${isClosed ? 'View Details' : 'Respond'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    respondToPoll(pollId) {
        // Placeholder for poll response functionality
        this.showNotification('Poll response feature coming soon!', 'info');
    }
    */

    bindEditDeleteButtons() {
        // Bind edit buttons
        const editButtons = document.querySelectorAll('.edit-button');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleEdit(e));
        });

        // Bind delete buttons
        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleDelete(e));
        });
    }

    handleEdit(e) {
        e.preventDefault();
        e.stopPropagation();
        const homeworkId = e.target.closest('[data-homework-id]')?.getAttribute('data-homework-id') ||
                          e.target.closest('button')?.getAttribute('data-homework-id');
        if (homeworkId) {
            this.editHomework(homeworkId);
        }
    }

    handleDelete(e) {
        e.preventDefault();
        e.stopPropagation();
        const homeworkId = e.target.closest('[data-homework-id]')?.getAttribute('data-homework-id') ||
                          e.target.closest('button')?.getAttribute('data-homework-id');
        if (homeworkId) {
            this.deleteHomework(homeworkId);
        }
    }

    createNewHomework() {
        // Check if user is a teacher
        if (this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can create homework assignments', 'warning');
            return;
        }
        
        this.currentHomeworkId = this.generateId();
        this.isEditing = true;
        
        // Clear editor
        this.homeworkTitle.value = '';
        this.homeworkContent.value = '';
        this.homeworkCategory.value = this.currentCategory;
        this.homeworkGivenDate.value = '';
        this.homeworkDueDate.value = '';
        this.homeworkDate.textContent = this.formatDate(new Date());
        this.clearFileUploads();
        this.updateWordCount();
        
        // Show editor, hide welcome screen and subjects grid
        this.welcomeScreen.style.display = 'none';
        this.subjectsGrid.style.display = 'none';
        this.homeworkEditor.style.display = 'flex';
        this.homeworkEditor.classList.add('active');
        
        // Focus on title
        this.homeworkTitle.focus();
        
        // Announce to screen readers
        this.announceToScreenReader('Creating new homework assignment. Focus moved to title field.');
        
        // Add animation
        this.homeworkEditor.classList.add('fade-in');
    }

    editHomework(homeworkId) {
        // Check if user has permission to edit homework
        if (!this.currentUser || this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can edit homework assignments.', 'warning');
            return;
        }
        
        const homework = this.homework.find(h => h.id === homeworkId);
        if (!homework) return;
        
        this.currentHomeworkId = homeworkId;
        this.isEditing = true;
        
        // Populate editor
        this.homeworkTitle.value = homework.title;
        this.homeworkContent.value = homework.content;
        this.homeworkCategory.value = homework.category;
        this.homeworkSubject.value = homework.subject || '';
        this.homeworkGivenDate.value = homework.givenDate || '';
        this.homeworkDueDate.value = homework.dueDate || '';
        this.homeworkDate.textContent = this.formatDate(new Date(homework.date));
        this.updateWordCount();
        
        // Show editor, hide welcome screen
        this.welcomeScreen.style.display = 'none';
        this.homeworkEditor.style.display = 'flex';
        this.homeworkEditor.classList.add('active');
        
        // Focus on content
        this.homeworkContent.focus();
        
        // Announce to screen readers
        this.announceToScreenReader(`Editing homework: ${homework.title}. Focus moved to content field.`);
        
        // Add animation
        this.homeworkEditor.classList.add('fade-in');
    }

    saveHomework() {
        // Check if user has permission to save homework
        if (!this.currentUser || this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can create or edit homework assignments.', 'warning');
            return;
        }
        
        const title = this.homeworkTitle.value.trim();
        const content = this.homeworkContent.value.trim();
        const category = this.homeworkCategory.value;
        const subject = this.homeworkSubject.value;
        const givenDate = this.homeworkGivenDate.value;
        const dueDate = this.homeworkDueDate.value;
        
        if (!title && !content) {
            this.showNotification('Please add a title or content before saving.', 'warning');
            return;
        }
        
        if (!subject) {
            this.showNotification('Please select a subject before saving.', 'warning');
            return;
        }
        
        const homework = {
            id: this.currentHomeworkId,
            title: title || 'Untitled Assignment',
            content: content,
            category: category,
            subject: subject,
            givenDate: givenDate || null,
            dueDate: dueDate || null,
            files: this.getUploadedFiles(),
            date: new Date().toISOString(),
            wordCount: this.getWordCount(content)
        };
        
        // Update or add homework
        const existingIndex = this.homework.findIndex(h => h.id === this.currentHomeworkId);
        if (existingIndex >= 0) {
            this.homework[existingIndex] = homework;
        } else {
            this.homework.unshift(homework);
        }
        
        this.saveHomeworkData(this.currentCategory);
        this.renderHomework();
        this.updateHomeworkCount();
        this.updateCategoryCounts();
        
        // If we're in a subject window, refresh the subject homework list
        if (this.currentSubject) {
            this.loadSubjectHomework(this.currentSubject);
        }
        
        this.showNotification('Homework saved successfully!', 'success');
        
        // Clear editor
        this.cancelEdit();
    }

    cancelEdit() {
        this.currentHomeworkId = null;
        this.isEditing = false;
        
        // Clear editor
        this.homeworkTitle.value = '';
        this.homeworkContent.value = '';
        
        // Show appropriate window based on current state
        if (this.homework.length === 0) {
            this.welcomeScreen.style.display = 'flex';
            this.subjectsGrid.style.display = 'none';
            this.subjectWindow.style.display = 'none';
            this.homeworkEditor.style.display = 'none';
            this.homeworkEditor.classList.remove('active');
        } else if (this.currentSubject) {
            // If we're in a subject window, return to it
            this.welcomeScreen.style.display = 'none';
            this.subjectsGrid.style.display = 'none';
            this.subjectWindow.style.display = 'block';
            this.homeworkEditor.style.display = 'none';
            this.homeworkEditor.classList.remove('active');
            this.loadSubjectHomework(this.currentSubject);
        } else {
            this.welcomeScreen.style.display = 'none';
            this.subjectsGrid.style.display = 'block';
            this.subjectWindow.style.display = 'none';
            this.homeworkEditor.style.display = 'none';
            this.homeworkEditor.classList.remove('active');
        }
        
        // Remove active class from all homework items
        document.querySelectorAll('.homework-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    deleteEntry(entryId) {
        this.showConfirmModal(
            'Delete Homework',
            'Are you sure you want to delete this homework assignment? This action cannot be undone.',
            () => {
                this.homework = this.homework.filter(h => h.id !== entryId);
                this.saveHomeworkData(this.currentCategory);
                this.renderHomework();
                this.updateHomeworkCount();
                this.updateCategoryCounts();
                this.showNotification('Homework deleted successfully!', 'success');
                
                // If we were editing this homework, cancel edit
                if (this.currentHomeworkId === entryId) {
                    this.cancelEdit();
                }
            }
        );
    }






    getWordCount(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showConfirmModal(title, message, onConfirm) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.confirmModal.classList.add('active');
        
        // Store the confirm callback
        this.pendingConfirm = onConfirm;
    }

    closeModal() {
        this.confirmModal.classList.remove('active');
        this.pendingConfirm = null;
    }

    confirmAction() {
        if (this.pendingConfirm) {
            this.pendingConfirm();
        }
        this.closeModal();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }


    autoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Set new timeout for auto-save
        this.autoSaveTimeout = setTimeout(() => {
            if (this.isEditing && this.homeworkTitle.value.trim() && this.homeworkContent.value.trim()) {
                // Auto-save to localStorage without showing notification
                const homework = {
                    id: this.currentHomeworkId,
                    title: this.homeworkTitle.value.trim(),
                    content: this.homeworkContent.value.trim(),
                    category: this.homeworkCategory.value,
                    date: new Date().toISOString(),
                    wordCount: this.getWordCount(this.homeworkContent.value)
                };
                
                const existingIndex = this.homework.findIndex(h => h.id === this.currentHomeworkId);
                if (existingIndex >= 0) {
                    this.homework[existingIndex] = homework;
                } else {
                    this.homework.unshift(homework);
                }
                
                this.saveHomeworkData(this.currentCategory);
            }
        }, 2000); // Auto-save after 2 seconds of inactivity
    }


    // Accessibility Methods
    initializeAccessibility() {
        // Load theme preference - DISABLED (Dark mode button removed)
        /*
        const storedTheme = localStorage.getItem('fizmat-theme') || 'light';
        document.body.classList.toggle('theme-dark', storedTheme === 'dark');
        if (this.themeToggle) this.themeToggle.innerHTML = storedTheme === 'dark' ? '<i class="fas fa-sun" aria-hidden="true"></i> Bright Mode' : '<i class="fas fa-moon" aria-hidden="true"></i> Dark Mode';
        */
    }

    // toggleTheme() method removed - Dark mode button not working properly
    /*
    toggleTheme() {
        const isDark = document.body.classList.toggle('theme-dark');
        localStorage.setItem('fizmat-theme', isDark ? 'dark' : 'light');
        if (this.themeToggle) this.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun" aria-hidden="true"></i> Bright Mode' : '<i class="fas fa-moon" aria-hidden="true"></i> Dark Mode';
        this.announceToScreenReader(isDark ? 'Dark mode enabled' : 'Light mode enabled');
    }
    */

    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }

    handleModalKeyboard(e) {
        if (e.key === 'Escape') {
            this.closeModal();
        } else if (e.key === 'Tab') {
            // Trap focus within modal
            const focusableElements = this.confirmModal.querySelectorAll('button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    handleModalFocus(e) {
        if (e.key === 'Tab') {
            const focusableElements = this.confirmModal.querySelectorAll('button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    showConfirmModal(title, message, onConfirm) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.confirmModal.classList.add('active');
        
        // Store the confirm callback
        this.pendingConfirm = onConfirm;
        
        // Focus the first button
        setTimeout(() => {
            this.modalCancel.focus();
        }, 100);
        
        // Announce modal opening
        this.announceToScreenReader(`Modal opened: ${title}. ${message}`);
    }

    closeModal() {
        this.confirmModal.classList.remove('active');
        this.pendingConfirm = null;
        
        // Return focus to the element that opened the modal
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
        }
        
        this.announceToScreenReader('Modal closed');
    }

    createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'entry-item';
        div.setAttribute('role', 'listitem');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Entry: ${entry.title}. Created ${this.formatDate(new Date(entry.date))}`);
        
        div.innerHTML = `
            <div class="entry-item-title">${this.escapeHtml(entry.title)}</div>
            <div class="entry-item-preview">${this.escapeHtml(entry.content.substring(0, 100))}${entry.content.length > 100 ? '...' : ''}</div>
            <div class="entry-item-date">${this.formatDate(new Date(entry.date))}</div>
            <div class="entry-item-actions">
                <button class="btn btn-outline" onclick="app.editEntry('${entry.id}')" aria-label="Edit entry: ${this.escapeHtml(entry.title)}">
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
                <button class="btn btn-danger" onclick="app.deleteEntry('${entry.id}')" aria-label="Delete entry: ${this.escapeHtml(entry.title)}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        `;
        
        // Keyboard navigation for entry items
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.editEntry(entry.id);
            }
        });
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.entry-item-actions')) {
                this.editEntry(entry.id);
            }
        });
        
        return div;
    }

    handleKeyboardShortcuts(e) {
        // Don't interfere with text input in textareas and inputs
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
            // Allow normal text input behavior for all keys
            return;
        }
        
        // Don't interfere with contenteditable elements
        if (e.target.contentEditable === 'true') {
            return;
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.isEditing) {
                this.saveHomework();
            }
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
            if (this.isEditing) {
                this.cancelEdit();
            } else if (this.confirmModal.classList.contains('active')) {
                this.closeModal();
            }
        }
        
        // Alt + N for new homework
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            this.createNewHomework();
        }
        
        // Alt + S for search
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            this.searchInput.focus();
        }
        
        // Ctrl + Shift + A for secret admin access
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            this.showSecretAdminAccess();
        }
    }

    // Authentication Methods
    showAuthScreen() {
        this.authContainer.style.display = 'flex';
        this.mainApp.style.display = 'none';
        const extra = document.getElementById('extraInfoWindow');
        if (extra) extra.style.display = 'none';
        this.announceToScreenReader('Please sign in to access your diary');
    }

    showMainApp() {
        this.authContainer.style.display = 'none';
        this.mainApp.style.display = 'block';
        this.adminPanel.style.display = 'none';
        const extra = document.getElementById('extraInfoWindow');
        if (extra) extra.style.display = '';
        
        // Reload homework data for the current user
        this.homework = this.loadHomework();
        
        this.updateUserInfo();
        this.renderHomework();
        this.updateHomeworkCount();
        this.updateCategoryCounts();
        this.updateUIForRole();
        // this.renderVotes(); // HIDDEN
        // Show votes welcome for teachers, hide editor by default - HIDDEN
        // Vote-related elements are hidden via CSS, no need to access them
        this.announceToScreenReader(`Welcome back, ${this.currentUser.name}`);
    }

    showSignUpForm() {
        this.signInForm.style.display = 'none';
        this.signUpForm.style.display = 'block';
        this.signUpName.focus();
        this.announceToScreenReader('Switched to sign up form');
    }

    showSignInForm() {
        this.signUpForm.style.display = 'none';
        this.signInForm.style.display = 'block';
        this.signInEmail.focus();
        this.announceToScreenReader('Switched to sign in form');
    }


    handleAdminBypass() {
        // Create admin user
        const adminUser = {
            id: 'admin',
            name: 'Admin User',
            email: 'admin@fizmatdiary.com',
            role: 'teacher',
            isAdmin: true
        };

        this.currentUser = adminUser;
        this.setCurrentUser(adminUser);
        this.homework = this.loadHomework(); // Load homework for admin user
        this.showMainApp();
        this.showNotification('Admin access granted! Welcome to FizmatDiary Admin Panel.', 'success');
        this.announceToScreenReader('Admin access granted. You now have full access to the application.');
    }

    setupPasswordToggles() {
        const toggles = [
            { input: 'signInPassword', toggle: 'signInPasswordToggle' },
            { input: 'signUpPassword', toggle: 'signUpPasswordToggle' },
            { input: 'signUpConfirmPassword', toggle: 'signUpConfirmPasswordToggle' }
        ];

        toggles.forEach(({ input, toggle }) => {
            const inputElement = document.getElementById(input);
            const toggleElement = document.getElementById(toggle);
            
            if (inputElement && toggleElement) {
                toggleElement.addEventListener('click', () => {
                    const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
                    inputElement.setAttribute('type', type);
                    
                    const icon = toggleElement.querySelector('i');
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                });
            }
        });
    }

    async handleSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('signInEmail').value.trim();
        const password = document.getElementById('signInPassword').value;
        
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        try {
            const user = await this.authenticateUser(email, password);
            if (user) {
                this.currentUser = user;
                this.setCurrentUser(user);
                this.homework = this.loadHomework(); // Reload homework for the logged-in user
                this.showMainApp();
                this.showNotification('Welcome back!', 'success');
            } else {
                this.showNotification('Invalid email or password', 'warning');
            }
        } catch (error) {
            this.showNotification('Sign in failed. Please try again.', 'warning');
        }
    }

    async handleSignUp(e) {
        e.preventDefault();
        
        const name = document.getElementById('signUpName').value.trim();
        const email = document.getElementById('signUpEmail').value.trim();
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('signUpConfirmPassword').value;
        const role = document.getElementById('userRole').value;
        
        if (!name || !email || !password || !confirmPassword || !role) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        // Allow only gmail.com and fizmat.kz domains
        if (!this.isAllowedEmailDomain(email)) {
            this.showNotification('Only emails ending with @gmail.com or @fizmat.kz can register', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'warning');
            return;
        }

        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters', 'warning');
            return;
        }

        try {
            const user = await this.createUser(name, email, password, role);
            if (user) {
                this.currentUser = user;
                this.setCurrentUser(user);
                this.homework = this.loadHomework(); // Initialize empty homework for new user
                this.showMainApp();
                this.showNotification('Account created successfully!', 'success');
            } else {
                this.showNotification('Email already exists', 'warning');
            }
        } catch (error) {
            if (error && error.message === 'DOMAIN_NOT_ALLOWED') {
                this.showNotification('Only emails ending with @gmail.com or @fizmat.kz can register', 'warning');
            } else {
                this.showNotification('Sign up failed. Please try again.', 'warning');
            }
        }
    }

    async authenticateUser(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);
        
        if (user && await this.verifyPassword(password, user.password)) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };
        }
        return null;
    }

    async createUser(name, email, password, role) {
        const users = this.getUsers();
        
        // Defense-in-depth: enforce allowed domains even if UI check is bypassed
        if (!this.isAllowedEmailDomain(email)) {
            throw new Error('DOMAIN_NOT_ALLOWED');
        }

        if (users.find(u => u.email === email)) {
            return null;
        }

        const hashedPassword = await this.hashPassword(password);
        const user = {
            id: this.generateId(),
            name,
            email,
            password: hashedPassword,
            role: role,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        this.saveUsers(users);
        
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    // Email domain allowlist
    isAllowedEmailDomain(email) {
        const normalized = String(email || '').toLowerCase();
        return /@gmail\.com$/.test(normalized) || /@fizmat\.kz$/.test(normalized);
    }

    async hashPassword(password) {
        // Simple hash function for demo purposes
        // In production, use a proper hashing library like bcrypt
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPassword(password, hashedPassword) {
        const hashed = await this.hashPassword(password);
        return hashed === hashedPassword;
    }

    getUsers() {
        try {
            const users = localStorage.getItem('fizmat-diary-users');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem('fizmat-diary-users', JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    getCurrentUser() {
        try {
            const user = localStorage.getItem('fizmat-diary-current-user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error loading current user:', error);
            return null;
        }
    }

    setCurrentUser(user) {
        try {
            localStorage.setItem('fizmat-diary-current-user', JSON.stringify(user));
        } catch (error) {
            console.error('Error saving current user:', error);
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            this.userName.textContent = this.currentUser.name.split(' ')[0];
            this.userDisplayName.textContent = this.currentUser.name;
            this.userEmail.textContent = this.currentUser.email;
        }
    }

    toggleUserMenu() {
        this.userDropdown.classList.toggle('active');
    }

    handleOutsideClick(e) {
        if (!this.userMenuBtn.contains(e.target) && !this.userDropdown.contains(e.target)) {
            this.userDropdown.classList.remove('active');
        }
    }

    handleLogout() {
        this.showConfirmModal(
            'Sign Out',
            'Are you sure you want to sign out?',
            () => {
                this.currentUser = null;
                localStorage.removeItem('fizmat-diary-current-user');
                this.entries = [];
                this.showAuthScreen();
                this.showNotification('You have been signed out', 'info');
            }
        );
    }


    // Admin Panel Methods
    toggleAdminPanel() {
        if (this.adminPanel.style.display === 'none') {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
    }

    showAdminLogin() {
        this.adminLoginModal.style.display = 'flex';
        this.adminPasswordInput.value = '';
        this.adminLoginError.style.display = 'none';
        this.adminPasswordInput.focus();
        this.announceToScreenReader('Admin login required');
    }

    closeAdminLogin() {
        this.adminLoginModal.style.display = 'none';
        this.adminPasswordInput.value = '';
        this.adminLoginError.style.display = 'none';
    }

    toggleAdminPasswordVisibility() {
        const input = this.adminPasswordInput;
        const toggle = this.adminPasswordToggle;
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
            this.announceToScreenReader('Password visible');
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
            this.announceToScreenReader('Password hidden');
        }
    }

    handleAdminLogin() {
        const password = this.adminPasswordInput.value.trim();
        
        if (!password) {
            this.showAdminLoginError('Please enter the admin password.');
            return;
        }
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            this.closeAdminLogin();
            this.showAdminPanel();
            this.showNotification('Admin access granted! Welcome to FizmatDiary Admin Panel.', 'success');
        } else {
            this.showAdminLoginError('Incorrect password. Please try again.');
        }
    }

    showAdminLoginError(message) {
        this.adminLoginError.textContent = message;
        this.adminLoginError.style.display = 'block';
        this.announceToScreenReader(message);
    }

    showAdminPanel() {
        this.adminPanel.style.display = 'block';
        this.refreshAdminData();
        this.announceToScreenReader('Admin panel opened');
    }

    hideAdminPanel() {
        this.adminPanel.style.display = 'none';
        this.announceToScreenReader('Admin panel closed');
    }

    backToMainWindow() {
        this.hideAdminPanel();
        this.showMainApp();
        this.announceToScreenReader('Returned to main window');
    }


    showSecretAdminAccess() {
        this.secretAdminAccess.style.display = 'flex';
        this.secretPassword.value = '';
        this.secretPassword.focus();
        this.announceToScreenReader('Secret admin access opened');
    }

    closeSecretAdminAccess() {
        this.secretAdminAccess.style.display = 'none';
        this.secretPassword.value = '';
    }

    handleSecretAdminAccess() {
        const password = this.secretPassword.value.trim();
        
        if (!password) {
            this.showNotification('Please enter the secret password.', 'warning');
            return;
        }
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            this.closeSecretAdminAccess();
            this.showAdminPanel();
            this.showNotification('Secret admin access granted! Welcome to FizmatDiary Admin Panel.', 'success');
        } else {
            this.showNotification('Incorrect secret password. Access denied.', 'error');
        }
    }

    toggleAdminPanel() {
        if (this.adminPanel.style.display === 'none') {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
    }

    showAdminPanel() {
        this.adminPanel.style.display = 'block';
        this.refreshAdminData();
        this.announceToScreenReader('Admin panel opened');
    }

    hideAdminPanel() {
        this.adminPanel.style.display = 'none';
        this.announceToScreenReader('Admin panel closed');
    }

    refreshAdminData() {
        this.updateAnalytics();
        this.updateUsersTable();
        this.updateSystemInfo();
        this.announceToScreenReader('Admin data refreshed');
    }

    updateAnalytics() {
        const users = this.getUsers();
        const totalUsers = users.length;
        
        let totalEntries = 0;
        let todayEntries = 0;
        const today = new Date().toDateString();
        
        users.forEach(user => {
            const userHomework = this.getUserHomework(user.id);
            totalEntries += userHomework.length;
            
            userHomework.forEach(homework => {
                if (new Date(homework.date).toDateString() === today) {
                    todayEntries++;
                }
            });
        });

        this.totalUsers.textContent = totalUsers;
        this.totalEntries.textContent = totalEntries;
        this.todayEntries.textContent = todayEntries;
        this.activeUsers.textContent = totalUsers; // All users are considered active in this demo
    }

    updateUsersTable() {
        const users = this.getUsers();
        this.usersTableBody.innerHTML = '';

        if (users.length === 0) {
            this.usersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        users.forEach(user => {
            const userHomework = this.getUserHomework(user.id);
            const joinDate = new Date(user.createdAt).toLocaleDateString();
            const lastActive = this.getLastActiveDate(user.id);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem;">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>${this.escapeHtml(user.name)}</span>
                    </div>
                </td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>
                    <span class="role-badge ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                </td>
                <td>${userHomework.length}</td>
                <td>${joinDate}</td>
                <td>${lastActive}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn btn-outline" onclick="app.viewUserEntries('${user.id}')" title="View Homework">
                            <i class="fas fa-eye" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-outline" onclick="app.editUser('${user.id}')" title="Edit User">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteUser('${user.id}')" title="Delete User">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </td>
            `;
            this.usersTableBody.appendChild(row);
        });
    }

    getUserHomework(userId) {
        try {
            const saved = localStorage.getItem(`fizmat-diary-homework-${userId}`);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading user homework:', error);
            return [];
        }
    }

    getLastActiveDate(userId) {
        const homework = this.getUserHomework(userId);
        if (homework.length === 0) {
            return 'Never';
        }
        
        const lastHomework = homework.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return new Date(lastHomework.date).toLocaleDateString();
    }

    updateSystemInfo() {
        // Calculate storage usage
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        
        const sizeInKB = Math.round(totalSize / 1024);
        this.storageUsed.textContent = `${sizeInKB} KB`;
        
        // Update last backup (demo data)
        this.lastBackup.textContent = new Date().toLocaleDateString();
    }

    filterUsers(searchTerm) {
        const rows = this.usersTableBody.querySelectorAll('tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    viewUserEntries(userId) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return;
        
        const homework = this.getUserHomework(userId);
        const homeworkText = homework.map(hw => 
            `Title: ${hw.title}\nCategory: ${hw.category}\nDate: ${new Date(hw.date).toLocaleString()}\nContent: ${hw.content}\n\n`
        ).join('---\n\n');
        
        const blob = new Blob([`User: ${user.name} (${user.email})\n\n${homeworkText}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user.name.replace(/\s+/g, '_')}_homework.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`Downloaded homework for ${user.name}`, 'success');
    }

    editUser(userId) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return;
        
        const newName = prompt('Enter new name:', user.name);
        if (newName && newName.trim() !== user.name) {
            const users = this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].name = newName.trim();
                this.saveUsers(users);
                this.updateUsersTable();
                this.showNotification('User updated successfully', 'success');
            }
        }
    }

    deleteUser(userId) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return;
        
        this.showConfirmModal(
            'Delete User',
            `Are you sure you want to delete ${user.name}? This will also delete all their diary entries. This action cannot be undone.`,
            () => {
                const users = this.getUsers().filter(u => u.id !== userId);
                this.saveUsers(users);
                
                // Delete user's entries
                localStorage.removeItem(`fizmat-diary-entries-${userId}`);
                
                this.updateUsersTable();
                this.updateAnalytics();
                this.showNotification('User deleted successfully', 'success');
            }
        );
    }

    exportUsers() {
        const users = this.getUsers();
        const exportData = users.map(user => ({
            name: user.name,
            email: user.email,
            role: user.role,
            joined: new Date(user.createdAt).toLocaleDateString(),
            homework: this.getUserHomework(user.id).length,
            lastActive: this.getLastActiveDate(user.id)
        }));
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fizmat_diary_users_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Users exported successfully', 'success');
    }

    showRegistrationWindow() {
        // Hide admin panel and show registration form
        this.adminPanel.style.display = 'none';
        this.mainApp.style.display = 'none';
        this.authContainer.style.display = 'flex';
        this.showSignUpForm();
        this.showNotification('Registration window opened', 'info');
    }

    updateUIForRole() {
        const welcomeAddBtn = document.getElementById('welcomeAddBtn');
        const homeworkEditor = document.getElementById('homeworkEditor');
        const isTeacher = this.currentUser && this.currentUser.role === 'teacher';
        
        if (this.currentUser.role === 'student') {
            // Hide add homework buttons for students
            if (welcomeAddBtn) welcomeAddBtn.style.display = 'none';
            
            // Hide homework editor completely for students
            if (homeworkEditor) homeworkEditor.style.display = 'none';
            
            // Show polls window for students - HIDDEN
            /*
            if (this.pollsWindow) {
                this.pollsWindow.style.display = 'block';
                this.renderPollsWindow();
            }
            if (this.votesWelcome) this.votesWelcome.style.display = 'none';
            if (this.votesEditor) this.votesEditor.style.display = 'none';
            */
        } else if (this.currentUser.role === 'teacher') {
            // Show add homework buttons for teachers
            if (welcomeAddBtn) welcomeAddBtn.style.display = 'flex';
            
            // Show homework editor for teachers (if not already visible)
            if (homeworkEditor && homeworkEditor.style.display !== 'block') {
                homeworkEditor.style.display = 'none'; // Keep hidden until teacher clicks "Add Homework"
            }
            
            // Show votes welcome for teachers - HIDDEN
            /*
            if (this.votesWelcome) this.votesWelcome.style.display = 'block';
            if (this.votesEditor) this.votesEditor.style.display = 'none';
            // Hide polls window by default for teachers
            if (this.pollsWindow) this.pollsWindow.style.display = 'none';
            */
        }
    }

    // Homework Management Methods
    // Shared class-scoped homework storage so all users in a class see the same assignments
    getClassHomeworkKey(category) {
        const cat = category || this.currentCategory || '10H';
        return `fizmat-diary-homework-class-${cat}`;
    }

    loadHomework(category) {
        const key = this.getClassHomeworkKey(category);
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading homework:', error);
            return [];
        }
    }

    saveHomeworkData(category) {
        try {
            const key = this.getClassHomeworkKey(category);
            localStorage.setItem(key, JSON.stringify(this.homework));
        } catch (error) {
            console.error('Error saving homework:', error);
            this.showNotification('Error saving homework. Please try again.', 'warning');
        }
    }

    renderHomework() {
        // Always load the latest for the current class
        this.homework = this.loadHomework(this.currentCategory);
        this.homeworkList.innerHTML = '';
        
        if (this.homework.length === 0) {
            this.homeworkList.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    <i class="fas fa-graduation-cap" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No homework assignments yet. Add your first assignment!</p>
                </div>
            `;
            return;
        }
        
        // Filter by current category
        const filteredHomework = this.homework.filter(h => h.category === this.currentCategory);
        
        if (filteredHomework.length === 0) {
            this.homeworkList.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    <i class="fas fa-graduation-cap" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No homework in ${this.currentCategory} category yet.</p>
                </div>
            `;
            return;
        }
        
        filteredHomework.forEach(homework => {
            const homeworkElement = this.createHomeworkElement(homework);
            this.homeworkList.appendChild(homeworkElement);
        });
        
        // Bind edit and delete buttons for the newly rendered homework items
        this.bindEditDeleteButtons();
    }

    createHomeworkElement(homework) {
        const div = document.createElement('div');
        div.className = 'homework-item';
        div.setAttribute('role', 'listitem');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `Homework: ${homework.title}. Category: ${homework.category}. Created ${this.formatDate(new Date(homework.date))}`);
        
        div.innerHTML = `
            <div class="homework-item-category">${homework.category}</div>
            <div class="homework-item-subject">${homework.subject || 'No Subject'}</div>
            <div class="homework-item-title">${this.escapeHtml(homework.title)}</div>
            <div class="homework-item-preview">${this.escapeHtml(homework.content.substring(0, 100))}${homework.content.length > 100 ? '...' : ''}</div>
            <div class="homework-item-date">${this.formatDate(new Date(homework.date))}</div>
            <div class="homework-item-actions">
                ${this.currentUser && this.currentUser.role === 'teacher' ? `
                    <button class="btn btn-outline edit-button" data-homework-id="${homework.id}" aria-label="Edit homework: ${this.escapeHtml(homework.title)}">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-danger delete-button" data-homework-id="${homework.id}" aria-label="Delete homework: ${this.escapeHtml(homework.title)}">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                ` : `
                    <span class="view-only-indicator">View Only</span>
                `}
            </div>
        `;
        
        // Keyboard navigation for homework items
        div.addEventListener('keydown', (e) => {
            // Only allow editing for teachers
            if (this.currentUser && this.currentUser.role === 'teacher' && 
                (e.key === 'Enter' || e.key === ' ') && 
                e.target.tagName !== 'TEXTAREA' && 
                e.target.tagName !== 'INPUT' && 
                e.target.contentEditable !== 'true') {
                e.preventDefault();
                this.editHomework(homework.id);
            }
        });
        
        div.addEventListener('click', (e) => {
            // Only allow editing for teachers
            if (this.currentUser && this.currentUser.role === 'teacher' && 
                !e.target.closest('.homework-item-actions')) {
                this.editHomework(homework.id);
            }
        });
        
        return div;
    }

    updateHomeworkCount() {
        const count = this.homework.length;
        this.homeworkCount.textContent = `${count} ${count === 1 ? 'assignment' : 'assignments'}`;
    }

    updateCategoryCounts() {
        // Update class counts
        const classes = ['10A', '10B', '10C', '10D', '10E', '10F', '10G', '10H', '10K'];
        classes.forEach(className => {
            const count = this.homework.filter(h => h.category === className).length;
            const countElement = document.getElementById(`class-${className}-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }


    handleCategoryChange(e) {
        this.switchCategory(e.target.value);
    }

    handleClassClick(e) {
        const classItem = e.target.closest('.class-item');
        if (!classItem) return;
        
        const className = classItem.dataset.class;
        this.switchCategory(className);
    }

    handleClassKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const classItem = e.target.closest('.class-item');
            if (!classItem) return;
            
            const className = classItem.dataset.class;
            this.switchCategory(className);
        }
    }

    handleSubjectClick(e) {
        const subjectItem = e.target.closest('.subject-item');
        if (!subjectItem) return;
        
        const subjectName = subjectItem.dataset.subject;
        this.selectSubject(subjectName);
    }

    handleSubjectKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const subjectItem = e.target.closest('.subject-item');
            if (!subjectItem) return;
            
            const subjectName = subjectItem.dataset.subject;
            this.selectSubject(subjectName);
        }
    }

    selectSubject(subjectName) {
        // Update active subject
        document.querySelectorAll('.subject-item').forEach(item => {
            item.classList.remove('active');
        });
        const subjectItem = document.querySelector(`[data-subject="${subjectName}"]`);
        if (subjectItem) {
            subjectItem.classList.add('active');
        }
        
        // Store current subject and class
        this.currentSubject = subjectName;
        
        // Open subject window
        this.openSubjectWindow(subjectName);
        
        this.announceToScreenReader(`Opened subject window for: ${subjectName}`);
    }

    openSubjectWindow(subjectName) {
        // Hide other windows
        this.welcomeScreen.style.display = 'none';
        this.subjectsGrid.style.display = 'none';
        this.homeworkEditor.style.display = 'none';
        
        // Show subject window
        this.subjectWindow.style.display = 'block';
        
        // Update window title
        this.subjectWindowTitle.textContent = subjectName;
        this.subjectWindowClass.textContent = `Class: ${this.currentCategory}`;
        
        // Load subject homework
        this.loadSubjectHomework(subjectName);
    }

    loadSubjectHomework(subjectName) {
        const filteredHomework = this.homework.filter(homework => 
            homework.subject === subjectName && homework.category === this.currentCategory
        );
        
        this.subjectHomeworkList.innerHTML = '';
        
        if (filteredHomework.length === 0) {
            this.subjectHomeworkList.innerHTML = `
                <div class="empty-subject-state">
                    <i class="fas fa-book-open" aria-hidden="true"></i>
                    <h3>No Homework Yet</h3>
                    <p>No homework assignments have been created for ${subjectName} in ${this.currentCategory}.</p>
                </div>
            `;
            return;
        }
        
        filteredHomework.forEach(homework => {
            const homeworkElement = this.createSubjectHomeworkElement(homework);
            this.subjectHomeworkList.appendChild(homeworkElement);
        });
        
        // Bind edit and delete buttons for the newly rendered subject homework items
        this.bindEditDeleteButtons();
    }

    createSubjectHomeworkElement(homework) {
        const div = document.createElement('div');
        div.className = 'subject-homework-item';
        div.setAttribute('role', 'listitem');
        
        const givenDate = homework.givenDate ? this.formatDate(new Date(homework.givenDate)) : 'Not set';
        const dueDate = homework.dueDate ? this.formatDate(new Date(homework.dueDate)) : 'Not set';
        
        // Check if homework is overdue or due soon
        let dueDateClass = '';
        if (homework.dueDate) {
            const dueDateObj = new Date(homework.dueDate);
            const today = new Date();
            const diffTime = dueDateObj - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                dueDateClass = 'overdue';
            } else if (diffDays <= 3) {
                dueDateClass = 'due-soon';
            }
        }
        
        div.innerHTML = `
            <div class="subject-homework-item-header">
                <h3 class="subject-homework-item-title">${this.escapeHtml(homework.title)}</h3>
                <div class="subject-homework-item-dates">
                    <div class="homework-date-info">
                        <span class="homework-date-label">Given</span>
                        <span class="homework-date-value">${givenDate}</span>
                    </div>
                    <div class="homework-date-info">
                        <span class="homework-date-label">Due</span>
                        <span class="homework-date-value ${dueDateClass}">${dueDate}</span>
                    </div>
                </div>
            </div>
            <div class="subject-homework-item-content">
                ${this.escapeHtml(homework.content.substring(0, 200))}${homework.content.length > 200 ? '...' : ''}
            </div>
            ${homework.files && homework.files.length > 0 ? `
                <div class="homework-files">
                    <div class="files-label">Attachments:</div>
                    <div class="files-list">
                        ${homework.files.map(file => `
                            <span class="file-tag">
                                <i class="fas fa-paperclip" aria-hidden="true"></i>
                                ${this.escapeHtml(file.name)}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="subject-homework-item-actions">
                <button class="btn btn-outline edit-button" data-homework-id="${homework.id}" aria-label="Edit homework: ${this.escapeHtml(homework.title)}">
                    <i class="fas fa-edit" aria-hidden="true"></i>
                    Edit
                </button>
                <button class="btn btn-danger delete-button" data-homework-id="${homework.id}" aria-label="Delete homework: ${this.escapeHtml(homework.title)}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                    Delete
                </button>
            </div>
        `;
        
        return div;
    }

    backToSubjects() {
        // Hide subject window and show subjects grid
        this.subjectWindow.style.display = 'none';
        this.subjectsGrid.style.display = 'block';
        
        this.announceToScreenReader('Returned to subjects grid');
    }

    backToWelcome() {
        // Show welcome screen and hide others
        this.welcomeScreen.style.display = 'flex';
        this.subjectsGrid.style.display = 'none';
        this.subjectWindow.style.display = 'none';
        this.homeworkEditor.style.display = 'none';
        this.homeworkEditor.classList.remove('active');
        this.announceToScreenReader('Returned to welcome screen');
    }

    addSubjectHomework() {
        if (this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can create homework assignments.', 'warning');
            return;
        }

        // Check if we have a current subject and category
        if (!this.currentSubject || !this.currentCategory) {
            this.showNotification('Please select a class and subject first', 'warning');
            return;
        }
        
        // Create new homework
        this.createNewHomework();
        
        // Pre-fill the subject and category
        this.homeworkSubject.value = this.currentSubject;
        this.homeworkCategory.value = this.currentCategory;

        // Show the homework editor and hide subject window
        this.homeworkEditor.style.display = 'block';
        this.homeworkEditor.classList.add('active');
        this.subjectWindow.style.display = 'none';
        
        // Focus on the title input
        this.homeworkTitle.focus();
        
        this.announceToScreenReader(`Creating new homework for ${this.currentSubject} in ${this.currentCategory}`);
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active class in classes grid
        document.querySelectorAll('.class-item').forEach(item => {
            item.classList.remove('active');
        });
        const classItem = document.querySelector(`[data-class="${category}"]`);
        if (classItem) {
            classItem.classList.add('active');
        }
        
        // Hide welcome screen and show subjects grid
        this.welcomeScreen.style.display = 'none';
        this.subjectsGrid.style.display = 'block';
        this.selectedClassSpan.textContent = category;
        
        // Update editor category
        this.homeworkCategory.value = category;
        
        // Re-render homework list
        this.renderHomework();
        // this.renderVotes(); // HIDDEN
        // Vote-related UI updates - HIDDEN
        // Vote-related elements are hidden via CSS, no need to access them
        
        this.announceToScreenReader(`Switched to ${category} class. Subjects grid is now visible.`);
    }

    filterHomework(searchTerm) {
        const filteredHomework = this.homework.filter(homework => 
            homework.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            homework.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            homework.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.homeworkList.innerHTML = '';
        
        if (filteredHomework.length === 0 && searchTerm) {
            this.homeworkList.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No homework found matching "${searchTerm}"</p>
                </div>
            `;
            return;
        }
        
        // Filter by current category
        const categoryFiltered = filteredHomework.filter(h => h.category === this.currentCategory);
        
        if (categoryFiltered.length === 0 && searchTerm) {
            this.homeworkList.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    <p>No homework found in ${this.currentCategory} matching "${searchTerm}"</p>
                </div>
            `;
            return;
        }
        
        categoryFiltered.forEach(homework => {
            const homeworkElement = this.createHomeworkElement(homework);
            this.homeworkList.appendChild(homeworkElement);
        });
    }

    deleteHomework(homeworkId) {
        // Check if user has permission to delete homework
        if (!this.currentUser || this.currentUser.role !== 'teacher') {
            this.showNotification('Only teachers can delete homework assignments.', 'warning');
            return;
        }
        
        this.showConfirmModal(
            'Delete Homework',
            'Are you sure you want to delete this homework assignment? This action cannot be undone.',
            () => {
                this.homework = this.homework.filter(h => h.id !== homeworkId);
                this.saveHomeworkData(this.currentCategory);
                this.renderHomework();
                this.updateHomeworkCount();
                this.updateCategoryCounts();
                this.showNotification('Homework deleted successfully!', 'success');
                
                // If we were editing this homework, cancel edit
                if (this.currentHomeworkId === homeworkId) {
                    this.cancelEdit();
                }
            }
        );
    }

    updateWordCount() {
        const count = this.getWordCount(this.homeworkContent.value);
        this.wordCount.textContent = `${count} words`;
    }

    // File Upload Methods
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.fileUploadSection.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.fileUploadSection.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        this.fileUploadSection.classList.remove('drag-over');
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    }

    processFiles(files) {
        files.forEach(file => {
            if (this.validateFile(file)) {
                this.addFilePreview(file);
            }
        });
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip'
        ];

        if (file.size > maxSize) {
            this.showNotification(`File "${file.name}" is too large. Maximum size is 10MB.`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showNotification(`File type "${file.type}" is not supported.`, 'error');
            return false;
        }

        return true;
    }

    addFilePreview(file) {
        const fileId = Date.now() + Math.random();
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview-item';
        filePreview.dataset.fileId = fileId;
        filePreview.dataset.fileName = file.name;
        filePreview.dataset.fileSize = file.size;
        filePreview.dataset.fileType = file.type;

        const icon = this.getFileIcon(file.type);
        const size = this.formatFileSize(file.size);
        
        filePreview.innerHTML = `
            <div class="file-preview-icon ${icon.class}">
                <i class="${icon.icon}" aria-hidden="true"></i>
            </div>
            <div class="file-preview-name">${this.escapeHtml(file.name)}</div>
            <div class="file-preview-size">${size}</div>
            <button class="file-preview-remove" onclick="app.removeFilePreview('${fileId}')" aria-label="Remove file">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;

        // Add image preview if it's an image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'file-preview-image';
                img.alt = file.name;
                filePreview.insertBefore(img, filePreview.querySelector('.file-preview-icon'));
            };
            reader.readAsDataURL(file);
        }

        this.filePreviewContainer.appendChild(filePreview);
        this.showNotification(`File "${file.name}" added successfully.`, 'success');
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) {
            return { icon: 'fas fa-image', class: 'image' };
        } else if (fileType === 'application/pdf') {
            return { icon: 'fas fa-file-pdf', class: 'pdf' };
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return { icon: 'fas fa-file-word', class: 'document' };
        } else if (fileType === 'application/zip') {
            return { icon: 'fas fa-file-archive', class: 'archive' };
        } else {
            return { icon: 'fas fa-file', class: 'document' };
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFilePreview(fileId) {
        const filePreview = document.querySelector(`[data-file-id="${fileId}"]`);
        if (filePreview) {
            filePreview.remove();
            this.showNotification('File removed successfully.', 'success');
        }
    }

    getUploadedFiles() {
        const filePreviews = this.filePreviewContainer.querySelectorAll('.file-preview-item');
        return Array.from(filePreviews).map(preview => ({
            id: preview.dataset.fileId,
            name: preview.dataset.fileName,
            size: preview.dataset.fileSize,
            type: preview.dataset.fileType
        }));
    }

    clearFileUploads() {
        this.filePreviewContainer.innerHTML = '';
        this.homeworkFiles.value = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FizmatDiary();
});

// Add some sample data for demonstration (only if no entries exist)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.app && window.app.homework.length === 0) {
            // Add a welcome homework assignment
            const welcomeHomework = {
                id: window.app.generateId(),
                title: 'Welcome to FizmatDiary!',
                content: 'Welcome to your homework tracking system! This is where you can organize and track your homework assignments by category (10H, 11H, 12H). You can create new assignments, edit existing ones, and search through your homework. Start by adding your first assignment!',
                category: '10H',
                date: new Date().toISOString(),
                wordCount: 45
            };
            
            window.app.homework.push(welcomeHomework);
            window.app.saveHomeworkData();
            window.app.renderHomework();
            window.app.updateHomeworkCount();
            window.app.updateCategoryCounts();
        }
    }, 1000);
});
