document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const elements = {
    form: document.querySelector('form'),
    input: document.querySelector('input[type="text"]'),
    list: document.querySelector('ul'),
    counter: document.querySelector('footer p'),
    filters: document.querySelectorAll('footer button')
  };
  
  // CSS Classes
  const CSS = {
    taskItem: 'opacity-100 flex items-center justify-between p-3 bg-gray-800 border border-white/10 rounded hover:border-white/30 transition-all duration-300 group',
    completed: 'line-through text-gray-500',
    active: 'group-hover:text-white transition-colors duration-200',
    deleteBtn: 'text-gray-400 hover:text-white transition-colors duration-200',
    editInput: 'bg-gray-700 text-white rounded px-2 py-1 text-sm border border-white/30 focus:outline-none focus:border-white/70'
  };
  
  // State
  const state = {
    tasks: [],
    filter: 'ALL',
    editingId: null
  };
  
  // Local Storage Utils
  const storage = {
    load() {
      try {
        const stored = localStorage.getItem('tasks');
        state.tasks = stored ? JSON.parse(stored) : [];
      } catch (err) {
        console.error('Failed to load tasks:', err);
        state.tasks = [];
      }
    },
    
    save() {
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    }
  };
  
  // Task Management
  const taskManager = {
    getFiltered() {
      if (state.filter === 'ACTIVE') return state.tasks.filter(task => !task.completed);
      if (state.filter === 'COMPLETED') return state.tasks.filter(task => task.completed);
      return state.tasks;
    },
    
    add(text) {
      state.tasks.push({
        id: Date.now(),
        text,
        completed: false
      });
      storage.save();
      ui.render();
    },
    
    delete(id) {
      state.tasks = state.tasks.filter(task => task.id !== id);
      storage.save();
      ui.render();
    },
    
    toggle(id) {
      state.tasks = state.tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      storage.save();
      ui.render();
    },
    
    startEditing(id) {
      state.editingId = id;
      ui.render();
    },
    
    updateText(id, newText) {
      if (newText.trim()) {
        state.tasks = state.tasks.map(task => 
          task.id === id ? { ...task, text: newText.trim() } : task
        );
        storage.save();
      }
      state.editingId = null;
      ui.render();
    },
    
    cancelEditing() {
      state.editingId = null;
      ui.render();
    }
  };
  
  // UI Management
  const ui = {
    createTaskElement(task, index) {
      const li = document.createElement('li');
      li.className = CSS.taskItem;
      li.style.animation = 'fadeIn 0.3s ease-out';
      li.style.animationDelay = `${index * 50}ms`;
      
      if (state.editingId === task.id) {
        // Edit mode
        li.innerHTML = `
          <div class="flex items-center flex-grow">
            <input type="checkbox" id="task${task.id}" class="mr-3 w-4 h-4 rounded border-white/30 focus:ring-white" ${task.completed ? 'checked' : ''} disabled>
            <input type="text" class="${CSS.editInput} flex-grow" value="${task.text}" id="edit-input-${task.id}">
          </div>
          <div>
            <button class="text-green-500 hover:text-green-400 mr-2 px-2" aria-label="Save task" data-save-id="${task.id}">
              <i class="fas fa-check"></i>
            </button>
            <button class="text-red-500 hover:text-red-400" aria-label="Cancel editing" data-cancel-id="${task.id}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      } else {
        // Regular mode
        li.innerHTML = `
          <div class="flex items-center">
            <input type="checkbox" id="task${task.id}" class="mr-3 w-4 h-4 rounded border-white/30 focus:ring-white" ${task.completed ? 'checked' : ''}>
            <label for="task${task.id}" class="text-sm ${task.completed ? CSS.completed : CSS.active}" data-edit-id="${task.id}">${task.text}</label>
          </div>
          <button class="${CSS.deleteBtn}" aria-label="Delete task" data-id="${task.id}">
            <i class="fas fa-times"></i>
          </button>
        `;
      }
      
      return li;
    },
    
    updateCounter() {
      const activeCount = state.tasks.filter(task => !task.completed).length;
      const completedCount = state.tasks.length - activeCount;
      elements.counter.textContent = `TASKS: ${activeCount} ACTIVE | ${completedCount} COMPLETED`;
    },
    
    updateFilters() {
      elements.filters.forEach(btn => {
        const isActive = btn.textContent === state.filter;
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('hover:text-white', !isActive);
      });
    },
    
    render() {
      elements.list.innerHTML = '';
      
      const filteredTasks = taskManager.getFiltered();
      filteredTasks.forEach((task, index) => {
        elements.list.appendChild(this.createTaskElement(task, index));
      });
      
      this.updateCounter();
      
      // Focus on edit input if in edit mode
      if (state.editingId) {
        const editInput = document.getElementById(`edit-input-${state.editingId}`);
        if (editInput) {
          editInput.focus();
          editInput.select();
        }
      }
    }
  };
  
  // Event Handlers
  const setupEventListeners = () => {
    // Form submission
    elements.form.addEventListener('submit', e => {
      e.preventDefault();
      const text = elements.input.value.trim();
      
      if (text) {
        taskManager.add(text);
        elements.input.value = '';
      }
    });
    
    // Task list delegation (checkboxes, delete buttons, editing)
    elements.list.addEventListener('click', e => {
      // Delete button
      const deleteBtn = e.target.closest('button[data-id]');
      if (deleteBtn) {
        taskManager.delete(Number(deleteBtn.dataset.id));
        return;
      }
      
      // Edit label
      const editLabel = e.target.closest('label[data-edit-id]');
      if (editLabel && !editLabel.closest('.line-through')) {
        taskManager.startEditing(Number(editLabel.dataset.editId));
        return;
      }
      
      // Save edit button
      const saveBtn = e.target.closest('button[data-save-id]');
      if (saveBtn) {
        const id = Number(saveBtn.dataset.saveId);
        const newText = document.getElementById(`edit-input-${id}`).value;
        taskManager.updateText(id, newText);
        return;
      }
      
      // Cancel edit button
      const cancelBtn = e.target.closest('button[data-cancel-id]');
      if (cancelBtn) {
        taskManager.cancelEditing();
        return;
      }
      
      // Checkbox
      if (e.target.type === 'checkbox') {
        const id = Number(e.target.id.replace('task', ''));
        taskManager.toggle(id);
      }
    });
    
    // Handle 'Enter' key for edit inputs
    elements.list.addEventListener('keyup', e => {
      if (e.key === 'Enter' && e.target.id.startsWith('edit-input-')) {
        const id = Number(e.target.id.replace('edit-input-', ''));
        taskManager.updateText(id, e.target.value);
      } else if (e.key === 'Escape' && e.target.id.startsWith('edit-input-')) {
        taskManager.cancelEditing();
      }
    });
    
    // Filter buttons
    elements.filters.forEach(button => {
      button.addEventListener('click', () => {
        state.filter = button.textContent;
        ui.updateFilters();
        ui.render();
      });
    });
  };
  
  // Initialize
  const init = () => {
    storage.load();
    setupEventListeners();
    ui.updateFilters();
    ui.render();
  };
  
  init();
});
