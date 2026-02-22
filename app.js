// =============================================
// 町内会計管理アプリ - メインロジック
// Phase 1: 基本構造・タブ切り替え
// Phase 2: 収支入力フォーム
// Phase 3: LocalStorage保存・一覧表示・残高計算
// =============================================

// =============================================
// カテゴリデータ（収入・支出の選択肢）
// =============================================

// 収入カテゴリの一覧
const INCOME_CATEGORIES = ["町内会費", "補助金", "繰越金", "その他収入"];

// 支出カテゴリの一覧
const EXPENSE_CATEGORIES = ["行事費", "消耗品費", "通信費", "慶弔費", "その他支出"];

// =============================================
// ページが完全に読み込まれてからJavaScriptを実行する
// （HTMLより先にJSが動くとエラーになるため、これが定番の書き方）
// =============================================
document.addEventListener("DOMContentLoaded", function () {

  // アプリの初期化処理を呼び出す
  init();

});

// =============================================
// 初期化：アプリ起動時に最初に実行される処理
// =============================================
function init() {

  // タブ切り替えの機能をセットアップする
  setupTabs();

  // カテゴリの選択肢を初期表示する（初期は「収入」を選択中）
  updateCategory("income");

  // 種別ラジオボタンが変わったときにカテゴリを更新する
  setupTypeChange();

  // フォームの送信処理をセットアップする
  setupForm();

  // 今日の日付を日付入力欄の初期値にセットする
  setTodayDate();

  // 一覧タブの表示を更新する（保存済みデータを読み込む）
  renderList();
  calcBalance();

  // コンソールにメッセージを表示して起動確認する
  // （ブラウザのF12開発者ツール > コンソールで確認できる）
  console.log("✅ 町内会計管理アプリ 起動完了");

}

// =============================================
// タブ切り替え：ボタンをクリックしたとき
// 対応するコンテンツだけを表示する
// =============================================
function setupTabs() {

  // ナビゲーションのすべてのタブボタンを取得する
  // querySelectorAll は条件に合う要素を「全部まとめて」取得する
  const tabButtons = document.querySelectorAll(".nav__btn");

  // 各タブボタンにクリック時の動作を登録する
  // forEach はリストの要素を1つずつ処理する
  tabButtons.forEach(function (button) {

    // このボタンがクリックされたときの処理を登録する
    button.addEventListener("click", function () {

      // クリックされたボタンの「data-tab」属性の値を取得する
      // 例：<button data-tab="input"> → "input" が取得できる
      const targetTab = button.dataset.tab;

      // タブの表示を切り替える
      switchTab(targetTab);

    });

  });

}

// =============================================
// タブ表示の切り替え処理
// 引数 tabName：表示したいタブの名前（例："input"）
// =============================================
function switchTab(tabName) {

  // ---- ① すべてのタブボタンから「選択中」のスタイルを外す ----
  const allButtons = document.querySelectorAll(".nav__btn");
  allButtons.forEach(function (btn) {
    // "nav__btn--active" クラスを削除する（選択中のスタイルを解除）
    btn.classList.remove("nav__btn--active");
  });

  // ---- ② すべてのタブコンテンツを非表示にする ----
  const allContents = document.querySelectorAll(".tab-content");
  allContents.forEach(function (content) {
    // "tab-content--active" クラスを削除する（非表示にする）
    content.classList.remove("tab-content--active");
  });

  // ---- ③ クリックされたタブのボタンを「選択中」にする ----
  // data-tab の値が tabName と一致するボタンを1つ取得する
  const activeButton = document.querySelector(
    ".nav__btn[data-tab='" + tabName + "']"
  );
  if (activeButton) {
    // "nav__btn--active" クラスを追加して選択中スタイルを適用する
    activeButton.classList.add("nav__btn--active");
  }

  // ---- ④ 対応するコンテンツを表示する ----
  // id が "tab-" + tabName の要素を取得する（例："tab-input"）
  const activeContent = document.getElementById("tab-" + tabName);
  if (activeContent) {
    // "tab-content--active" クラスを追加して表示する
    activeContent.classList.add("tab-content--active");
  }

  // 集計タブに切り替わったとき、集計データを最新化する
  if (tabName === "summary") {
    summarize();
  }

  // コンソールにどのタブに切り替わったか記録する（デバッグ用）
  console.log("タブ切り替え：" + tabName);

}

