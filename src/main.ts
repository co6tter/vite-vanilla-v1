import './style.css';

interface MoodRating {
  value: number;
  emoji: string;
  label: string;
}

interface DiaryTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: 'preset' | 'custom';
  createdAt: string;
}

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: number;
  images?: string[];
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
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
  private moodButtons: HTMLElement[] = [];
  private selectedMood: number | undefined = undefined;
  private selectedImages: string[] = [];
  private selectedAttachments: FileAttachment[] = [];
  private imageInput: HTMLInputElement;
  private fileInput: HTMLInputElement;
  // テンプレート関連
  private templates: DiaryTemplate[] = [];
  private templateSelector: HTMLSelectElement;
  private saveTemplateButton: HTMLButtonElement;
  private manageTemplatesButton: HTMLButtonElement;
  // UI Settings properties
  private settingsToggle!: HTMLButtonElement;
  private settingsPanel!: HTMLElement;
  private darkModeToggle!: HTMLButtonElement;
  private fontSizeButtons!: NodeListOf<HTMLButtonElement>;
  private fontFamilySelect!: HTMLSelectElement;
  private currentTheme: 'light' | 'dark' = 'light';
  private currentFontSize: 'small' | 'medium' | 'large' = 'medium';
  private currentFontFamily: 'system' | 'serif' | 'sans-serif' | 'monospace' =
    'system';

  private readonly moodRatings: MoodRating[] = [
    { value: 1, emoji: '😢', label: 'とても悲しい' },
    { value: 2, emoji: '😐', label: '悲しい' },
    { value: 3, emoji: '😊', label: '普通' },
    { value: 4, emoji: '😄', label: '嬉しい' },
    { value: 5, emoji: '😍', label: 'とても嬉しい' },
  ];
  private readonly presetTemplates: DiaryTemplate[] = [
    {
      id: 'daily-reflection',
      name: '日々の振り返り',
      title: '今日の振り返り',
      content:
        '今日は何をしましたか：\n\n学んだこと：\n\n感謝したいこと：\n\n明日に向けて：',
      type: 'preset',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gratitude-diary',
      name: '感謝日記',
      title: '今日の感謝',
      content: '感謝していること（3つ）：\n1. \n2. \n3. \n\nその理由：',
      type: 'preset',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'work-log',
      name: '業務日報',
      title: '業務日報 - {{DATE}}',
      content:
        '今日の作業内容：\n\n成果・達成したこと：\n\n課題・問題点：\n\n明日の予定：',
      type: 'preset',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'health-log',
      name: '健康記録',
      title: '健康記録',
      content: '体調：\n\n運動：\n\n食事：\n\n睡眠：\n\nその他メモ：',
      type: 'preset',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'learning-log',
      name: '学習記録',
      title: '学習記録',
      content:
        '学習内容：\n\n新しく覚えたこと：\n\n理解度（1-5）：\n\n次回の目標：',
      type: 'preset',
      createdAt: new Date().toISOString(),
    },
  ];

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
    this.imageInput = document.getElementById(
      'image-input'
    ) as HTMLInputElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;

    // テンプレート要素の初期化
    this.templateSelector = document.getElementById(
      'template-selector'
    ) as HTMLSelectElement;
    this.saveTemplateButton = document.getElementById(
      'save-template'
    ) as HTMLButtonElement;
    this.manageTemplatesButton = document.getElementById(
      'manage-templates'
    ) as HTMLButtonElement;

    // UI設定要素の初期化
    this.settingsToggle = document.getElementById(
      'settings-toggle'
    ) as HTMLButtonElement;
    this.settingsPanel = document.getElementById(
      'settings-panel'
    ) as HTMLElement;
    this.darkModeToggle = document.getElementById(
      'dark-mode-toggle'
    ) as HTMLButtonElement;
    this.fontSizeButtons = document.querySelectorAll(
      '[id^="font-size-"]'
    ) as NodeListOf<HTMLButtonElement>;
    this.fontFamilySelect = document.getElementById(
      'font-family-select'
    ) as HTMLSelectElement;

    this.loadEntries();
    this.loadTemplates();
    this.loadUISettings();
    // テーマの状態を確実に同期
    this.applyTheme();
    this.bindEvents();
    this.initializeMoodSelector();
    this.initializeFileInputs();
    this.initializeTemplateFeatures();
    this.initializeExportFeatures();
    this.initializeUISettings();
    this.updateUIControls();
    this.updateMoodFeatures();
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
      mood: this.selectedMood,
      images: [...this.selectedImages],
      attachments: [...this.selectedAttachments],
    };

    this.entries.unshift(entry);
    this.saveEntries();
    this.updateMoodFeatures();
    this.applyFilters();
    this.clearForm();
  }

  private deleteEntry(id: string) {
    if (confirm('この日記を削除しますか？')) {
      this.entries = this.entries.filter(entry => entry.id !== id);
      this.saveEntries();
      this.updateMoodFeatures();
      this.applyFilters();
    }
  }

  private editEntry(id: string) {
    const entry = this.entries.find(entry => entry.id === id);
    if (entry) {
      this.titleInput.value = entry.title;
      this.contentInput.value = entry.content;
      this.selectedMood = entry.mood;
      this.selectedImages = entry.images ? [...entry.images] : [];
      this.selectedAttachments = entry.attachments
        ? [...entry.attachments]
        : [];
      this.updateMoodSelection();
      this.updateFileDisplay();
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
        mood: this.selectedMood,
        images: [...this.selectedImages],
        attachments: [...this.selectedAttachments],
      };
      this.saveEntries();
      this.updateMoodFeatures();
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
    this.selectedMood = undefined;
    this.selectedImages = [];
    this.selectedAttachments = [];
    this.updateMoodSelection();
    this.updateFileDisplay();
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

  // UI Settings Methods
  private loadUISettings(): void {
    const theme = localStorage.getItem('diary-theme') as
      | 'light'
      | 'dark'
      | null;
    const fontSize = localStorage.getItem('diary-font-size') as
      | 'small'
      | 'medium'
      | 'large'
      | null;
    const fontFamily = localStorage.getItem('diary-font-family') as
      | 'system'
      | 'serif'
      | 'sans-serif'
      | 'monospace'
      | null;

    this.currentTheme = theme || 'light';
    this.currentFontSize = fontSize || 'medium';
    this.currentFontFamily = fontFamily || 'system';

    this.applyFontSize();
    this.applyFontFamily();
  }

  private saveUISettings(): void {
    localStorage.setItem('diary-theme', this.currentTheme);
    localStorage.setItem('diary-font-size', this.currentFontSize);
    localStorage.setItem('diary-font-family', this.currentFontFamily);
  }

  private initializeUISettings(): void {
    // Settings panel toggle
    this.settingsToggle.addEventListener('click', () => {
      this.settingsPanel.classList.toggle('hidden');
    });

    // Dark mode toggle
    this.darkModeToggle.addEventListener('click', () => {
      this.toggleDarkMode();
    });

    // Font size buttons
    this.fontSizeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const size = button.id.replace('font-size-', '') as
          | 'small'
          | 'medium'
          | 'large';
        this.setFontSize(size);
      });
    });

    // Font family select
    this.fontFamilySelect.addEventListener('change', () => {
      const family = this.fontFamilySelect.value as
        | 'system'
        | 'serif'
        | 'sans-serif'
        | 'monospace';
      this.setFontFamily(family);
    });

    // Close settings panel when clicking outside
    document.addEventListener('click', e => {
      if (
        !this.settingsPanel.contains(e.target as Node) &&
        !this.settingsToggle.contains(e.target as Node) &&
        !this.settingsPanel.classList.contains('hidden')
      ) {
        this.settingsPanel.classList.add('hidden');
      }
    });

    this.updateUIControls();
  }

  private toggleDarkMode(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveUISettings();
    this.updateUIControls();
  }

  private applyTheme(): void {
    if (this.currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.currentFontSize = size;
    this.applyFontSize();
    this.saveUISettings();
    this.updateUIControls();
  }

  private applyFontSize(): void {
    const app = document.getElementById('app') as HTMLElement;
    app.classList.remove('text-sm', 'text-base', 'text-lg');

    switch (this.currentFontSize) {
      case 'small':
        app.classList.add('text-sm');
        break;
      case 'large':
        app.classList.add('text-lg');
        break;
      case 'medium':
      default:
        app.classList.add('text-base');
        break;
    }
  }

  private setFontFamily(
    family: 'system' | 'serif' | 'sans-serif' | 'monospace'
  ): void {
    this.currentFontFamily = family;
    this.applyFontFamily();
    this.saveUISettings();
  }

  private applyFontFamily(): void {
    const body = document.body;
    body.classList.remove('font-serif', 'font-sans', 'font-mono');

    switch (this.currentFontFamily) {
      case 'serif':
        body.classList.add('font-serif');
        break;
      case 'sans-serif':
        body.classList.add('font-sans');
        break;
      case 'monospace':
        body.classList.add('font-mono');
        break;
      case 'system':
      default:
        // Use system default
        break;
    }
  }

  private updateUIControls(): void {
    // Update dark mode toggle
    const darkModeSwitch = document.getElementById(
      'dark-mode-switch'
    ) as HTMLElement;
    if (this.currentTheme === 'dark') {
      this.darkModeToggle.classList.remove('bg-gray-200');
      this.darkModeToggle.classList.add('bg-blue-600');
      darkModeSwitch.classList.remove('translate-x-0');
      darkModeSwitch.classList.add('translate-x-6');
    } else {
      this.darkModeToggle.classList.remove('bg-blue-600');
      this.darkModeToggle.classList.add('bg-gray-200');
      darkModeSwitch.classList.remove('translate-x-6');
      darkModeSwitch.classList.add('translate-x-0');
    }

    // Update font size buttons
    this.fontSizeButtons.forEach(button => {
      const size = button.id.replace('font-size-', '');
      if (size === this.currentFontSize) {
        button.classList.add('bg-blue-100', 'dark:bg-blue-900');
      } else {
        button.classList.remove('bg-blue-100', 'dark:bg-blue-900');
      }
    });

    // Update font family select
    this.fontFamilySelect.value = this.currentFontFamily;
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
    // 既存のコンテンツをクリア
    this.diaryList.textContent = '';

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

      const moodP = document.createElement('p');
      moodP.className = 'text-sm mb-2';
      if (entry.mood) {
        const moodRating = this.moodRatings.find(m => m.value === entry.mood);
        if (moodRating) {
          moodP.textContent = '気分: ';

          const emojiSpan = document.createElement('span');
          emojiSpan.className = 'text-lg';
          emojiSpan.textContent = moodRating.emoji;

          const labelSpan = document.createElement('span');
          labelSpan.textContent = ` ${moodRating.label}`;

          moodP.appendChild(emojiSpan);
          moodP.appendChild(labelSpan);
        }
      } else {
        moodP.textContent = '気分: 未設定';
        moodP.className = 'text-sm mb-2 text-gray-400';
      }

      const contentP = document.createElement('p');
      contentP.className = 'text-gray-700 leading-relaxed whitespace-pre-wrap';
      contentP.appendChild(
        this.createHighlightedElement(entry.content, this.currentSearchTerm)
      );

      entryDiv.appendChild(headerDiv);
      entryDiv.appendChild(dateP);
      entryDiv.appendChild(moodP);
      entryDiv.appendChild(contentP);

      if (entry.images && entry.images.length > 0) {
        this.appendImagesDisplay(entryDiv, entry.images);
      }

      if (entry.attachments && entry.attachments.length > 0) {
        this.appendAttachmentsDisplay(entryDiv, entry.attachments);
      }

      this.diaryList.appendChild(entryDiv);
    });
  }

  private initializeMoodSelector() {
    const moodContainer = document.getElementById('mood-selector');
    if (!moodContainer) return;

    this.moodRatings.forEach(mood => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className =
        'mood-button p-3 border-2 rounded-lg transition-all hover:scale-105 focus:outline-none';

      const emojiDiv = document.createElement('div');
      emojiDiv.className = 'text-2xl mb-1';
      emojiDiv.textContent = mood.emoji;

      const labelDiv = document.createElement('div');
      labelDiv.className = 'text-xs';
      labelDiv.textContent = mood.label;

      button.appendChild(emojiDiv);
      button.appendChild(labelDiv);
      button.addEventListener('click', () => this.selectMood(mood.value));
      this.moodButtons.push(button);
      moodContainer.appendChild(button);
    });

    this.updateMoodSelection();
  }

  private selectMood(value: number) {
    this.selectedMood = this.selectedMood === value ? undefined : value;
    this.updateMoodSelection();
  }

  private updateMoodSelection() {
    this.moodButtons.forEach((button, index) => {
      const moodValue = this.moodRatings[index].value;
      if (this.selectedMood === moodValue) {
        button.className =
          'mood-button p-3 border-2 border-blue-500 bg-blue-50 rounded-lg transition-all hover:scale-105 focus:outline-none';
      } else {
        button.className =
          'mood-button p-3 border-2 border-gray-200 rounded-lg transition-all hover:scale-105 focus:outline-none';
      }
    });
  }

  private getMoodStats() {
    const moodCounts: { [key: number]: number } = {};
    let totalEntries = 0;

    this.entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        totalEntries++;
      }
    });

    return {
      counts: moodCounts,
      total: totalEntries,
      average:
        totalEntries > 0
          ? Object.entries(moodCounts).reduce(
              (sum, [mood, count]) => sum + parseInt(mood) * count,
              0
            ) / totalEntries
          : 0,
    };
  }

  // 投稿頻度統計を取得
  private getPostFrequencyStats() {
    const frequencyData: { [key: string]: number } = {};
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 過去30日間の日付を生成
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      frequencyData[dateStr] = 0;
    }

    // 各エントリの投稿日をカウント（日本語日付対応）
    this.entries.forEach(entry => {
      try {
        let entryDate: Date;

        // 日本語形式の日付かどうかチェック
        if (
          entry.date.includes('年') &&
          entry.date.includes('月') &&
          entry.date.includes('日')
        ) {
          entryDate = this.parseJapaneseDate(entry.date);
        } else {
          entryDate = new Date(entry.date);
        }

        if (isNaN(entryDate.getTime())) {
          console.warn('Invalid date found in entry:', entry.date);
          return;
        }

        const dateStr = entryDate.toISOString().split('T')[0];
        if (frequencyData.hasOwnProperty(dateStr)) {
          frequencyData[dateStr]++;
        }
      } catch (error) {
        console.warn('Error processing entry date:', entry.date, error);
      }
    });

    // 週間、月間統計を計算
    const weeklyData: { [key: string]: number } = {};
    const monthlyData: { [key: string]: number } = {};

    Object.entries(frequencyData).forEach(([date, count]) => {
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return;

        const weekKey = this.getWeekKey(d);
        const monthKey =
          d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + count;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + count;
      } catch (error) {
        console.warn('Error processing date in frequency data:', date, error);
      }
    });

    return {
      daily: frequencyData,
      weekly: weeklyData,
      monthly: monthlyData,
      totalPosts: this.entries.length,
      averagePerDay:
        this.entries.length > 0
          ? this.entries.length / Object.keys(frequencyData).length
          : 0,
    };
  }

  // 週のキーを生成（年-週番号）
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor(
      (date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekNumber = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  // 文字数トレンド統計を取得
  private getCharacterTrends() {
    const trends: { date: string; count: number; title: string }[] = [];

    this.entries
      .filter(entry => {
        // 有効な日付のみをフィルタ（日本語日付対応）
        try {
          let date: Date;
          if (
            entry.date.includes('年') &&
            entry.date.includes('月') &&
            entry.date.includes('日')
          ) {
            date = this.parseJapaneseDate(entry.date);
          } else {
            date = new Date(entry.date);
          }
          return !isNaN(date.getTime());
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        // ソート用の日付変換（日本語日付対応）
        const getDateForSort = (dateStr: string) => {
          if (
            dateStr.includes('年') &&
            dateStr.includes('月') &&
            dateStr.includes('日')
          ) {
            return this.parseJapaneseDate(dateStr);
          }
          return new Date(dateStr);
        };
        return (
          getDateForSort(a.date).getTime() - getDateForSort(b.date).getTime()
        );
      })
      .forEach(entry => {
        const totalChars =
          (entry.title?.length || 0) + (entry.content?.length || 0);
        trends.push({
          date: entry.date,
          count: totalChars,
          title: entry.title,
        });
      });

    // 統計計算
    const counts = trends.map(t => t.count);
    const averageCharCount =
      counts.length > 0
        ? counts.reduce((sum, count) => sum + count, 0) / counts.length
        : 0;
    const maxCharCount = counts.length > 0 ? Math.max(...counts) : 0;
    const minCharCount = counts.length > 0 ? Math.min(...counts) : 0;

    // 最近7日間の平均
    const recentTrends = trends.slice(-7);
    const recentAverage =
      recentTrends.length > 0
        ? recentTrends.reduce((sum, t) => sum + t.count, 0) /
          recentTrends.length
        : 0;

    return {
      trends,
      averageCharCount: Math.round(averageCharCount),
      maxCharCount,
      minCharCount,
      recentAverage: Math.round(recentAverage),
      totalEntries: trends.length,
    };
  }

  // 継続日数カウンタを取得
  private getContinuousDaysStats() {
    if (this.entries.length === 0) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        lastPostDate: null,
        streakStartDate: null,
        totalDaysPosted: 0,
      };
    }

    // 有効な日付のみを取得してソートしてユニークな投稿日を取得（日本語日付対応）
    const validDates = this.entries
      .map(entry => {
        try {
          let date: Date;
          if (
            entry.date.includes('年') &&
            entry.date.includes('月') &&
            entry.date.includes('日')
          ) {
            date = this.parseJapaneseDate(entry.date);
          } else {
            date = new Date(entry.date);
          }

          if (isNaN(date.getTime())) {
            return null;
          }

          return date.toISOString().split('T')[0];
        } catch {
          return null;
        }
      })
      .filter((dateStr): dateStr is string => dateStr !== null);

    const uniqueDates = [...new Set(validDates)].sort();

    if (uniqueDates.length === 0) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        lastPostDate: null,
        streakStartDate: null,
        totalDaysPosted: 0,
      };
    }

    let maxStreak = 0;
    let currentStreak = 1;

    // 最長連続記録を計算
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff =
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }

    // 最後のストリークチェック
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    // 現在のストリーク計算
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastPostDate = uniqueDates[uniqueDates.length - 1];

    let currentActiveStreak = 0;
    let activeStreakStart = null;

    if (
      lastPostDate === today.toISOString().split('T')[0] ||
      lastPostDate === yesterday.toISOString().split('T')[0]
    ) {
      // 今日または昨日に投稿があった場合、現在のストリークを計算
      currentActiveStreak = 1;
      activeStreakStart = lastPostDate;

      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const currDate = new Date(uniqueDates[i]);
        const nextDate = new Date(uniqueDates[i + 1]);
        const dayDiff =
          (nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          currentActiveStreak++;
          activeStreakStart = uniqueDates[i];
        } else {
          break;
        }
      }
    }

    return {
      currentStreak: currentActiveStreak,
      maxStreak,
      lastPostDate: lastPostDate,
      streakStartDate: activeStreakStart,
      totalDaysPosted: uniqueDates.length,
    };
  }

  private renderMoodStats() {
    const statsContainer = document.getElementById('mood-stats');
    if (!statsContainer) return;

    // 既存のコンテンツをクリア
    statsContainer.textContent = '';

    const stats = this.getMoodStats();

    if (stats.total === 0) {
      const noDataP = document.createElement('p');
      noDataP.className = 'text-gray-500 text-center';
      noDataP.textContent = 'まだ気分データがありません';
      statsContainer.appendChild(noDataP);
      return;
    }

    // グリッドコンテナを作成
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid grid-cols-2 md:grid-cols-3 gap-4 mb-4';

    // 各気分の統計を作成
    this.moodRatings.forEach(mood => {
      const count = stats.counts[mood.value] || 0;
      const percentage =
        stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

      const statDiv = document.createElement('div');
      statDiv.className = 'text-center p-3 bg-gray-50 rounded-lg';

      const emojiDiv = document.createElement('div');
      emojiDiv.className = 'text-2xl mb-1';
      emojiDiv.textContent = mood.emoji;

      const countDiv = document.createElement('div');
      countDiv.className = 'text-sm font-semibold';
      countDiv.textContent = `${count}回`;

      const percentageDiv = document.createElement('div');
      percentageDiv.className = 'text-xs text-gray-600';
      percentageDiv.textContent = `${percentage}%`;

      statDiv.appendChild(emojiDiv);
      statDiv.appendChild(countDiv);
      statDiv.appendChild(percentageDiv);
      gridDiv.appendChild(statDiv);
    });

    // 平均気分セクションを作成
    const averageDiv = document.createElement('div');
    averageDiv.className = 'text-center p-3 bg-blue-50 rounded-lg';

    const averageLabelDiv = document.createElement('div');
    averageLabelDiv.className = 'text-sm text-gray-600';
    averageLabelDiv.textContent = '平均気分';

    const averageValueDiv = document.createElement('div');
    averageValueDiv.className = 'text-lg';

    const averageMood = this.moodRatings.find(
      m => Math.round(stats.average) === m.value
    );

    if (averageMood) {
      averageValueDiv.textContent = `${averageMood.emoji} ${averageMood.label}`;
    } else {
      averageValueDiv.textContent = '計算中...';
    }

    const averageScoreDiv = document.createElement('div');
    averageScoreDiv.className = 'text-xs text-gray-600';
    averageScoreDiv.textContent = `${stats.average.toFixed(1)} / 5.0`;

    averageDiv.appendChild(averageLabelDiv);
    averageDiv.appendChild(averageValueDiv);
    averageDiv.appendChild(averageScoreDiv);

    statsContainer.appendChild(gridDiv);
    statsContainer.appendChild(averageDiv);
  }

  // 投稿頻度統計をレンダリング
  private renderPostFrequencyStats() {
    const statsContainer = document.getElementById('post-frequency-stats');
    if (!statsContainer) return;

    statsContainer.textContent = '';

    const stats = this.getPostFrequencyStats();

    // 総投稿数と平均
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';

    const totalPostsDiv = this.createStatCard(
      '📝',
      '総投稿数',
      `${stats.totalPosts}件`
    );
    const avgPerDayDiv = this.createStatCard(
      '📊',
      '1日平均',
      `${stats.averagePerDay.toFixed(1)}件`
    );
    const recentWeekTotal = Object.values(stats.weekly).slice(-1)[0] || 0;
    const recentWeekDiv = this.createStatCard(
      '📅',
      '今週',
      `${recentWeekTotal}件`
    );
    const recentMonthTotal = Object.values(stats.monthly).slice(-1)[0] || 0;
    const recentMonthDiv = this.createStatCard(
      '🗓️',
      '今月',
      `${recentMonthTotal}件`
    );

    summaryDiv.appendChild(totalPostsDiv);
    summaryDiv.appendChild(avgPerDayDiv);
    summaryDiv.appendChild(recentWeekDiv);
    summaryDiv.appendChild(recentMonthDiv);
    statsContainer.appendChild(summaryDiv);

    // 過去7日間のチャート
    const recentDays = Object.entries(stats.daily).slice(-7);
    if (recentDays.length > 0) {
      const chartDiv = document.createElement('div');
      chartDiv.className = 'bg-gray-50 p-4 rounded-lg';

      const chartTitle = document.createElement('h4');
      chartTitle.className = 'text-sm font-medium text-gray-700 mb-3';
      chartTitle.textContent = '過去7日間の投稿数';
      chartDiv.appendChild(chartTitle);

      const barsContainer = document.createElement('div');
      barsContainer.className = 'flex items-end justify-between gap-1 h-24';

      const maxCount = Math.max(...recentDays.map(([_, count]) => count));

      recentDays.forEach(([date, count]) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'flex-1 flex flex-col items-center';

        const bar = document.createElement('div');
        bar.className = 'w-full bg-blue-500 rounded-sm';
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        bar.style.height = `${Math.max(height, 2)}%`;

        const label = document.createElement('span');
        label.className = 'text-xs text-gray-600 mt-1';
        label.textContent = new Date(date).getDate().toString();

        const countLabel = document.createElement('span');
        countLabel.className = 'text-xs text-gray-500';
        countLabel.textContent = count.toString();

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        if (count > 0) barContainer.appendChild(countLabel);

        barsContainer.appendChild(barContainer);
      });

      chartDiv.appendChild(barsContainer);
      statsContainer.appendChild(chartDiv);
    }
  }

  // 文字数トレンドをレンダリング
  private renderCharacterTrends() {
    const statsContainer = document.getElementById('character-trends');
    if (!statsContainer) return;

    statsContainer.textContent = '';

    const trends = this.getCharacterTrends();

    if (trends.totalEntries === 0) {
      const noDataP = document.createElement('p');
      noDataP.className = 'text-gray-500 text-center';
      noDataP.textContent = 'まだエントリがありません';
      statsContainer.appendChild(noDataP);
      return;
    }

    // 文字数統計サマリー
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';

    const avgDiv = this.createStatCard(
      '📊',
      '平均文字数',
      `${trends.averageCharCount}文字`
    );
    const maxDiv = this.createStatCard(
      '📈',
      '最大文字数',
      `${trends.maxCharCount}文字`
    );
    const minDiv = this.createStatCard(
      '📉',
      '最小文字数',
      `${trends.minCharCount}文字`
    );
    const recentDiv = this.createStatCard(
      '📅',
      '最近7日平均',
      `${trends.recentAverage}文字`
    );

    summaryDiv.appendChild(avgDiv);
    summaryDiv.appendChild(maxDiv);
    summaryDiv.appendChild(minDiv);
    summaryDiv.appendChild(recentDiv);
    statsContainer.appendChild(summaryDiv);

    // 最近の投稿トレンド
    const recentTrends = trends.trends.slice(-10);
    if (recentTrends.length > 0) {
      const trendDiv = document.createElement('div');
      trendDiv.className = 'bg-gray-50 p-4 rounded-lg';

      const trendTitle = document.createElement('h4');
      trendTitle.className = 'text-sm font-medium text-gray-700 mb-3';
      trendTitle.textContent = '最近の文字数推移';
      trendDiv.appendChild(trendTitle);

      const trendsContainer = document.createElement('div');
      trendsContainer.className = 'space-y-2';

      recentTrends.forEach(trend => {
        const trendItem = document.createElement('div');
        trendItem.className = 'flex justify-between items-center text-sm';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'text-gray-600';

        // 日本語日付の処理
        let displayDate: string;
        try {
          let date: Date;
          if (
            trend.date.includes('年') &&
            trend.date.includes('月') &&
            trend.date.includes('日')
          ) {
            date = this.parseJapaneseDate(trend.date);
            displayDate = date.toLocaleDateString('ja-JP');
          } else {
            date = new Date(trend.date);
            displayDate = date.toLocaleDateString('ja-JP');
          }
        } catch {
          displayDate = trend.date; // フォールバック：元の文字列をそのまま表示
        }

        dateDiv.textContent = displayDate;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'flex-1 mx-3 truncate';
        titleDiv.textContent = trend.title || '無題';

        const countDiv = document.createElement('div');
        countDiv.className = 'font-medium';
        countDiv.textContent = `${trend.count}文字`;

        trendItem.appendChild(dateDiv);
        trendItem.appendChild(titleDiv);
        trendItem.appendChild(countDiv);
        trendsContainer.appendChild(trendItem);
      });

      trendDiv.appendChild(trendsContainer);
      statsContainer.appendChild(trendDiv);
    }
  }

  // 継続日数統計をレンダリング
  private renderContinuousStats() {
    const statsContainer = document.getElementById('continuous-stats');
    if (!statsContainer) return;

    statsContainer.textContent = '';

    const stats = this.getContinuousDaysStats();

    // 継続統計サマリー
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';

    const currentStreakDiv = this.createStatCard(
      '🔥',
      '現在の連続日数',
      `${stats.currentStreak}日`,
      stats.currentStreak > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
    );
    const maxStreakDiv = this.createStatCard(
      '🏆',
      '最長連続記録',
      `${stats.maxStreak}日`
    );
    const totalDaysDiv = this.createStatCard(
      '📅',
      '投稿日数',
      `${stats.totalDaysPosted}日`
    );

    const lastPostDiv = this.createStatCard(
      '📝',
      '最終投稿日',
      stats.lastPostDate
        ? new Date(stats.lastPostDate).toLocaleDateString('ja-JP')
        : '未投稿'
    );

    summaryDiv.appendChild(currentStreakDiv);
    summaryDiv.appendChild(maxStreakDiv);
    summaryDiv.appendChild(totalDaysDiv);
    summaryDiv.appendChild(lastPostDiv);
    statsContainer.appendChild(summaryDiv);

    // 連続投稿のモチベーションメッセージ
    const motivationDiv = document.createElement('div');
    motivationDiv.className = 'bg-blue-50 p-4 rounded-lg text-center';

    const motivationText = document.createElement('p');
    motivationText.className = 'text-sm text-blue-800';

    if (stats.currentStreak === 0) {
      motivationText.textContent = '今日から日記を始めてみませんか？ 📝';
    } else if (stats.currentStreak === 1) {
      motivationText.textContent =
        'いいスタートです！明日も続けてみましょう 🌟';
    } else if (stats.currentStreak < 7) {
      motivationText.textContent = `${stats.currentStreak}日連続！いい調子です 🎉`;
    } else if (stats.currentStreak < 30) {
      motivationText.textContent = `${stats.currentStreak}日連続！素晴らしい習慣です 🔥`;
    } else {
      motivationText.textContent = `${stats.currentStreak}日連続！驚異的な継続力です！ 🏆`;
    }

    motivationDiv.appendChild(motivationText);
    statsContainer.appendChild(motivationDiv);
  }

  // 統計カードを作成するヘルパーメソッド
  private createStatCard(
    icon: string,
    label: string,
    value: string,
    additionalClasses: string = ''
  ) {
    const card = document.createElement('div');
    card.className = `text-center p-4 bg-white border rounded-lg ${additionalClasses}`;

    const iconDiv = document.createElement('div');
    iconDiv.className = 'text-2xl mb-2';
    iconDiv.textContent = icon;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'text-sm text-gray-600 mb-1';
    labelDiv.textContent = label;

    const valueDiv = document.createElement('div');
    valueDiv.className = 'text-lg font-semibold';
    valueDiv.textContent = value;

    card.appendChild(iconDiv);
    card.appendChild(labelDiv);
    card.appendChild(valueDiv);

    return card;
  }

  private getMoodChartData(period: 'month' | 'year') {
    const now = new Date();
    const chartData: { [key: string]: number[] } = {};

    this.entries.forEach(entry => {
      if (!entry.mood) return;

      const entryDate = this.parseJapaneseDate(entry.date);
      let key: string;

      if (period === 'month') {
        if (
          entryDate.getFullYear() === now.getFullYear() &&
          entryDate.getMonth() === now.getMonth()
        ) {
          key = entryDate.getDate().toString();
        } else {
          return;
        }
      } else {
        if (entryDate.getFullYear() === now.getFullYear()) {
          key = (entryDate.getMonth() + 1).toString();
        } else {
          return;
        }
      }

      if (!chartData[key]) {
        chartData[key] = [];
      }
      chartData[key].push(entry.mood);
    });

    return Object.entries(chartData)
      .map(([key, moods]) => ({
        label: period === 'month' ? `${key}日` : `${key}月`,
        average: moods.reduce((sum, mood) => sum + mood, 0) / moods.length,
        count: moods.length,
      }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }

  private renderMoodChart() {
    const chartContainer = document.getElementById('mood-chart');
    if (!chartContainer) return;

    // 既存のコンテンツをクリア
    chartContainer.textContent = '';

    const monthData = this.getMoodChartData('month');
    const yearData = this.getMoodChartData('year');

    // メインコンテナを作成
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mb-4';

    // ボタンコンテナを作成
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex gap-2 mb-4';

    const monthButton = document.createElement('button');
    monthButton.id = 'chart-month';
    monthButton.className =
      'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
    monthButton.textContent = '今月';

    const yearButton = document.createElement('button');
    yearButton.id = 'chart-year';
    yearButton.className =
      'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
    yearButton.textContent = '今年';

    buttonDiv.appendChild(monthButton);
    buttonDiv.appendChild(yearButton);

    // チャートコンテンツコンテナを作成
    const chartContent = document.createElement('div');
    chartContent.id = 'chart-content';

    mainDiv.appendChild(buttonDiv);
    mainDiv.appendChild(chartContent);
    chartContainer.appendChild(mainDiv);

    const showChart = (data: any[], type: string) => {
      // 既存のチャートをクリア
      chartContent.textContent = '';

      if (data.length === 0) {
        const noDataP = document.createElement('p');
        noDataP.className = 'text-gray-500 text-center';
        noDataP.textContent = `この${type}の気分データがありません`;
        chartContent.appendChild(noDataP);
        return;
      }

      const maxValue = 5;
      const chartDiv = document.createElement('div');
      chartDiv.className = 'space-y-2';

      data.forEach(item => {
        const percentage = (item.average / maxValue) * 100;
        const moodEmoji =
          this.moodRatings.find(m => Math.round(item.average) === m.value)
            ?.emoji || '😊';

        const rowDiv = document.createElement('div');
        rowDiv.className = 'flex items-center gap-3';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'w-12 text-sm text-gray-600';
        labelDiv.textContent = item.label;

        const barContainerDiv = document.createElement('div');
        barContainerDiv.className =
          'flex-1 bg-gray-200 rounded-full h-6 relative';

        const barDiv = document.createElement('div');
        barDiv.className = 'bg-blue-500 h-6 rounded-full transition-all';
        barDiv.style.width = `${percentage}%`;

        const textDiv = document.createElement('div');
        textDiv.className =
          'absolute inset-0 flex items-center justify-center text-sm';
        textDiv.textContent = `${moodEmoji} ${item.average.toFixed(1)} (${
          item.count
        }回)`;

        barContainerDiv.appendChild(barDiv);
        barContainerDiv.appendChild(textDiv);

        rowDiv.appendChild(labelDiv);
        rowDiv.appendChild(barContainerDiv);
        chartDiv.appendChild(rowDiv);
      });

      chartContent.appendChild(chartDiv);
    };

    monthButton.addEventListener('click', () => {
      monthButton.className =
        'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
      yearButton.className =
        'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
      showChart(monthData, '月');
    });

    yearButton.addEventListener('click', () => {
      yearButton.className =
        'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600';
      monthButton.className =
        'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300';
      showChart(yearData, '年');
    });

    // 初期表示
    showChart(monthData, '月');
  }

  private updateMoodFeatures() {
    this.renderPostFrequencyStats();
    this.renderCharacterTrends();
    this.renderContinuousStats();
    this.renderMoodStats();
    this.renderMoodChart();
  }

  private exportToJSON() {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        entries: this.entries,
        moodStats: this.getMoodStats(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `diary-backup-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('JSONファイルのエクスポートが完了しました');
    } catch (error) {
      console.error('JSONエクスポートエラー:', error);
      alert('JSONエクスポートに失敗しました');
    }
  }

  private async loadPDFTemplate(): Promise<string> {
    try {
      const response = await fetch('/src/pdf-template.html');
      if (!response.ok) {
        throw new Error('PDFテンプレートの読み込みに失敗しました');
      }
      return await response.text();
    } catch (error) {
      console.error('PDFテンプレート読み込みエラー:', error);
      // フォールバック用のシンプルなテンプレート
      return this.getFallbackPDFTemplate();
    }
  }

  private getFallbackPDFTemplate(): string {
    return `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>{{TITLE}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .stats { margin-bottom: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
          .entry { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; page-break-inside: avoid; }
          .entry-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .entry-date { color: #666; font-size: 14px; margin-bottom: 5px; }
          .entry-mood { color: #555; font-size: 14px; margin-bottom: 10px; }
          .entry-content { white-space: pre-wrap; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📝 My Diary</h1>
          <p>エクスポート日: {{EXPORT_DATE}}</p>
        </div>
        <div class="stats">
          <h2>📊 統計情報</h2>
          <p>総エントリー数: {{TOTAL_ENTRIES}}件</p>
          <p>気分データ: {{MOOD_ENTRIES}}件</p>
          <p>平均気分: {{AVERAGE_MOOD}}</p>
          {{MOOD_STATS}}
        </div>
        <div class="entries">{{ENTRIES}}</div>
      </body>
      </html>
    `;
  }

  private generateMoodStatsForPDF(stats: any): string {
    if (stats.total === 0) {
      return '<p class="text-gray-500">気分データがありません</p>';
    }

    // PDFテンプレート用のHTMLは維持（印刷のため）
    return this.moodRatings
      .map(mood => {
        const count = stats.counts[mood.value] || 0;
        const percentage =
          stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

        return `
        <div class="stat-item">
          <div class="stat-emoji">${mood.emoji}</div>
          <div class="stat-count">${count}回</div>
          <div class="stat-percentage">${percentage}%</div>
          <div class="text-xs text-gray-600">${mood.label}</div>
        </div>
      `;
      })
      .join('');
  }

  private generateEntriesForPDF(entries: DiaryEntry[]): string {
    // PDFテンプレート用のHTMLは維持（印刷のため）
    return entries
      .map(entry => {
        const moodRating = entry.mood
          ? this.moodRatings.find(m => m.value === entry.mood)
          : null;

        return `
        <div class="entry no-break">
          <div class="entry-title">${this.escapeHtml(entry.title)}</div>
          <div class="entry-date">${entry.date}</div>
          ${
            moodRating
              ? `<div class="entry-mood">気分: ${moodRating.emoji} ${moodRating.label}</div>`
              : ''
          }
          <div class="entry-content">${this.escapeHtml(entry.content)}</div>
        </div>
      `;
      })
      .join('');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async exportToPDF() {
    try {
      const stats = this.getMoodStats();
      const sortedEntries = [...this.entries].sort(
        (a, b) =>
          this.parseJapaneseDate(b.date).getTime() -
          this.parseJapaneseDate(a.date).getTime()
      );

      // テンプレートを読み込み
      const template = await this.loadPDFTemplate();

      // テンプレート変数を置換
      const htmlContent = template
        .replace(/{{TITLE}}/g, '日記エクスポート')
        .replace(/{{EXPORT_DATE}}/g, new Date().toLocaleDateString('ja-JP'))
        .replace(/{{TOTAL_ENTRIES}}/g, this.entries.length.toString())
        .replace(/{{MOOD_ENTRIES}}/g, stats.total.toString())
        .replace(
          /{{AVERAGE_MOOD}}/g,
          stats.total > 0 ? `${stats.average.toFixed(1)} / 5.0` : '未設定'
        )
        .replace(/{{MOOD_STATS}}/g, this.generateMoodStatsForPDF(stats))
        .replace(/{{ENTRIES}}/g, this.generateEntriesForPDF(sortedEntries));

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        alert(
          'ポップアップがブロックされています。ポップアップを許可してください。'
        );
        URL.revokeObjectURL(url);
        return;
      }

      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.addEventListener('afterprint', () => {
            printWindow.close();
            URL.revokeObjectURL(url);
          });
        }, 1000); // テンプレート読み込み時間を考慮して少し長めに
      });
    } catch (error) {
      console.error('PDFエクスポートエラー:', error);
      alert('PDFエクスポートに失敗しました');
    }
  }

  private backupData() {
    try {
      const backupData = {
        version: '1.0',
        backupDate: new Date().toISOString(),
        entries: this.entries,
        settings: {
          lastBackup: new Date().toISOString(),
        },
      };

      localStorage.setItem('diary-backup', JSON.stringify(backupData));
      alert(
        `バックアップが完了しました (${this.entries.length}件のエントリー)`
      );
    } catch (error) {
      console.error('バックアップエラー:', error);
      alert('バックアップに失敗しました');
    }
  }

  private restoreData() {
    try {
      const backupData = localStorage.getItem('diary-backup');
      if (!backupData) {
        alert('バックアップデータが見つかりません');
        return;
      }

      const confirmed = confirm(
        '現在のデータは上書きされます。復元を実行しますか？'
      );
      if (!confirmed) return;

      const parsedData = JSON.parse(backupData);
      if (parsedData.entries && Array.isArray(parsedData.entries)) {
        this.entries = parsedData.entries;
        this.saveEntries();
        this.updateMoodFeatures();
        this.applyFilters();
        alert(`復元が完了しました (${this.entries.length}件のエントリー)`);
      } else {
        alert('バックアップデータの形式が正しくありません');
      }
    } catch (error) {
      console.error('復元エラー:', error);
      alert('復元に失敗しました');
    }
  }

  private importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const importData = JSON.parse(e.target?.result as string);

          if (importData.entries && Array.isArray(importData.entries)) {
            const confirmed = confirm(
              `${importData.entries.length}件のエントリーをインポートします。現在のデータは上書きされます。実行しますか？`
            );

            if (confirmed) {
              this.entries = importData.entries;
              this.saveEntries();
              this.updateMoodFeatures();
              this.applyFilters();
              alert(
                `インポートが完了しました (${this.entries.length}件のエントリー)`
              );
            }
          } else {
            alert('インポートファイルの形式が正しくありません');
          }
        } catch (error) {
          console.error('インポートエラー:', error);
          alert('インポートに失敗しました');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  private syncWithCloud() {
    alert(
      'クラウド同期機能は準備中です。将来的にGoogleDrive、Dropbox等との同期を予定しています。'
    );
  }

  private initializeFileInputs() {
    this.imageInput?.addEventListener('change', e => this.handleImageUpload(e));
    this.fileInput?.addEventListener('change', e => this.handleFileUpload(e));
  }

  private async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} は画像ファイルではありません`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} は5MBを超えています`);
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        this.selectedImages.push(base64);
        this.updateFileDisplay();
      } catch (error) {
        console.error('画像読み込みエラー:', error);
        alert(`${file.name} の読み込みに失敗しました`);
      }
    }
    input.value = '';
  }

  private async handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} は10MBを超えています`);
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        const attachment: FileAttachment = {
          id:
            Date.now().toString() + Math.random().toString(36).substring(2, 11),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        };
        this.selectedAttachments.push(attachment);
        this.updateFileDisplay();
      } catch (error) {
        console.error('ファイル読み込みエラー:', error);
        alert(`${file.name} の読み込みに失敗しました`);
      }
    }
    input.value = '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private updateFileDisplay() {
    this.updateImagePreview();
    this.updateAttachmentList();
  }

  private updateImagePreview() {
    const container = document.getElementById('image-preview');
    if (!container) return;

    container.textContent = '';

    if (this.selectedImages.length === 0) {
      container.className = 'hidden';
      return;
    }

    container.className = 'mt-2 grid grid-cols-2 md:grid-cols-3 gap-2';

    this.selectedImages.forEach((imageData, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'relative group';

      const img = document.createElement('img');
      img.src = imageData;
      img.className = 'w-full h-24 object-cover rounded border';
      img.alt = `画像 ${index + 1}`;

      const removeBtn = document.createElement('button');
      removeBtn.className =
        'absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => this.removeImage(index));

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      container.appendChild(wrapper);
    });
  }

  private updateAttachmentList() {
    const container = document.getElementById('attachment-list');
    if (!container) return;

    container.textContent = '';

    if (this.selectedAttachments.length === 0) {
      container.className = 'hidden';
      return;
    }

    container.className = 'mt-2 space-y-2';

    this.selectedAttachments.forEach((attachment, index) => {
      const div = document.createElement('div');
      div.className =
        'flex items-center justify-between p-2 bg-gray-50 rounded border';

      const info = document.createElement('div');
      info.className = 'flex-1';

      const name = document.createElement('div');
      name.className = 'text-sm font-medium text-gray-700';
      name.textContent = attachment.name;

      const meta = document.createElement('div');
      meta.className = 'text-xs text-gray-500';
      meta.textContent = `${(attachment.size / 1024).toFixed(1)}KB`;

      info.appendChild(name);
      info.appendChild(meta);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'text-red-500 hover:text-red-700 text-sm px-2 py-1';
      removeBtn.textContent = '削除';
      removeBtn.addEventListener('click', () => this.removeAttachment(index));

      div.appendChild(info);
      div.appendChild(removeBtn);
      container.appendChild(div);
    });
  }

  private removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.updateFileDisplay();
  }

  private removeAttachment(index: number) {
    this.selectedAttachments.splice(index, 1);
    this.updateFileDisplay();
  }

  private appendImagesDisplay(container: HTMLElement, images: string[]) {
    const imagesDiv = document.createElement('div');
    imagesDiv.className = 'mt-3';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'text-sm font-medium text-gray-600 mb-2';
    labelDiv.textContent = '📷 画像';

    const imageGrid = document.createElement('div');
    imageGrid.className = 'grid grid-cols-2 md:grid-cols-3 gap-2';

    images.forEach((imageData, index) => {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'relative group cursor-pointer';

      const img = document.createElement('img');
      img.src = imageData;
      img.className =
        'w-full h-24 object-cover rounded border hover:shadow-md transition-shadow';
      img.alt = `画像 ${index + 1}`;
      img.addEventListener('click', () => this.showImageModal(imageData));

      imageWrapper.appendChild(img);
      imageGrid.appendChild(imageWrapper);
    });

    imagesDiv.appendChild(labelDiv);
    imagesDiv.appendChild(imageGrid);
    container.appendChild(imagesDiv);
  }

  private appendAttachmentsDisplay(
    container: HTMLElement,
    attachments: FileAttachment[]
  ) {
    const attachmentsDiv = document.createElement('div');
    attachmentsDiv.className = 'mt-3';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'text-sm font-medium text-gray-600 mb-2';
    labelDiv.textContent = '📎 添付ファイル';

    const attachmentsList = document.createElement('div');
    attachmentsList.className = 'space-y-1';

    attachments.forEach(attachment => {
      const attachmentDiv = document.createElement('div');
      attachmentDiv.className =
        'flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'flex-1';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'text-sm font-medium text-gray-700';
      nameSpan.textContent = attachment.name;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'text-xs text-gray-500 ml-2';
      metaSpan.textContent = `(${(attachment.size / 1024).toFixed(1)}KB)`;

      infoDiv.appendChild(nameSpan);
      infoDiv.appendChild(metaSpan);

      const downloadBtn = document.createElement('button');
      downloadBtn.className =
        'text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded transition-colors';
      downloadBtn.textContent = 'ダウンロード';
      downloadBtn.addEventListener('click', () =>
        this.downloadAttachment(attachment)
      );

      attachmentDiv.appendChild(infoDiv);
      attachmentDiv.appendChild(downloadBtn);
      attachmentsList.appendChild(attachmentDiv);
    });

    attachmentsDiv.appendChild(labelDiv);
    attachmentsDiv.appendChild(attachmentsList);
    container.appendChild(attachmentsDiv);
  }

  private showImageModal(imageData: string) {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';

    const img = document.createElement('img');
    img.src = imageData;
    img.className = 'max-w-full max-h-full object-contain';

    const closeBtn = document.createElement('button');
    closeBtn.className =
      'absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 w-10 h-10 rounded-full hover:bg-opacity-75 transition-all';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => document.body.removeChild(modal));

    modal.addEventListener('click', e => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    modal.appendChild(img);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
  }

  private downloadAttachment(attachment: FileAttachment) {
    try {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('ファイルのダウンロードに失敗しました');
    }
  }

  private initializeExportFeatures() {
    const exportJsonBtn = document.getElementById('export-json');
    const exportPdfBtn = document.getElementById('export-pdf');
    const backupBtn = document.getElementById('backup-data');
    const restoreBtn = document.getElementById('restore-data');
    const importBtn = document.getElementById('import-data');
    const syncBtn = document.getElementById('sync-cloud');

    exportJsonBtn?.addEventListener('click', () => this.exportToJSON());
    exportPdfBtn?.addEventListener('click', () => this.exportToPDF());
    backupBtn?.addEventListener('click', () => this.backupData());
    restoreBtn?.addEventListener('click', () => this.restoreData());
    importBtn?.addEventListener('click', () => this.importFromFile());
    syncBtn?.addEventListener('click', () => this.syncWithCloud());
  }

  // テンプレート機能の実装
  private loadTemplates() {
    const stored = localStorage.getItem('diary-templates');
    if (stored) {
      try {
        const customTemplates = JSON.parse(stored);
        this.templates = [...this.presetTemplates, ...customTemplates];
      } catch (error) {
        console.error('Error parsing templates:', error);
        this.templates = [...this.presetTemplates];
      }
    } else {
      this.templates = [...this.presetTemplates];
    }
  }

  private saveTemplates() {
    const customTemplates = this.templates.filter(t => t.type === 'custom');
    localStorage.setItem('diary-templates', JSON.stringify(customTemplates));
  }

  private initializeTemplateFeatures() {
    this.populateTemplateSelector();

    this.templateSelector?.addEventListener('change', () => {
      this.applyTemplate();
    });

    this.saveTemplateButton?.addEventListener('click', () => {
      this.saveCurrentAsTemplate();
    });

    this.manageTemplatesButton?.addEventListener('click', () => {
      this.openTemplateManager();
    });
  }

  private populateTemplateSelector() {
    if (!this.templateSelector) return;

    // 既存のオプションをクリア（最初のデフォルトオプション以外）
    while (this.templateSelector.children.length > 1) {
      this.templateSelector.removeChild(this.templateSelector.lastChild!);
    }

    // プリセットテンプレート
    const presetGroup = document.createElement('optgroup');
    presetGroup.label = 'プリセット';

    this.templates
      .filter(t => t.type === 'preset')
      .forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        presetGroup.appendChild(option);
      });

    this.templateSelector.appendChild(presetGroup);

    // カスタムテンプレート
    const customTemplates = this.templates.filter(t => t.type === 'custom');
    if (customTemplates.length > 0) {
      const customGroup = document.createElement('optgroup');
      customGroup.label = 'カスタム';

      customTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        customGroup.appendChild(option);
      });

      this.templateSelector.appendChild(customGroup);
    }
  }

  private applyTemplate() {
    const selectedId = this.templateSelector?.value;
    if (!selectedId) return;

    const template = this.templates.find(t => t.id === selectedId);
    if (!template) return;

    // 現在の内容があるかチェック
    const hasContent =
      this.titleInput.value.trim() || this.contentInput.value.trim();
    if (hasContent) {
      const confirmed = confirm('現在の内容が上書きされます。続行しますか？');
      if (!confirmed) {
        this.templateSelector.value = '';
        return;
      }
    }

    // テンプレートを適用
    let title = template.title;
    let content = template.content;

    // 動的変数を置換
    const now = new Date();
    const dateStr = now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    title = title.replace('{{DATE}}', dateStr);
    content = content.replace('{{DATE}}', dateStr);

    this.titleInput.value = title;
    this.contentInput.value = content;

    // フォーカスを内容エリアに移動
    this.contentInput.focus();
    this.contentInput.setSelectionRange(
      this.contentInput.value.length,
      this.contentInput.value.length
    );
  }

  private saveCurrentAsTemplate() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value.trim();

    if (!title || !content) {
      alert('タイトルと内容を入力してからテンプレートとして保存してください。');
      return;
    }

    const templateName = prompt('テンプレート名を入力してください:', title);
    if (!templateName) return;

    // 同名のテンプレートが既に存在するかチェック
    const existingTemplate = this.templates.find(
      t => t.name === templateName && t.type === 'custom'
    );
    if (existingTemplate) {
      const confirmed = confirm(
        '同名のテンプレートが既に存在します。上書きしますか？'
      );
      if (!confirmed) return;

      // 既存のテンプレートを更新
      existingTemplate.title = title;
      existingTemplate.content = content;
      existingTemplate.createdAt = new Date().toISOString();
    } else {
      // 新しいテンプレートを作成
      const newTemplate: DiaryTemplate = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        name: templateName,
        title: title,
        content: content,
        type: 'custom',
        createdAt: new Date().toISOString(),
      };
      this.templates.push(newTemplate);
    }

    this.saveTemplates();
    this.populateTemplateSelector();
    alert('テンプレートを保存しました。');
  }

  private openTemplateManager() {
    this.showTemplateManagerModal();
  }

  private showTemplateManagerModal() {
    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    const modalContent = document.createElement('div');
    modalContent.className =
      'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden';

    const header = document.createElement('div');
    header.className = 'p-6 border-b border-gray-200';

    const headerTitle = document.createElement('h2');
    headerTitle.className = 'text-xl font-semibold text-gray-800';
    headerTitle.textContent = 'テンプレート管理';

    const closeBtn = document.createElement('button');
    closeBtn.className =
      'float-right text-gray-500 hover:text-gray-700 text-2xl leading-none';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => document.body.removeChild(modal));

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'p-6 overflow-y-auto max-h-[60vh]';

    const customTemplates = this.templates.filter(t => t.type === 'custom');

    if (customTemplates.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'text-gray-500 text-center py-8';
      emptyMsg.textContent = 'カスタムテンプレートはまだありません。';
      body.appendChild(emptyMsg);
    } else {
      customTemplates.forEach(template => {
        const templateDiv = document.createElement('div');
        templateDiv.className = 'border border-gray-200 rounded-lg p-4 mb-4';

        const templateHeader = document.createElement('div');
        templateHeader.className = 'flex justify-between items-start mb-2';

        const templateName = document.createElement('h3');
        templateName.className = 'font-medium text-gray-800';
        templateName.textContent = template.name;

        const templateActions = document.createElement('div');
        templateActions.className = 'flex gap-2';

        const editBtn = document.createElement('button');
        editBtn.className =
          'text-blue-500 hover:text-blue-700 text-sm px-2 py-1';
        editBtn.textContent = '編集';
        editBtn.addEventListener('click', () =>
          this.editTemplate(template.id, modal)
        );

        const deleteBtn = document.createElement('button');
        deleteBtn.className =
          'text-red-500 hover:text-red-700 text-sm px-2 py-1';
        deleteBtn.textContent = '削除';
        deleteBtn.addEventListener('click', () =>
          this.deleteTemplate(template.id, modal)
        );

        templateActions.appendChild(editBtn);
        templateActions.appendChild(deleteBtn);

        templateHeader.appendChild(templateName);
        templateHeader.appendChild(templateActions);

        const templatePreview = document.createElement('div');
        templatePreview.className = 'text-sm text-gray-600';

        const titlePreview = document.createElement('div');
        titlePreview.className = 'font-medium mb-1';
        titlePreview.textContent = `タイトル: ${template.title}`;

        const contentPreview = document.createElement('div');
        contentPreview.className = 'whitespace-pre-wrap';
        contentPreview.textContent =
          template.content.length > 100
            ? template.content.substring(0, 100) + '...'
            : template.content;

        templatePreview.appendChild(titlePreview);
        templatePreview.appendChild(contentPreview);

        templateDiv.appendChild(templateHeader);
        templateDiv.appendChild(templatePreview);
        body.appendChild(templateDiv);
      });
    }

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);

    // モーダル外クリックで閉じる
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }

  private editTemplate(templateId: string, parentModal: HTMLElement) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template || template.type !== 'custom') return;

    document.body.removeChild(parentModal);

    const modal = document.createElement('div');
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl max-w-2xl w-full';

    const header = document.createElement('div');
    header.className = 'p-6 border-b border-gray-200';

    const headerTitle = document.createElement('h2');
    headerTitle.className = 'text-xl font-semibold text-gray-800';
    headerTitle.textContent = 'テンプレート編集';

    header.appendChild(headerTitle);

    const body = document.createElement('div');
    body.className = 'p-6';

    const form = document.createElement('div');
    form.className = 'space-y-4';

    // テンプレート名入力
    const nameDiv = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    nameLabel.textContent = 'テンプレート名';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className =
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    nameInput.value = template.name;

    nameDiv.appendChild(nameLabel);
    nameDiv.appendChild(nameInput);

    // タイトル入力
    const titleDiv = document.createElement('div');
    const titleLabel = document.createElement('label');
    titleLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    titleLabel.textContent = 'タイトル';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className =
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    titleInput.value = template.title;

    titleDiv.appendChild(titleLabel);
    titleDiv.appendChild(titleInput);

    // 内容入力
    const contentDiv = document.createElement('div');
    const contentLabel = document.createElement('label');
    contentLabel.className = 'block text-sm font-medium text-gray-700 mb-1';
    contentLabel.textContent = '内容';

    const contentTextarea = document.createElement('textarea');
    contentTextarea.rows = 8;
    contentTextarea.className =
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none';
    contentTextarea.value = template.content;

    contentDiv.appendChild(contentLabel);
    contentDiv.appendChild(contentTextarea);

    form.appendChild(nameDiv);
    form.appendChild(titleDiv);
    form.appendChild(contentDiv);

    // ボタン
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'flex justify-end gap-2 mt-6';

    const cancelBtn = document.createElement('button');
    cancelBtn.className =
      'px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.openTemplateManager();
    });

    const saveBtn = document.createElement('button');
    saveBtn.className =
      'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => {
      const newName = nameInput.value.trim();
      const newTitle = titleInput.value.trim();
      const newContent = contentTextarea.value.trim();

      if (!newName || !newTitle || !newContent) {
        alert('すべての項目を入力してください。');
        return;
      }

      // 同名チェック（自分以外で）
      const existingTemplate = this.templates.find(
        t => t.name === newName && t.id !== templateId && t.type === 'custom'
      );
      if (existingTemplate) {
        alert('同名のテンプレートが既に存在します。');
        return;
      }

      template.name = newName;
      template.title = newTitle;
      template.content = newContent;
      template.createdAt = new Date().toISOString();

      this.saveTemplates();
      this.populateTemplateSelector();

      document.body.removeChild(modal);
      this.openTemplateManager();
      alert('テンプレートを更新しました。');
    });

    buttonDiv.appendChild(cancelBtn);
    buttonDiv.appendChild(saveBtn);

    body.appendChild(form);
    body.appendChild(buttonDiv);

    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
  }

  private deleteTemplate(templateId: string, parentModal: HTMLElement) {
    const template = this.templates.find(t => t.id === templateId);
    if (!template || template.type !== 'custom') return;

    const confirmed = confirm(
      `テンプレート「${template.name}」を削除しますか？`
    );
    if (!confirmed) return;

    this.templates = this.templates.filter(t => t.id !== templateId);
    this.saveTemplates();
    this.populateTemplateSelector();

    document.body.removeChild(parentModal);
    this.openTemplateManager();
    alert('テンプレートを削除しました。');
  }
}

new DiaryApp();
