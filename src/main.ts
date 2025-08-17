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
    this.initializeExportFeatures();
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
}

new DiaryApp();