// =============================================
// Phase 2：今日の日付を日付入力欄にセットする
// =============================================
function setTodayDate() {

  // 今日の日付を取得する（例：2025-06-01 の形式）
  // toISOString() は「2025-06-01T00:00:00.000Z」を返すので
  // slice(0, 10) で「2025-06-01」の10文字だけ切り取る
  const today = new Date().toISOString().slice(0, 10);

  // 日付入力欄を取得して今日の日付をセットする
  const dateInput = document.getElementById("input-date");
  dateInput.value = today;

}

// =============================================
// Phase 2：カテゴリの選択肢を更新する
// 引数 type："income"（収入）or "expense"（支出）
// =============================================
function updateCategory(type) {

  // カテゴリのセレクトボックスを取得する
  const categorySelect = document.getElementById("input-category");

  // 今ある選択肢をすべて削除する（毎回リセットする）
  categorySelect.innerHTML = "";

  // 種別に応じてカテゴリ一覧を選ぶ
  // type が "income" なら収入カテゴリ、それ以外なら支出カテゴリ
  const categories = (type === "income") ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // カテゴリ一覧をループして選択肢（<option>）を追加する
  categories.forEach(function (categoryName) {

    // <option> 要素を新しく作る
    const option = document.createElement("option");

    // 選択肢の値と表示テキストをカテゴリ名にする
    option.value = categoryName;
    option.textContent = categoryName;

    // セレクトボックスに選択肢を追加する
    categorySelect.appendChild(option);

  });

}

// =============================================
// Phase 2：種別ラジオボタンの変更を監視する
// 収入↔支出が切り替わったときにカテゴリを更新する
// =============================================
function setupTypeChange() {

  // name="type" のラジオボタンをすべて取得する
  const typeRadios = document.querySelectorAll("input[name='type']");

  // 各ラジオボタンに「値が変わったとき」の処理を登録する
  typeRadios.forEach(function (radio) {

    radio.addEventListener("change", function () {

      // 選択されたラジオボタンの値を取得する（"income" or "expense"）
      const selectedType = radio.value;

      // カテゴリの選択肢を更新する
      updateCategory(selectedType);

      // コンソールに記録する（デバッグ用）
      console.log("種別変更：" + selectedType);

    });

  });

}

// =============================================
// Phase 2：フォームの送信処理をセットアップする
// =============================================
function setupForm() {

  // フォーム要素を取得する
  const form = document.getElementById("transaction-form");

  // フォームが送信されたとき（登録ボタンを押したとき）の処理を登録する
  form.addEventListener("submit", function (event) {

    // ブラウザ標準の送信動作（ページ再読み込み）をキャンセルする
    // これをしないとページがリロードされてしまう
    event.preventDefault();

    // フォームの入力値を収集して登録する
    handleFormSubmit();

  });

}

// =============================================
// Phase 2：フォームの値を収集して登録処理を行う
// =============================================
function handleFormSubmit() {

  // ---- 入力値を取得する ----

  // 日付
  const date = document.getElementById("input-date").value;

  // 種別（選択中のラジオボタンの値を取得する）
  const type = document.querySelector("input[name='type']:checked").value;

  // カテゴリ
  const category = document.getElementById("input-category").value;

  // 金額（文字列で取れるので数値に変換する）
  const amount = Number(document.getElementById("input-amount").value);

  // 摘要（任意なので空でもOK）
  const note = document.getElementById("input-note").value.trim();

  // ---- 入力チェック ----
  if (!date || !category || !amount || amount <= 0) {
    // 必須項目が入力されていない場合はエラーを表示する
    showMessage("入力内容を確認してください。", "error");
    return;
  }

  // ---- データオブジェクトを作る ----
  // CLAUDE.md のデータ仕様に合わせた構造にする
  const transaction = {
    id: generateId(),   // 一意のIDを自動生成する
    date: date,
    type: type,
    category: category,
    amount: amount,
    note: note
  };

  // コンソールにデータを表示する（確認用）
  console.log("登録データ：", transaction);

  // ---- LocalStorage にデータを保存する ----
  saveTransaction(transaction);

  // ---- 一覧と残高を更新する ----
  renderList();
  calcBalance();

  // ---- 成功メッセージを表示する ----
  const typeLabel = (type === "income") ? "収入" : "支出";
  showMessage(
    typeLabel + "「" + category + "」" + amount.toLocaleString() + "円 を登録しました！",
    "success"
  );

  // ---- フォームをリセットする ----
  resetForm();

}

