import './style.css';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

class DiaryApp {
  private entries: DiaryEntry[] = [];
  private form: HTMLFormElement;
  private titleInput: HTMLInputElement;
  private contentInput: HTMLTextAreaElement;
  private diaryList: HTMLElement;
  private editingId: string | null = null;

  constructor() {
    this.form = document.getElementById('diary-form') as HTMLFormElement;
    this.titleInput = document.getElementById(
      'diary-title'
    ) as HTMLInputElement;
    this.contentInput = document.getElementById(
      'diary-content'
    ) as HTMLTextAreaElement;
    this.diaryList = document.getElementById('diary-list') as HTMLElement;

    this.loadEntries();
    this.bindEvents();
    this.renderEntries();
  }

  private bindEvents() {
    this.form.addEventListener('submit', e => {
      e.preventDefault();
      if (this.editingId) {
        this.updateEntry();
      } else {
        this.addEntry();
      }
    });
  }

  private addEntry() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!title || !content) {
      alert('タイトルと内容を入力してください');
      return;
    }

    const entry: DiaryEntry = {
      id: Date.now().toString(),
      title,
      content,
      date: new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    };

    this.entries.unshift(entry);
    this.saveEntries();
    this.renderEntries();
    this.clearForm();
  }

  private deleteEntry(id: string) {
    if (confirm('この日記を削除しますか？')) {
      this.entries = this.entries.filter(entry => entry.id !== id);
      this.saveEntries();
      this.renderEntries();
    }
  }

  private editEntry(id: string) {
    const entry = this.entries.find(entry => entry.id === id);
    if (entry) {
      this.titleInput.value = entry.title;
      this.contentInput.value = entry.content;
      this.editingId = id;
      this.updateFormForEditing();
      window.scrollTo(0, 0);
    }
  }

  private updateEntry() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!title || !content) {
      alert('タイトルと内容を入力してください');
      return;
    }

    const entryIndex = this.entries.findIndex(
      entry => entry.id === this.editingId
    );
    if (entryIndex !== -1) {
      this.entries[entryIndex] = {
        ...this.entries[entryIndex],
        title,
        content,
      };
      this.saveEntries();
      this.renderEntries();
      this.cancelEdit();
    }
  }

  private cancelEdit() {
    this.editingId = null;
    this.clearForm();
    this.updateFormForEditing();
  }

  private updateFormForEditing() {
    const submitButton = this.form.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    const formTitle = document.querySelector('h2') as HTMLElement;

    if (this.editingId) {
      submitButton.textContent = '更新する';
      submitButton.className =
        'w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200';
      formTitle.innerHTML =
        '日記を編集 <button id="cancel-edit" class="ml-2 text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600">キャンセル</button>';

      const cancelButton = document.getElementById('cancel-edit');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => this.cancelEdit());
      }
    } else {
      submitButton.textContent = '保存する';
      submitButton.className =
        'w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200';
      formTitle.textContent = '新しい日記を書く';
    }
  }

  private clearForm() {
    this.titleInput.value = '';
    this.contentInput.value = '';
  }

  private saveEntries() {
    localStorage.setItem('diary-entries', JSON.stringify(this.entries));
  }

  private loadEntries() {
    const stored = localStorage.getItem('diary-entries');
    if (stored) {
      this.entries = JSON.parse(stored);
    }
  }

  private renderEntries() {
    if (this.entries.length === 0) {
      this.diaryList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <p class="text-lg">まだ日記がありません</p>
          <p class="text-sm">上のフォームから最初の日記を書いてみましょう！</p>
        </div>
      `;
      return;
    }

    this.diaryList.innerHTML = this.entries
      .map(
        entry => `
      <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-medium text-gray-800">${this.escapeHtml(
            entry.title
          )}</h3>
          <div class="flex space-x-2">
            <button 
              onclick="app.handleEditEntry('${entry.id}')"
              class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded transition-colors"
              title="編集"
            >
              ✏️
            </button>
            <button 
              onclick="app.handleDeleteEntry('${entry.id}')"
              class="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded transition-colors"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>
        <p class="text-gray-600 text-sm mb-2">${entry.date}</p>
        <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${this.escapeHtml(
          entry.content
        )}</p>
      </div>
    `
      )
      .join('');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public handleEditEntry(id: string) {
    this.editEntry(id);
  }

  public handleDeleteEntry(id: string) {
    this.deleteEntry(id);
  }

  public handleCancelEdit() {
    this.cancelEdit();
  }
}

declare global {
  interface Window {
    app: DiaryApp;
  }
}

const app = new DiaryApp();
window.app = app;
