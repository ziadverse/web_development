interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';
type Listener = (todos: readonly Todo[]) => void;

class TodoStore {
  static readonly KEY = 'todo-app:data';

  private todos: Todo[] = [];
  private readonly listeners: Listener[] = [];

  constructor() {
    this.todos = this.load();
  }

  get all(): readonly Todo[] {
    return this.todos;
  }

  get remaining(): number {
    return this.todos.filter(({ completed }) => !completed).length;
  }

  get completedCount(): number {
    return this.todos.length - this.remaining;
  }

  subscribe(listener: Listener): void {
    this.listeners.push(listener);
  }

  visible(filter: Filter): Todo[] {
    switch (filter) {
      case 'active':
        return this.todos.filter(({ completed }) => !completed);
      case 'completed':
        return this.todos.filter(({ completed }) => completed);
      default:
        return [...this.todos];
    }
  }

  add(text: string): boolean {
    const clean = text.trim();
    if (!clean) return false;
    this.update([...this.todos, { id: TodoStore.makeId(), text: clean, completed: false }]);
    return true;
  }

  toggle(id: string): void {
    this.update(
      this.todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  }

  edit(id: string, text: string): boolean {
    const clean = text.trim();
    if (!clean || !this.todos.some((todo) => todo.id === id)) return false;
    this.update(this.todos.map((todo) => (todo.id === id ? { ...todo, text: clean } : todo)));
    return true;
  }

  remove(id: string): void {
    this.update(this.todos.filter((todo) => todo.id !== id));
  }

  clearCompleted(): void {
    this.update(this.todos.filter(({ completed }) => !completed));
  }

  clearAll(): void {
    this.update([]);
  }

  reload(): void {
    this.todos = this.load();
    this.notify();
  }

  private update(next: Todo[]): void {
    this.todos = next;
    this.save();
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.todos));
  }

  private load(): Todo[] {
    try {
      const raw = localStorage.getItem(TodoStore.KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      return parsed.filter(TodoStore.isTodo).map(({ id, text, completed }) => {
        const unique = seen.has(id) ? TodoStore.makeId() : id;
        seen.add(unique);
        return { id: unique, text, completed };
      });
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(TodoStore.KEY, JSON.stringify(this.todos));
    } catch {
      return;
    }
  }

  private static isTodo(value: unknown): value is Todo {
    if (typeof value !== 'object' || value === null) return false;
    const { id, text, completed } = value as Record<string, unknown>;
    return (
      typeof id === 'string' &&
      id !== '' &&
      typeof text === 'string' &&
      text.trim() !== '' &&
      typeof completed === 'boolean'
    );
  }

  private static makeId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

class TodoApp {
  private static readonly TRASH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/></svg>';

  private static readonly EMPTY_MESSAGES: Record<Filter, string> = {
    all: 'No todos yet. Add one above.',
    active: 'No active todos.',
    completed: 'No completed todos.'
  };

  private filter: Filter = 'all';

  private readonly form = TodoApp.pick<HTMLFormElement>('#todo-form');
  private readonly input = TodoApp.pick<HTMLInputElement>('#input-box');
  private readonly list = TodoApp.pick<HTMLUListElement>('#list-container');
  private readonly count = TodoApp.pick<HTMLSpanElement>('#count');
  private readonly clearCompletedButton = TodoApp.pick<HTMLButtonElement>('#clear-completed');
  private readonly clearAllButton = TodoApp.pick<HTMLButtonElement>('#clear-all');
  private readonly filterButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.filter')
  );

  constructor(private readonly store: TodoStore) {
    this.bindEvents();
    this.store.subscribe(() => this.render());
    this.render();
  }

  private static pick<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  }

  private static toFilter(value: string | undefined): Filter {
    return value === 'active' || value === 'completed' ? value : 'all';
  }

  private static idOf(target: EventTarget | null): string | undefined {
    if (!(target instanceof Element)) return undefined;
    return target.closest<HTMLElement>('li.todo')?.dataset.id;
  }

  private bindEvents(): void {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.filter === 'completed') this.setFilter('all');
      const added = this.store.add(this.input.value);
      this.form.classList.toggle('invalid', !added);
      this.input.setAttribute('aria-invalid', String(!added));
      if (added) this.input.value = '';
      this.input.focus();
    });

    this.input.addEventListener('input', () => {
      this.form.classList.remove('invalid');
      this.input.removeAttribute('aria-invalid');
    });

    this.list.addEventListener('change', (event) => {
      const { target } = event;
      if (!(target instanceof HTMLInputElement) || !target.classList.contains('toggle')) return;
      const id = TodoApp.idOf(target);
      if (id) this.store.toggle(id);
    });

    this.list.addEventListener('click', (event) => {
      const { target } = event;
      if (!(target instanceof Element) || !target.closest('.delete')) return;
      const id = TodoApp.idOf(target);
      if (id) this.store.remove(id);
    });

    this.list.addEventListener('dblclick', (event) => {
      const { target } = event;
      if (!(target instanceof Element)) return;
      const label = target.closest('.text');
      const item = target.closest<HTMLLIElement>('li.todo');
      const id = TodoApp.idOf(target);
      if (label && item && id) this.startEdit(item, id);
    });

    this.filterButtons.forEach((button) => {
      button.addEventListener('click', () => this.setFilter(TodoApp.toFilter(button.dataset.filter)));
    });

    this.clearCompletedButton.addEventListener('click', () => this.store.clearCompleted());

    this.clearAllButton.addEventListener('click', () => {
      if (this.store.all.length && window.confirm('Delete all todos?')) this.store.clearAll();
    });

    window.addEventListener('storage', ({ key }) => {
      if (key === TodoStore.KEY || key === null) this.store.reload();
    });
  }

  private setFilter(filter: Filter): void {
    this.filter = filter;
    this.render();
  }

  private startEdit(item: HTMLLIElement, id: string): void {
    const label = item.querySelector<HTMLSpanElement>('.text');
    const todo = this.store.all.find((entry) => entry.id === id);
    if (!label || !todo) return;

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
    const finish = (save: boolean): void => {
      if (finished) return;
      finished = true;
      if (save && this.store.edit(id, editor.value)) return;
      this.render();
    };

    editor.addEventListener('keydown', (event) => {
      if (event.isComposing) return;
      if (event.key === 'Enter') finish(true);
      else if (event.key === 'Escape') finish(false);
    });
    editor.addEventListener('blur', () => finish(true));
  }

  private createItem({ id, text, completed }: Todo): HTMLLIElement {
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

  private render(): void {
    const active = document.activeElement;
    const refocusId =
      active instanceof HTMLInputElement && active.classList.contains('toggle')
        ? TodoApp.idOf(active)
        : undefined;

    const items = this.store.visible(this.filter);
    if (items.length) {
      this.list.replaceChildren(...items.map((todo) => this.createItem(todo)));
    } else {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = TodoApp.EMPTY_MESSAGES[this.filter];
      this.list.replaceChildren(empty);
    }

    if (refocusId) {
      const match = Array.from(this.list.children).find(
        (child) => child instanceof HTMLElement && child.dataset.id === refocusId
      );
      match?.querySelector<HTMLInputElement>('.toggle')?.focus();
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

new TodoApp(new TodoStore());