// =============================================
// Phase 2：一意のIDを生成する
// 現在時刻をミリ秒で取得して文字列にする
// 例：「tx_1748732400000」
// =============================================
function generateId() {

  // Date.now() は現在時刻をミリ秒単位の数値で返す
  return "tx_" + Date.now();

}

// =============================================
// Phase 2：メッセージを表示する
// 引数 text：メッセージ本文
// 引数 type："success"（成功）or "error"（エラー）
// =============================================
function showMessage(text, type) {

  // メッセージ表示エリアを取得する
  const messageEl = document.getElementById("form-message");

  // テキストをセットする
  messageEl.textContent = text;

  // 以前のクラスを一度リセットする
  messageEl.className = "form__message";

  // 種別に応じてクラスを追加する（CSSでスタイルを当てる）
  if (type === "success") {
    messageEl.classList.add("form__message--success");
  } else {
    messageEl.classList.add("form__message--error");
  }

  // 3秒後にメッセージを非表示にする
  // setTimeout は「〇秒後に実行する」関数
  setTimeout(function () {
    messageEl.className = "form__message";
    messageEl.textContent = "";
  }, 3000);

}

// =============================================
// Phase 2：フォームをリセットする
// =============================================
function resetForm() {

  // 金額と摘要の入力欄をクリアする
  document.getElementById("input-amount").value = "";
  document.getElementById("input-note").value = "";

  // 種別を「収入」に戻す
  document.querySelector("input[name='type'][value='income']").checked = true;

  // カテゴリも収入用に戻す
  updateCategory("income");

  // 今日の日付にリセットする
  setTodayDate();

}

// =============================================
// Phase 3：LocalStorage のキー名（固定値）
// =============================================

// データを保存するときのキー名
// この名前でブラウザにデータが保存される
const STORAGE_KEY = "chonaikai_transactions";

// =============================================
// Phase 3：全データをLocalStorageから読み込む
// 戻り値：収支データの配列（なければ空配列）
// =============================================
function loadTransactions() {

  // LocalStorage から文字列データを取得する
  // キーが存在しない場合は null が返る
  const raw = localStorage.getItem(STORAGE_KEY);

  // null の場合は空配列を返す
  if (!raw) return [];

  // JSON文字列を JavaScript の配列に変換して返す
  return JSON.parse(raw);

}

// =============================================
// Phase 3：1件のデータをLocalStorageに保存する
// 引数 transaction：登録する収支データ（オブジェクト）
// =============================================
function saveTransaction(transaction) {

  // 既存のデータを全件読み込む
  const transactions = loadTransactions();

  // 新しいデータを配列の末尾に追加する
  transactions.push(transaction);

  // 配列全体をJSON文字列に変換してLocalStorageに保存する
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

  console.log("保存完了。件数：" + transactions.length);

}

// =============================================
// Phase 3：指定したIDのデータをLocalStorageから削除する
// 引数 id：削除するデータのID
// =============================================
function deleteTransaction(id) {

  // 全データを読み込む
  const transactions = loadTransactions();

  // 指定したID以外のデータだけを残す（filterで絞り込む）
  // filter は条件を満たすものだけを新しい配列にして返す
  const filtered = transactions.filter(function (item) {
    return item.id !== id;
  });

  // 削除後のデータをLocalStorageに上書き保存する
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // 一覧と残高を更新する
  renderList();
  calcBalance();

  console.log("削除完了。ID：" + id);

}

