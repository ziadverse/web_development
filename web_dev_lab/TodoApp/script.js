"use strict";
class TodoStore {
    constructor() {
        this.todos = [];
        this.listeners = [];
        this.todos = this.load();
    }
    get all() {
        return this.todos;
    }
    get remaining() {
        return this.todos.filter(({ completed }) => !completed).length;
    }
    get completedCount() {
        return this.todos.length - this.remaining;
    }
    subscribe(listener) {
        this.listeners.push(listener);
    }
    visible(filter) {
        switch (filter) {
            case 'active':
                return this.todos.filter(({ completed }) => !completed);
            case 'completed':
                return this.todos.filter(({ completed }) => completed);
            default:
                return [...this.todos];
        }
    }
    add(text) {
        const clean = text.trim();
        if (!clean)
            return false;
        this.update([...this.todos, { id: TodoStore.makeId(), text: clean, completed: false }]);
        return true;
    }
    toggle(id) {
        this.update(this.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
    }
    edit(id, text) {
        const clean = text.trim();
        if (!clean || !this.todos.some((todo) => todo.id === id))
            return false;
        this.update(this.todos.map((todo) => (todo.id === id ? { ...todo, text: clean } : todo)));
        return true;
    }
    remove(id) {
        this.update(this.todos.filter((todo) => todo.id !== id));
    }
    clearCompleted() {
        this.update(this.todos.filter(({ completed }) => !completed));
    }
    clearAll() {
        this.update([]);
    }
    reload() {
        this.todos = this.load();
        this.notify();
    }
    update(next) {
        this.todos = next;
        this.save();
        this.notify();
    }
    notify() {
        this.listeners.forEach((listener) => listener(this.todos));
    }
    load() {
        try {
            const raw = localStorage.getItem(TodoStore.KEY);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed))
                return [];
            const seen = new Set();
            return parsed.filter(TodoStore.isTodo).map(({ id, text, completed }) => {
                const unique = seen.has(id) ? TodoStore.makeId() : id;
                seen.add(unique);
                return { id: unique, text, completed };
            });
        }
        catch {
            return [];
        }
    }
    save() {
        try {
            localStorage.setItem(TodoStore.KEY, JSON.stringify(this.todos));
        }
        catch {
            return;
        }
    }
    static isTodo(value) {
        if (typeof value !== 'object' || value === null)
            return false;
        const { id, text, completed } = value;
        return (typeof id === 'string' &&
            id !== '' &&
            typeof text === 'string' &&
            text.trim() !== '' &&
            typeof completed === 'boolean');
    }
    static makeId() {
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
TodoStore.KEY = 'todo-app:data';
class TodoApp {
    constructor(store) {
        this.store = store;
        this.filter = 'all';
        this.form = TodoApp.pick('#todo-form');
        this.input = TodoApp.pick('#input-box');
        this.list = TodoApp.pick('#list-container');
        this.count = TodoApp.pick('#count');
        this.clearCompletedButton = TodoApp.pick('#clear-completed');
        this.clearAllButton = TodoApp.pick('#clear-all');
        this.filterButtons = Array.from(document.querySelectorAll('.filter'));
        this.bindEvents();
        this.store.subscribe(() => this.render());
        this.render();
    }
    static pick(selector) {
        const element = document.querySelector(selector);
        if (!element)
            throw new Error(`Missing element: ${selector}`);
        return element;
    }
    static toFilter(value) {
        return value === 'active' || value === 'completed' ? value : 'all';
    }
    static idOf(target) {
        if (!(target instanceof Element))
            return undefined;
        return target.closest('li.todo')?.dataset.id;
    }
    bindEvents() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (this.filter === 'completed')
                this.setFilter('all');
            const added = this.store.add(this.input.value);
            this.form.classList.toggle('invalid', !added);
            this.input.setAttribute('aria-invalid', String(!added));
            if (added)
                this.input.value = '';
            this.input.focus();
        });
        this.input.addEventListener('input', () => {
            this.form.classList.remove('invalid');
            this.input.removeAttribute('aria-invalid');
        });
        this.list.addEventListener('change', (event) => {
            const { target } = event;
            if (!(target instanceof HTMLInputElement) || !target.classList.contains('toggle'))
                return;
            const id = TodoApp.idOf(target);
            if (id)
                this.store.toggle(id);
        });
        this.list.addEventListener('click', (event) => {
            const { target } = event;
            if (!(target instanceof Element) || !target.closest('.delete'))
                return;
            const id = TodoApp.idOf(target);
            if (id)
                this.store.remove(id);
        });
        this.list.addEventListener('dblclick', (event) => {
            const { target } = event;
            if (!(target instanceof Element))
                return;
            const label = target.closest('.text');
            const item = target.closest('li.todo');
            const id = TodoApp.idOf(target);
            if (label && item && id)
                this.startEdit(item, id);
        });
        this.filterButtons.forEach((button) => {
            button.addEventListener('click', () => this.setFilter(TodoApp.toFilter(button.dataset.filter)));
        });
        this.clearCompletedButton.addEventListener('click', () => this.store.clearCompleted());
        this.clearAllButton.addEventListener('click', () => {
            if (this.store.all.length && window.confirm('Delete all todos?'))
                this.store.clearAll();
        });
        window.addEventListener('storage', ({ key }) => {
            if (key === TodoStore.KEY || key === null)
                this.store.reload();
        });
    }
    setFilter(filter) {
        this.filter = filter;
        this.render();
    }
    startEdit(item, id) {
        const label = item.querySelector('.text');
        const todo = this.store.all.find((entry) => entry.id === id);
        if (!label || !todo)
            return;
        const editor = document.createElement('input');
        editor.type = 'text';
        editor.className = 'edit';
        editor.value = todo.text;
        editor.setAttribute('aria-label', 'Edit todo');
        item.classList.add('editing');
        label.replaceWith(editor);
        editor.focus();
        editor.select();
        let finished = false;
        const finish = (save) => {
            if (finished)
                return;
            finished = true;
            if (save && this.store.edit(id, editor.value))
                return;
            this.render();
        };
        editor.addEventListener('keydown', (event) => {
            if (event.isComposing)
                return;
            if (event.key === 'Enter')
                finish(true);
            else if (event.key === 'Escape')
                finish(false);
        });
        editor.addEventListener('blur', () => finish(true));
    }
    createItem({ id, text, completed }) {
        const item = document.createElement('li');
        item.className = completed ? 'todo completed' : 'todo';
        item.dataset.id = id;
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.className = 'toggle';
        toggle.checked = completed;
        toggle.setAttribute('aria-label', `Mark "${text}" as ${completed ? 'active' : 'completed'}`);
        const label = document.createElement('span');
        label.className = 'text';
        label.textContent = text;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete';
        remove.setAttribute('aria-label', `Delete "${text}"`);
        remove.innerHTML = TodoApp.TRASH_ICON;
        item.append(toggle, label, remove);
        return item;
    }
    render() {
        const active = document.activeElement;
        const refocusId = active instanceof HTMLInputElement && active.classList.contains('toggle')
            ? TodoApp.idOf(active)
            : undefined;
        const items = this.store.visible(this.filter);
        if (items.length) {
            this.list.replaceChildren(...items.map((todo) => this.createItem(todo)));
        }
        else {
            const empty = document.createElement('li');
            empty.className = 'empty';
            empty.textContent = TodoApp.EMPTY_MESSAGES[this.filter];
            this.list.replaceChildren(empty);
        }
        if (refocusId) {
            const match = Array.from(this.list.children).find((child) => child instanceof HTMLElement && child.dataset.id === refocusId);
            match?.querySelector('.toggle')?.focus();
        }
        const { remaining, completedCount, all } = this.store;
        this.count.textContent = `${remaining} ${remaining === 1 ? 'item' : 'items'} left`;
        this.clearCompletedButton.disabled = completedCount === 0;
        this.clearAllButton.disabled = all.length === 0;
        this.filterButtons.forEach((button) => {
            const selected = TodoApp.toFilter(button.dataset.filter) === this.filter;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }
}
TodoApp.TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/></svg>';
TodoApp.EMPTY_MESSAGES = {
    all: 'No todos yet. Add one above.',
    active: 'No active todos.',
    completed: 'No completed todos.'
};
new TodoApp(new TodoStore());