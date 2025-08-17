import './style.css';

interface MoodRating {
  value: number;
  emoji: string;
  label: string;
}

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: number;
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

  private readonly moodRatings: MoodRating[] = [
    { value: 1, emoji: '😢', label: 'とても悲しい' },
    { value: 2, emoji: '😐', label: '悲しい' },
    { value: 3, emoji: '😊', label: '普通' },
    { value: 4, emoji: '😄', label: '嬉しい' },
    { value: 5, emoji: '😍', label: 'とても嬉しい' },
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

    this.loadEntries();
    this.bindEvents();
    this.initializeMoodSelector();
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
      this.updateMoodSelection();
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
    this.updateMoodSelection();
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

      const moodP = document.createElement('p');
      moodP.className = 'text-sm mb-2';
      if (entry.mood) {
        const moodRating = this.moodRatings.find(m => m.value === entry.mood);
        if (moodRating) {
          moodP.innerHTML = `気分: <span class="text-lg">${moodRating.emoji}</span> ${moodRating.label}`;
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
      button.innerHTML = `
        <div class="text-2xl mb-1">${mood.emoji}</div>
        <div class="text-xs">${mood.label}</div>
      `;
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

  private renderMoodStats() {
    const statsContainer = document.getElementById('mood-stats');
    if (!statsContainer) return;

    const stats = this.getMoodStats();

    if (stats.total === 0) {
      statsContainer.innerHTML =
        '<p class="text-gray-500 text-center">まだ気分データがありません</p>';
      return;
    }

    const averageMood = this.moodRatings.find(
      m => Math.round(stats.average) === m.value
    );

    statsContainer.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        ${this.moodRatings
          .map(mood => {
            const count = stats.counts[mood.value] || 0;
            const percentage =
              stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return `
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <div class="text-2xl mb-1">${mood.emoji}</div>
              <div class="text-sm font-semibold">${count}回</div>
              <div class="text-xs text-gray-600">${percentage}%</div>
            </div>
          `;
          })
          .join('')}
      </div>
      <div class="text-center p-3 bg-blue-50 rounded-lg">
        <div class="text-sm text-gray-600">平均気分</div>
        <div class="text-lg">
          ${
            averageMood
              ? `${averageMood.emoji} ${averageMood.label}`
              : '計算中...'
          }
        </div>
        <div class="text-xs text-gray-600">${stats.average.toFixed(
          1
        )} / 5.0</div>
      </div>
    `;
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

    const monthData = this.getMoodChartData('month');
    const yearData = this.getMoodChartData('year');

    chartContainer.innerHTML = `
      <div class="mb-4">
        <div class="flex gap-2 mb-4">
          <button id="chart-month" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">今月</button>
          <button id="chart-year" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">今年</button>
        </div>
        <div id="chart-content"></div>
      </div>
    `;

    const monthButton = document.getElementById(
      'chart-month'
    ) as HTMLButtonElement;
    const yearButton = document.getElementById(
      'chart-year'
    ) as HTMLButtonElement;
    const chartContent = document.getElementById(
      'chart-content'
    ) as HTMLElement;

    const showChart = (data: any[], type: string) => {
      if (data.length === 0) {
        chartContent.innerHTML = `<p class="text-gray-500 text-center">この${type}の気分データがありません</p>`;
        return;
      }

      const maxValue = 5;
      chartContent.innerHTML = `
        <div class="space-y-2">
          ${data
            .map(item => {
              const percentage = (item.average / maxValue) * 100;
              const moodEmoji =
                this.moodRatings.find(m => Math.round(item.average) === m.value)
                  ?.emoji || '😊';
              return `
              <div class="flex items-center gap-3">
                <div class="w-12 text-sm text-gray-600">${item.label}</div>
                <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div class="bg-blue-500 h-6 rounded-full transition-all" style="width: ${percentage}%"></div>
                  <div class="absolute inset-0 flex items-center justify-center text-sm">
                    ${moodEmoji} ${item.average.toFixed(1)} (${item.count}回)
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `;
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

    showChart(monthData, '月');
  }

  private updateMoodFeatures() {
    this.renderMoodStats();
    this.renderMoodChart();
  }
}

new DiaryApp();
