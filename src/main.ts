import './style.css';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

class DiaryApp {
  private entries: DiaryEntry[] = [];
  private filteredEntries: DiaryEntry[] = [];
  private form: HTMLFormElement;
  private titleInput: HTMLInputElement;
  private contentInput: HTMLTextAreaElement;
  private diaryList: HTMLElement;
  private editingId: string | undefined = undefined;
  private searchInput: HTMLInputElement;
  private dateFromInput: HTMLInputElement;
  private dateToInput: HTMLInputElement;
  private clearSearchButton: HTMLButtonElement;
  private searchResultsCount: HTMLElement;
  private currentSearchTerm: string = '';

  constructor() {
    this.form = document.getElementById('diary-form') as HTMLFormElement;
    this.titleInput = document.getElementById(
      'diary-title'
    ) as HTMLInputElement;
    this.contentInput = document.getElementById(
      'diary-content'
    ) as HTMLTextAreaElement;
    this.diaryList = document.getElementById('diary-list') as HTMLElement;
    this.searchInput = document.getElementById(
      'search-input'
    ) as HTMLInputElement;
    this.dateFromInput = document.getElementById(
      'date-from'
    ) as HTMLInputElement;
    this.dateToInput = document.getElementById('date-to') as HTMLInputElement;
    this.clearSearchButton = document.getElementById(
      'clear-search'
    ) as HTMLButtonElement;
    this.searchResultsCount = document.getElementById(
      'search-results-count'
    ) as HTMLElement;

    this.loadEntries();
    this.bindEvents();
    this.applyFilters();
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

    this.searchInput.addEventListener('input', () => {
      this.applyFilters();
    });

    this.dateFromInput.addEventListener('change', () => {
      this.applyFilters();
    });

    this.dateToInput.addEventListener('change', () => {
      this.applyFilters();
    });

    this.clearSearchButton.addEventListener('click', () => {
      this.clearFilters();
    });
  }

  private addEntry() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!(title && content)) {
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
    this.applyFilters();
    this.clearForm();
  }

  private deleteEntry(id: string) {
    if (confirm('この日記を削除しますか？')) {
      this.entries = this.entries.filter(entry => entry.id !== id);
      this.saveEntries();
      this.applyFilters();
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
      this.applyFilters();
      this.cancelEdit();
    }
  }

  private cancelEdit() {
    this.editingId = undefined;
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

      formTitle.textContent = '日記を編集 ';
      const cancelButton = document.createElement('button');
      cancelButton.id = 'cancel-edit';
      cancelButton.textContent = 'キャンセル';
      cancelButton.className =
        'ml-2 text-sm bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600';
      cancelButton.addEventListener('click', () => this.cancelEdit());

      formTitle.appendChild(cancelButton);
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
      try {
        this.entries = JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing diary entries:', error);
      }
    }
  }

  private applyFilters() {
    const searchTerm = this.searchInput.value.toLowerCase().trim();
    const dateFrom = this.dateFromInput.value;
    const dateTo = this.dateToInput.value;

    this.currentSearchTerm = searchTerm;

    this.filteredEntries = this.entries.filter(entry => {
      const matchesSearch =
        !searchTerm ||
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm);

      const entryDate = this.parseJapaneseDate(entry.date);
      const matchesDateFrom = !dateFrom || entryDate >= new Date(dateFrom);
      const matchesToDate =
        !dateTo || entryDate <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesDateFrom && matchesToDate;
    });

    this.updateSearchResultsCount();
    this.renderEntries();
  }

  private parseJapaneseDate(dateString: string): Date {
    const match = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      return new Date(year, month, day);
    }
    return new Date();
  }

  private updateSearchResultsCount() {
    const total = this.entries.length;
    const filtered = this.filteredEntries.length;

    if (
      this.currentSearchTerm ||
      this.dateFromInput.value ||
      this.dateToInput.value
    ) {
      this.searchResultsCount.textContent = `${filtered}件 / ${total}件`;
    } else {
      this.searchResultsCount.textContent = `${total}件`;
    }
  }

  private clearFilters() {
    this.searchInput.value = '';
    this.dateFromInput.value = '';
    this.dateToInput.value = '';
    this.currentSearchTerm = '';
    this.applyFilters();
  }

  private createHighlightedElement(
    text: string,
    searchTerm: string
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();

    if (!searchTerm) {
      fragment.appendChild(document.createTextNode(text));
      return fragment;
    }

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    parts.forEach(part => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        const mark = document.createElement('mark');
        mark.className = 'bg-yellow-200 px-1 rounded';
        mark.textContent = part;
        fragment.appendChild(mark);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    return fragment;
  }

  private renderEntries() {
    this.diaryList.innerHTML = '';
    if (this.filteredEntries.length === 0 && this.entries.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'text-center text-gray-500 py-8';

      const titleP = document.createElement('p');
      titleP.className = 'text-lg';
      titleP.textContent = 'まだ日記がありません';

      const subtitleP = document.createElement('p');
      subtitleP.className = 'text-sm';
      subtitleP.textContent = '上のフォームから最初の日記を書いてみましょう！';

      emptyDiv.appendChild(titleP);
      emptyDiv.appendChild(subtitleP);
      this.diaryList.appendChild(emptyDiv);
      return;
    }

    if (this.filteredEntries.length === 0 && this.entries.length > 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'text-center text-gray-500 py-8';

      const titleP = document.createElement('p');
      titleP.className = 'text-lg';
      titleP.textContent = '検索条件に一致する日記がありません';

      const subtitleP = document.createElement('p');
      subtitleP.className = 'text-sm';
      subtitleP.textContent = '検索条件を変更してみてください';

      noResultsDiv.appendChild(titleP);
      noResultsDiv.appendChild(subtitleP);
      this.diaryList.appendChild(noResultsDiv);
      return;
    }

    this.filteredEntries.forEach(entry => {
      const entryDiv = document.createElement('div');
      entryDiv.className =
        'border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow';

      const headerDiv = document.createElement('div');
      headerDiv.className = 'flex justify-between items-start mb-2';

      const titleH3 = document.createElement('h3');
      titleH3.className = 'text-lg font-medium text-gray-800';
      titleH3.appendChild(
        this.createHighlightedElement(entry.title, this.currentSearchTerm)
      );

      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'flex space-x-2';

      const editButton = document.createElement('button');
      editButton.className =
        'text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded transition-colors';
      editButton.title = '編集';
      editButton.textContent = '✏️';
      editButton.addEventListener('click', () => this.editEntry(entry.id));

      const deleteButton = document.createElement('button');
      deleteButton.className =
        'text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded transition-colors';
      deleteButton.title = '削除';
      deleteButton.textContent = '🗑️';
      deleteButton.addEventListener('click', () => this.deleteEntry(entry.id));

      buttonsDiv.appendChild(editButton);
      buttonsDiv.appendChild(deleteButton);

      headerDiv.appendChild(titleH3);
      headerDiv.appendChild(buttonsDiv);

      const dateP = document.createElement('p');
      dateP.className = 'text-gray-600 text-sm mb-2';
      dateP.textContent = entry.date;

      const contentP = document.createElement('p');
      contentP.className = 'text-gray-700 leading-relaxed whitespace-pre-wrap';
      contentP.appendChild(
        this.createHighlightedElement(entry.content, this.currentSearchTerm)
      );

      entryDiv.appendChild(headerDiv);
      entryDiv.appendChild(dateP);
      entryDiv.appendChild(contentP);

      this.diaryList.appendChild(entryDiv);
    });
  }
}

new DiaryApp();