// =============================================
// Phase 3：一覧タブに収支データを表示する
// =============================================
function renderList() {

  // tbody（テーブルの本体）を取得する
  const tbody = document.getElementById("transaction-tbody");

  // 「データなし」メッセージ要素を取得する
  const noDataMsg = document.getElementById("no-data-message");

  // 全データを読み込む
  const transactions = loadTransactions();

  // データが0件の場合は「データなし」メッセージを表示して終了する
  if (transactions.length === 0) {
    tbody.innerHTML = "";
    noDataMsg.style.display = "block";
    return;
  }

  // データがある場合は「データなし」メッセージを非表示にする
  noDataMsg.style.display = "none";

  // 日付の新しい順に並び替える（sort で配列を並べ替える）
  const sorted = transactions.slice().sort(function (a, b) {
    // 日付の文字列を比較する（新しい方が先）
    return b.date.localeCompare(a.date);
  });

  // tbody の中身をリセットする
  tbody.innerHTML = "";

  // データを1件ずつ行として追加する
  sorted.forEach(function (item) {

    // <tr>（テーブルの行）要素を作る
    const tr = document.createElement("tr");

    // 金額を「1,000」のようなカンマ区切りに整形する
    const amountFormatted = item.amount.toLocaleString();

    // 種別に応じてバッジとスタイルを決める
    const isIncome = (item.type === "income");
    const badgeClass = isIncome ? "table__badge--income" : "table__badge--expense";
    const badgeText = isIncome ? "収入" : "支出";
    const amountClass = isIncome ? "table__amount--income" : "table__amount--expense";
    const amountSign = isIncome ? "+" : "-";

    // 行のHTMLを作る（各セルの内容を設定する）
    tr.innerHTML =
      "<td>" + item.date + "</td>" +
      "<td><span class='table__badge " + badgeClass + "'>" + badgeText + "</span></td>" +
      "<td>" + item.category + "</td>" +
      "<td class='" + amountClass + "'>" + amountSign + "¥" + amountFormatted + "</td>" +
      "<td>" + (item.note || "—") + "</td>" +
      "<td><button class='table__delete-btn' data-id='" + item.id + "'>削除</button></td>";

    // 行をtbodyに追加する
    tbody.appendChild(tr);

  });

  // 削除ボタンにクリック処理を登録する
  // （行を追加した後に登録する必要がある）
  const deleteButtons = tbody.querySelectorAll(".table__delete-btn");
  deleteButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // ボタンの data-id 属性からIDを取得する
      const id = btn.dataset.id;
      // 削除確認ダイアログを表示する
      if (confirm("このデータを削除しますか？")) {
        deleteTransaction(id);
      }
    });
  });

}

// =============================================
// Phase 3：残高（収入合計・支出合計・差引）を計算して表示する
// =============================================
function calcBalance() {

  // 全データを読み込む
  const transactions = loadTransactions();

  // 収入合計を計算する（type が "income" のものだけを合計）
  // reduce は配列を1つの値にまとめる関数
  const totalIncome = transactions
    .filter(function (item) { return item.type === "income"; })
    .reduce(function (sum, item) { return sum + item.amount; }, 0);

  // 支出合計を計算する（type が "expense" のものだけを合計）
  const totalExpense = transactions
    .filter(function (item) { return item.type === "expense"; })
    .reduce(function (sum, item) { return sum + item.amount; }, 0);

  // 残高（収入合計 − 支出合計）を計算する
  const netBalance = totalIncome - totalExpense;

  // 各要素に金額を表示する（toLocaleString でカンマ区切りにする）
  document.getElementById("total-income").textContent = "¥" + totalIncome.toLocaleString();
  document.getElementById("total-expense").textContent = "¥" + totalExpense.toLocaleString();
  document.getElementById("total-net").textContent = "¥" + netBalance.toLocaleString();

  // 残高がマイナスの場合は赤色にする
  const netEl = document.getElementById("total-net");
  if (netBalance < 0) {
    netEl.classList.add("balance__amount--negative");
  } else {
    netEl.classList.remove("balance__amount--negative");
  }

}

// =============================================
// Phase 4：集計タブの表示を更新するメイン関数
// =============================================
function summarize() {

  // 全データを読み込む
  const transactions = loadTransactions();

  // データなしメッセージと集計コンテンツの要素を取得する
  const noData = document.getElementById("summary-no-data");
  const content = document.getElementById("summary-content");

  // データが0件の場合は「データなし」を表示して終了する
  if (transactions.length === 0) {
    noData.style.display = "block";
    content.style.display = "none";
    return;
  }

  // データがある場合は集計コンテンツを表示する
  noData.style.display = "none";
  content.style.display = "block";

  // 月別集計を表示する
  renderMonthlyTable(transactions);

  // カテゴリ別集計（収入・支出）を表示する
  renderCategoryChart(transactions, "income");
  renderCategoryChart(transactions, "expense");

}

// =============================================
// Phase 4：月別集計テーブルを作る
// 引数 transactions：全収支データの配列
// =============================================
function renderMonthlyTable(transactions) {

  // 月ごとに収入・支出を集計するオブジェクトを作る
  // 例：{ "2025-01": { income: 5000, expense: 3000 }, ... }
  const monthlyMap = {};

  transactions.forEach(function (item) {
    // 日付から「年-月」部分だけを取り出す（例："2025-01"）
    const month = item.date.slice(0, 7);

    // その月のデータがなければ初期化する
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }

    // 種別に応じて収入・支出を加算する
    if (item.type === "income") {
      monthlyMap[month].income += item.amount;
    } else {
      monthlyMap[month].expense += item.amount;
    }
  });

  // 月のキー一覧を新しい順に並べる
  const months = Object.keys(monthlyMap).sort(function (a, b) {
    return b.localeCompare(a);
  });

  // tbodyを取得してリセットする
  const tbody = document.getElementById("monthly-tbody");
  tbody.innerHTML = "";

  // 月ごとに行を作る
  months.forEach(function (month) {
    const income = monthlyMap[month].income;
    const expense = monthlyMap[month].expense;
    const net = income - expense;

    // 収支のスタイルを決める（プラスは緑、マイナスは赤）
    const netClass = net >= 0 ? "monthly-plus" : "monthly-minus";
    const netSign = net >= 0 ? "+" : "";

    // 行を作ってtbodyに追加する
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + month + "</td>" +
      "<td class='table__amount--income'>+¥" + income.toLocaleString() + "</td>" +
      "<td class='table__amount--expense'>-¥" + expense.toLocaleString() + "</td>" +
      "<td class='" + netClass + "'>" + netSign + "¥" + net.toLocaleString() + "</td>";

    tbody.appendChild(tr);
  });

}

// =============================================
// Phase 4：カテゴリ別集計バーチャートを作る
// 引数 transactions：全収支データの配列
// 引数 type："income"（収入）or "expense"（支出）
// =============================================
function renderCategoryChart(transactions, type) {

  // 種別でデータを絞り込む
  const filtered = transactions.filter(function (item) {
    return item.type === type;
  });

  // カテゴリごとに金額を集計するオブジェクトを作る
  const categoryMap = {};
  filtered.forEach(function (item) {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = 0;
    }
    categoryMap[item.category] += item.amount;
  });

  // 金額の多い順に並べる
  const categories = Object.keys(categoryMap).sort(function (a, b) {
    return categoryMap[b] - categoryMap[a];
  });

  // 最大金額（バーの幅100%の基準）を求める
  const maxAmount = categories.length > 0 ? categoryMap[categories[0]] : 1;

  // 表示先のコンテナ要素を取得してリセットする
  const containerId = (type === "income") ? "income-category-chart" : "expense-category-chart";
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // データが0件の場合は「なし」と表示する
  if (categories.length === 0) {
    container.innerHTML = "<p style='color:#999; font-size:0.85rem;'>データなし</p>";
    return;
  }

  // カテゴリごとにバーチャートの行を作る
  categories.forEach(function (category) {
    const amount = categoryMap[category];

    // バーの幅を最大金額に対する割合（%）で計算する
    const barWidth = Math.round((amount / maxAmount) * 100);

    // バーのクラスを種別で決める
    const barClass = (type === "income") ? "chart-row__bar--income" : "chart-row__bar--expense";
    const amountClass = (type === "income") ? "chart-row__amount--income" : "chart-row__amount--expense";

    // 行のHTML要素を作る
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      "<span class='chart-row__label'>" + category + "</span>" +
      "<div class='chart-row__bar-wrap'>" +
        "<div class='chart-row__bar " + barClass + "' style='width:" + barWidth + "%'></div>" +
      "</div>" +
      "<span class='chart-row__amount " + amountClass + "'>¥" + amount.toLocaleString() + "</span>";

    container.appendChild(row);
  });

}

// CSVファイルを出力する関数（Phase 5で実装）
// function exportCSV() { ... }
