// =============================================
// 自治会会計管理アプリ - メインロジック
// Phase 1: 基本構造・タブ切り替え
// Phase 2: 収支入力フォーム
// Phase 3: Supabase保存・一覧表示・残高計算
// Phase 4: 月別・カテゴリ別集計
// Phase 5: CSV出力（総会レポート）
// =============================================

// =============================================
// Supabase 接続設定
// =============================================

// SupabaseプロジェクトのURL
const SUPABASE_URL = "https://vrztvsrmjzgkzhgcnjan.supabase.co";

// Supabaseの公開キー（読み書き用）
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenR2c3Jtanpna3poZ2NuamFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQ4MzIsImV4cCI6MjA4NzI4MDgzMn0.PJ96on_LIvN1mwloJCFWNneQmlaHXwYkVG2lyhigZlE";

// Supabaseクライアントを作る（これでデータベースに接続できる）
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// カテゴリデータ（収入・支出の選択肢）
// =============================================

// 歳入カテゴリの一覧（決算書の歳入の部に準拠）
const INCOME_CATEGORIES = ["前年度繰越金", "自治会費", "助成金", "会費", "資源ごみ回収", "手数料収入", "預金利息", "自治会積立金"];

// 歳出カテゴリの一覧（決算書の歳出の部に準拠）
const EXPENSE_CATEGORIES = ["新年会・慰労会費", "各種会費", "協賛・助成金", "協力金・募金", "営繕・管理費", "慶弔・見舞金", "会議費", "予備・雑費"];

// =============================================
// ページが完全に読み込まれてからJavaScriptを実行する
// =============================================
document.addEventListener("DOMContentLoaded", function () {

  // アプリの初期化処理を呼び出す
  init();

});

// =============================================
// 初期化：アプリ起動時に最初に実行される処理
// =============================================
async function init() {

  // タブ切り替えの機能をセットアップする
  setupTabs();

  // カテゴリの選択肢を初期表示する（初期は「収入」）
  updateCategory("income");

  // 種別ラジオボタンが変わったときにカテゴリを更新する
  setupTypeChange();

  // フォームの送信処理をセットアップする
  setupForm();

  // 今日の日付を日付入力欄にセットする
  setTodayDate();

  // 一覧と残高をSupabaseから読み込んで表示する
  await renderList();
  await calcBalance();

  // 一括削除ボタンをセットアップする
  setupResetBtn();

  console.log("✅ 自治会会計管理アプリ 起動完了（Supabase接続済み）");

}

// =============================================
// タブ切り替え：ボタンをクリックしたとき
// =============================================
function setupTabs() {

  const tabButtons = document.querySelectorAll(".nav__btn");

  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const targetTab = button.dataset.tab;
      switchTab(targetTab);
    });
  });

}

// =============================================
// タブ表示の切り替え処理
// =============================================
async function switchTab(tabName) {

  // ---- ① すべてのボタンから選択中スタイルを外す ----
  const allButtons = document.querySelectorAll(".nav__btn");
  allButtons.forEach(function (btn) {
    btn.classList.remove("nav__btn--active");
  });

  // ---- ② すべてのコンテンツを非表示にする ----
  const allContents = document.querySelectorAll(".tab-content");
  allContents.forEach(function (content) {
    content.classList.remove("tab-content--active");
  });

  // ---- ③ クリックされたボタンを選択中にする ----
  const activeButton = document.querySelector(
    ".nav__btn[data-tab='" + tabName + "']"
  );
  if (activeButton) {
    activeButton.classList.add("nav__btn--active");
  }

  // ---- ④ 対応するコンテンツを表示する ----
  const activeContent = document.getElementById("tab-" + tabName);
  if (activeContent) {
    activeContent.classList.add("tab-content--active");
  }

  // 一覧タブに切り替わったとき最新データを表示する
  if (tabName === "list") {
    await renderList();
    await calcBalance();
  }

  // 集計タブに切り替わったとき集計データを表示する
  if (tabName === "summary") {
    await summarize();
  }

  // CSV出力タブに切り替わったとき月選択肢を更新する
  if (tabName === "export") {
    await setupExportTab();
  }

  console.log("タブ切り替え：" + tabName);

}

// =============================================
// Phase 2：今日の日付を日付入力欄にセットする
// =============================================
function setTodayDate() {

  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById("input-date");
  dateInput.value = today;

}

// =============================================
// Phase 2：カテゴリの選択肢を更新する
// =============================================
function updateCategory(type) {

  const categorySelect = document.getElementById("input-category");
  categorySelect.innerHTML = "";

  const categories = (type === "income") ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  categories.forEach(function (categoryName) {
    const option = document.createElement("option");
    option.value = categoryName;
    option.textContent = categoryName;
    categorySelect.appendChild(option);
  });

}

// =============================================
// Phase 2：種別ラジオボタンの変更を監視する
// =============================================
function setupTypeChange() {

  const typeRadios = document.querySelectorAll("input[name='type']");

  typeRadios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      const selectedType = radio.value;
      updateCategory(selectedType);
      console.log("種別変更：" + selectedType);
    });
  });

}

// =============================================
// Phase 2：フォームの送信処理をセットアップする
// =============================================
function setupForm() {

  const form = document.getElementById("transaction-form");

  form.addEventListener("submit", function (event) {
    // ブラウザ標準の送信（ページリロード）をキャンセルする
    event.preventDefault();
    handleFormSubmit();
  });

}

// =============================================
// Phase 2：フォームの値を収集して登録する
// =============================================
async function handleFormSubmit() {

  // 入力値を取得する
  const date = document.getElementById("input-date").value;
  const type = document.querySelector("input[name='type']:checked").value;
  const category = document.getElementById("input-category").value;
  const amount = Number(document.getElementById("input-amount").value);
  const note = document.getElementById("input-note").value.trim();

  // 入力チェック
  if (!date || !category || !amount || amount <= 0) {
    showMessage("入力内容を確認してください。", "error");
    return;
  }

  // データオブジェクトを作る
  const transaction = {
    id: generateId(),
    date: date,
    type: type,
    category: category,
    amount: amount,
    note: note
  };

  // Supabaseに保存する
  const success = await saveTransaction(transaction);

  if (success) {
    // 一覧と残高を更新する
    await renderList();
    await calcBalance();

    // 成功メッセージを表示する
    const typeLabel = (type === "income") ? "歳入" : "歳出";
    showMessage(
      typeLabel + "「" + category + "」" + amount.toLocaleString() + "円 を登録しました！",
      "success"
    );

    // フォームをリセットする
    resetForm();
  } else {
    showMessage("保存に失敗しました。通信状態を確認してください。", "error");
  }

}

// =============================================
// Phase 2：一意のIDを生成する
// =============================================
function generateId() {
  return "tx_" + Date.now();
}

// =============================================
// Phase 2：メッセージを表示する
// =============================================
function showMessage(text, type) {

  const messageEl = document.getElementById("form-message");
  messageEl.textContent = text;
  messageEl.className = "form__message";

  if (type === "success") {
    messageEl.classList.add("form__message--success");
  } else {
    messageEl.classList.add("form__message--error");
  }

  // 3秒後に非表示にする
  setTimeout(function () {
    messageEl.className = "form__message";
    messageEl.textContent = "";
  }, 3000);

}

// =============================================
// Phase 2：フォームをリセットする
// =============================================
function resetForm() {

  document.getElementById("input-amount").value = "";
  document.getElementById("input-note").value = "";
  document.querySelector("input[name='type'][value='income']").checked = true;
  updateCategory("income");
  setTodayDate();

}

// =============================================
// Phase 3：全データをSupabaseから読み込む
// 戻り値：収支データの配列（エラー時は空配列）
// =============================================
async function loadTransactions() {

  // Supabaseのtransactionsテーブルから全件取得する
  // .select('*') は全列を取得する
  // .order('date', { ascending: false }) は日付の新しい順に並べる
  const { data, error } = await db
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  // エラーが発生した場合はコンソールに表示して空配列を返す
  if (error) {
    console.error("データ読み込みエラー：", error.message);
    return [];
  }

  // 取得したデータ配列を返す
  return data;

}

// =============================================
// Phase 3：1件のデータをSupabaseに保存する
// 引数 transaction：登録する収支データ
// 戻り値：成功ならtrue、失敗ならfalse
// =============================================
async function saveTransaction(transaction) {

  // Supabaseのtransactionsテーブルに1件追加する
  const { error } = await db
    .from("transactions")
    .insert(transaction);

  if (error) {
    console.error("保存エラー：", error.message);
    return false;
  }

  console.log("保存完了：", transaction.id);
  return true;

}

// =============================================
// Phase 3：指定したIDのデータをSupabaseから削除する
// 引数 id：削除するデータのID
// =============================================
async function deleteTransaction(id) {

  // Supabaseのtransactionsテーブルから指定IDのデータを削除する
  // .eq('id', id) は「idが一致するもの」という条件
  const { error } = await db
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("削除エラー：", error.message);
    return;
  }

  // 一覧と残高を更新する
  await renderList();
  await calcBalance();

  console.log("削除完了：", id);

}

// =============================================
// Phase 3：一覧タブに収支データを月別アコーディオンで表示する
// =============================================
async function renderList() {

  const container = document.getElementById("transaction-accordion");
  const noDataMsg = document.getElementById("no-data-message");

  // Supabaseから全データを取得する
  const transactions = await loadTransactions();

  container.innerHTML = "";

  if (transactions.length === 0) {
    noDataMsg.style.display = "block";
    return;
  }

  noDataMsg.style.display = "none";

  // データを月ごとにグループ化する
  const monthlyMap = {};
  transactions.forEach(function (item) {
    const month = item.date.slice(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = [];
    }
    monthlyMap[month].push(item);
  });

  // データから年を取得して1月〜12月の全月リストを作る
  const years = Array.from(new Set(
    Object.keys(monthlyMap).map(function (m) { return m.slice(0, 4); })
  )).sort();

  const months = [];
  years.forEach(function (year) {
    for (var m = 1; m <= 12; m++) {
      months.push(year + "-" + (m < 10 ? "0" + m : "" + m));
    }
  });

  // 月ごとにアコーディオンブロックを作る
  months.forEach(function (month) {
    const items = monthlyMap[month] || [];

    const block = document.createElement("div");
    block.className = "month-block";

    // ヘッダーボタン（月名と件数を表示）
    const btn = document.createElement("button");
    btn.className = "month-block__btn";
    btn.innerHTML =
      "<span class='month-block__name'>" + month + "（" + items.length + "件）</span>" +
      "<span class='month-block__arrow'>▼</span>";

    // 詳細エリア（その月のデータテーブル・初期は非表示）
    const detail = document.createElement("div");
    detail.className = "month-block__detail";
    detail.style.display = "none";

    // テーブルを作る
    const tableWrap = document.createElement("div");
    tableWrap.className = "table-wrap";

    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML =
      "<thead><tr>" +
        "<th>日付</th>" +
        "<th>種別</th>" +
        "<th>項目</th>" +
        "<th>金額</th>" +
        "<th>摘要</th>" +
        "<th>削除</th>" +
      "</tr></thead>";

    const tbody = document.createElement("tbody");

    // その月のデータを日付の古い順に並べて行を追加する
    items.slice().sort(function (a, b) {
      return a.date.localeCompare(b.date);
    }).forEach(function (item) {

      const tr = document.createElement("tr");
      const isIncome = (item.type === "income");
      const badgeClass = isIncome ? "table__badge--income" : "table__badge--expense";
      const badgeText = isIncome ? "歳入" : "歳出";
      const amountClass = isIncome ? "table__amount--income" : "table__amount--expense";
      const amountSign = isIncome ? "+" : "-";

      tr.innerHTML =
        "<td>" + item.date + "</td>" +
        "<td><span class='table__badge " + badgeClass + "'>" + badgeText + "</span></td>" +
        "<td>" + item.category + "</td>" +
        "<td class='" + amountClass + "'>" + amountSign + "¥" + item.amount.toLocaleString() + "</td>" +
        "<td>" + (item.note || "—") + "</td>" +
        "<td><button class='table__delete-btn' data-id='" + item.id + "'>削除</button></td>";

      tbody.appendChild(tr);
    });

    // 削除ボタンにクリック処理を登録する
    tbody.querySelectorAll(".table__delete-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const id = btn.dataset.id;
        if (confirm("このデータを削除しますか？")) {
          await deleteTransaction(id);
        }
      });
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    detail.appendChild(tableWrap);

    // タップで開閉する
    btn.addEventListener("click", function () {
      const isOpen = detail.style.display !== "none";
      detail.style.display = isOpen ? "none" : "block";
      btn.querySelector(".month-block__arrow").textContent = isOpen ? "▼" : "▲";
    });

    block.appendChild(btn);
    block.appendChild(detail);
    container.appendChild(block);
  });

}

// =============================================
// Phase 3：残高を計算して表示する
// =============================================
async function calcBalance() {

  const transactions = await loadTransactions();

  const totalIncome = transactions
    .filter(function (item) { return item.type === "income"; })
    .reduce(function (sum, item) { return sum + item.amount; }, 0);

  const totalExpense = transactions
    .filter(function (item) { return item.type === "expense"; })
    .reduce(function (sum, item) { return sum + item.amount; }, 0);

  const netBalance = totalIncome - totalExpense;

  document.getElementById("total-income").textContent = "¥" + totalIncome.toLocaleString();
  document.getElementById("total-expense").textContent = "¥" + totalExpense.toLocaleString();
  document.getElementById("total-net").textContent = "¥" + netBalance.toLocaleString();

  const netEl = document.getElementById("total-net");
  if (netBalance < 0) {
    netEl.classList.add("balance__amount--negative");
  } else {
    netEl.classList.remove("balance__amount--negative");
  }

}

// =============================================
// Phase 4：集計タブのメイン関数
// =============================================
async function summarize() {

  const transactions = await loadTransactions();

  const noData = document.getElementById("summary-no-data");
  const content = document.getElementById("summary-content");

  if (transactions.length === 0) {
    noData.style.display = "block";
    content.style.display = "none";
    return;
  }

  noData.style.display = "none";
  content.style.display = "block";

  renderMonthlyTable(transactions);
  renderCategoryChart(transactions, "income");
  renderCategoryChart(transactions, "expense");

}

// =============================================
// Phase 4：月別集計アコーディオンを作る（1つにまとめる）
// =============================================
function renderMonthlyTable(transactions) {

  // 月ごとに歳入・歳出を集計する
  const monthlyMap = {};
  transactions.forEach(function (item) {
    const month = item.date.slice(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }
    if (item.type === "income") {
      monthlyMap[month].income += item.amount;
    } else {
      monthlyMap[month].expense += item.amount;
    }
  });

  // データから年を取得して1月〜12月の全月リストを作る
  const years = Array.from(new Set(
    Object.keys(monthlyMap).map(function (m) { return m.slice(0, 4); })
  )).sort();

  const months = [];
  years.forEach(function (year) {
    for (var m = 1; m <= 12; m++) {
      months.push(year + "-" + (m < 10 ? "0" + m : m));
    }
  });

  const container = document.getElementById("monthly-accordion");
  container.innerHTML = "";

  // 外側のアコーディオンブロック（1つだけ）
  const block = document.createElement("div");
  block.className = "month-block";

  // ヘッダーボタン
  const btn = document.createElement("button");
  btn.className = "month-block__btn";
  btn.innerHTML =
    "<span class='month-block__name'>月別集計を表示する</span>" +
    "<span class='month-block__arrow'>▼</span>";

  // 詳細エリア（全月のテーブルを内包する・初期は非表示）
  const detail = document.createElement("div");
  detail.className = "month-block__detail";
  detail.style.display = "none";

  // テーブルを作る
  const table = document.createElement("table");
  table.className = "table";
  table.innerHTML =
    "<thead><tr>" +
      "<th>月</th>" +
      "<th>歳入</th>" +
      "<th>歳出</th>" +
      "<th>収支</th>" +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  // 1月〜12月を順に行を追加する（データがない月は0円）
  months.forEach(function (month) {
    const income = monthlyMap[month] ? monthlyMap[month].income : 0;
    const expense = monthlyMap[month] ? monthlyMap[month].expense : 0;
    const net = income - expense;
    const netClass = net >= 0 ? "monthly-plus" : "monthly-minus";
    const netSign = net >= 0 ? "+" : "";

    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + month + "</td>" +
      "<td class='table__amount--income'>+¥" + income.toLocaleString() + "</td>" +
      "<td class='table__amount--expense'>-¥" + expense.toLocaleString() + "</td>" +
      "<td class='" + netClass + "'>" + netSign + "¥" + net.toLocaleString() + "</td>";

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  detail.appendChild(table);

  // タップで開閉する
  btn.addEventListener("click", function () {
    const isOpen = detail.style.display !== "none";
    detail.style.display = isOpen ? "none" : "block";
    btn.querySelector(".month-block__arrow").textContent = isOpen ? "▼" : "▲";
  });

  block.appendChild(btn);
  block.appendChild(detail);
  container.appendChild(block);

}

// =============================================
// Phase 4：カテゴリ別集計バーチャートを作る
// =============================================
function renderCategoryChart(transactions, type) {

  const filtered = transactions.filter(function (item) {
    return item.type === type;
  });

  // 全項目リストを取得する（データがない項目も含めて常に表示する）
  const allCategories = (type === "income") ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // 全項目を0円で初期化してから、データがある項目に金額を加算する
  const categoryMap = {};
  allCategories.forEach(function (cat) {
    categoryMap[cat] = 0;
  });
  filtered.forEach(function (item) {
    if (categoryMap.hasOwnProperty(item.category)) {
      categoryMap[item.category] += item.amount;
    }
  });

  // 項目はカテゴリ定義の順番通りに表示する
  const categories = allCategories;

  // 最大金額を求める（全項目0円の場合は1にして割り算を防ぐ）
  const maxAmount = Math.max.apply(null, categories.map(function (c) { return categoryMap[c]; }));
  const maxAmountSafe = maxAmount > 0 ? maxAmount : 1;

  const containerId = (type === "income") ? "income-category-chart" : "expense-category-chart";
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  categories.forEach(function (category) {
    const amount = categoryMap[category];
    const barWidth = Math.round((amount / maxAmountSafe) * 100);
    const barClass = (type === "income") ? "chart-row__bar--income" : "chart-row__bar--expense";
    const amountClass = (type === "income") ? "chart-row__amount--income" : "chart-row__amount--expense";

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

// =============================================
// 年度リセット：全件削除ボタンのセットアップ
// =============================================
function setupResetBtn() {

  const btn = document.getElementById("btn-reset-all");

  // ボタンが存在しない場合は何もしない
  if (!btn) return;

  btn.addEventListener("click", async function () {

    // 1段階目の確認ダイアログ
    const first = confirm(
      "すべてのデータを削除して年度リセットします。\n\nこの操作は元に戻せません。\n本当に削除しますか？"
    );
    if (!first) return;

    // 2段階目の確認ダイアログ（最終確認）
    const second = confirm(
      "【最終確認】\n\n登録済みのすべてのデータが完全に削除されます。\n本当によろしいですか？"
    );
    if (!second) return;

    // Supabaseのtransactionsテーブルを全件削除する
    // .neq("id", "") は「idが空文字でないもの」= 全件を意味する
    const { error } = await db
      .from("transactions")
      .delete()
      .neq("id", "");

    if (error) {
      // 削除に失敗した場合はエラーを表示する
      alert("削除に失敗しました。通信状態を確認してください。\n" + error.message);
      return;
    }

    // 削除成功後：画面上の表示をすべてリセットする
    await renderList();
    await calcBalance();

    alert("すべてのデータを削除しました。新しい年度のデータを入力してください。");

  });

}

// =============================================
// Phase 5：CSV出力タブの初期化
// =============================================
async function setupExportTab() {

  const transactions = await loadTransactions();

  const noDataMsg = document.getElementById("export-no-data");
  const exportOptions = document.querySelector(".export-options");

  if (transactions.length === 0) {
    exportOptions.style.display = "none";
    noDataMsg.style.display = "block";
    return;
  }

  exportOptions.style.display = "flex";
  noDataMsg.style.display = "none";

  updateMonthSelect(transactions);

  document.getElementById("btn-export-all").onclick = function () {
    exportCSV(transactions, "全件");
  };

  document.getElementById("btn-export-month").onclick = function () {
    const selectedMonth = document.getElementById("select-export-month").value;
    const filtered = transactions.filter(function (item) {
      return item.date.slice(0, 7) === selectedMonth;
    });
    exportCSV(filtered, selectedMonth);
  };

  // 年度セレクトボックスの選択肢を生成する
  updateYearSelect(transactions);

  // Excelダウンロードボタンのクリック処理を登録する
  document.getElementById("btn-export-excel").onclick = function () {
    const selectedYear = document.getElementById("select-excel-year").value;
    exportExcel(selectedYear, transactions);
  };

}

// =============================================
// Phase 5：月選択セレクトボックスの選択肢を生成する
// =============================================
function updateMonthSelect(transactions) {

  const monthSet = new Set(
    transactions.map(function (item) {
      return item.date.slice(0, 7);
    })
  );

  const months = Array.from(monthSet).sort(function (a, b) {
    return b.localeCompare(a);
  });

  const select = document.getElementById("select-export-month");
  select.innerHTML = "";
  months.forEach(function (month) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    select.appendChild(option);
  });

}

// =============================================
// Phase 5：収支データをCSVファイルとしてダウンロードする
// =============================================
function exportCSV(transactions, label) {

  if (transactions.length === 0) {
    alert("出力するデータがありません。");
    return;
  }

  const header = ["日付", "種別", "カテゴリ", "金額（円）", "摘要"];

  const rows = transactions
    .slice()
    .sort(function (a, b) { return a.date.localeCompare(b.date); })
    .map(function (item) {
      return [
        item.date,
        item.type === "income" ? "歳入" : "歳出",
        item.category,
        item.amount,
        item.note || ""
      ];
    });

  const totalIncome = transactions
    .filter(function (i) { return i.type === "income"; })
    .reduce(function (sum, i) { return sum + i.amount; }, 0);

  const totalExpense = transactions
    .filter(function (i) { return i.type === "expense"; })
    .reduce(function (sum, i) { return sum + i.amount; }, 0);

  rows.push(["", "", "", "", ""]);
  rows.push(["歳入合計", "", "", totalIncome, ""]);
  rows.push(["歳出合計", "", "", totalExpense, ""]);
  rows.push(["残高", "", "", totalIncome - totalExpense, ""]);

  const allRows = [header].concat(rows);
  const csvString = allRows.map(function (row) {
    return row.map(function (cell) {
      const str = String(cell);
      return str.includes(",") ? '"' + str + '"' : str;
    }).join(",");
  }).join("\n");

  // BOM付きUTF-8でExcelの文字化けを防ぐ
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "自治会会計_" + label + ".csv";
  link.click();
  URL.revokeObjectURL(url);

  console.log("CSV出力完了：" + link.download);

}

// =============================================
// Phase 6：年度セレクトボックスの選択肢を生成する
// =============================================
function updateYearSelect(transactions) {

  // データから年を取り出してユニークにする
  const yearSet = new Set(
    transactions.map(function (item) {
      return item.date.slice(0, 4);
    })
  );

  // 降順（新しい年が先頭）に並べる
  const years = Array.from(yearSet).sort(function (a, b) {
    return b.localeCompare(a);
  });

  const select = document.getElementById("select-excel-year");
  select.innerHTML = "";

  // 年度ごとに選択肢を追加する
  years.forEach(function (year) {
    const reiwa = Number(year) - 2018;
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year + "年（令和" + reiwa + "年）";
    select.appendChild(option);
  });

}

// =============================================
// Phase 6：西暦を令和に変換する
// =============================================
function toReiwa(year) {
  return Number(year) - 2018;
}

// =============================================
// Phase 6：ExcelJSでkaikei_format.xlsxを読み込み、
// 罫線・行高さを保持したままデータを書き込んでダウンロードする
// 引数 year：出力対象の年（例："2025"）
// 引数 allTransactions：全データ配列
// =============================================
async function exportExcel(year, allTransactions) {

  // ---- kaikei_format.xlsxをテンプレートとして読み込む ----
  var arrayBuffer;
  try {
    var response = await fetch('./kaikei_format.xlsx');
    if (!response.ok) throw new Error('ステータス ' + response.status);
    arrayBuffer = await response.arrayBuffer();
  } catch (e) {
    alert('テンプレート（kaikei_format.xlsx）の読み込みに失敗しました。\n' + e.message);
    return;
  }

  // ExcelJSでworkbookを開く（罫線・書式を完全保持）
  var workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  var reiwa = toReiwa(year);

  // ---- 対象年のデータを絞り込む ----
  var transactions = allTransactions.filter(function (item) {
    return item.date.startsWith(year);
  });

  if (transactions.length === 0) {
    alert('対象年度のデータがありません。');
    return;
  }

  // =============================================
  // 収支（前期）シート：1〜6月のデータを書き込む
  // テンプレートのR5からデータを入れる（ExcelJSは1-indexed）
  // =============================================
  var wsZenki = workbook.getWorksheet('収支（前期）');
  wsZenki.getCell('A1').value = '令和　' + reiwa + '年　黒鳥三番組収支会計報告書（前期）';

  var zenkiRows = transactions
    .filter(function (item) { return Number(item.date.slice(5, 7)) <= 6; })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })
    .map(function (item) {
      return [
        Number(item.date.slice(5, 7)),                        // 月
        Number(item.date.slice(8, 10)),                       // 日
        item.type === 'income'  ? item.amount : null,         // 歳入（円）
        item.type === 'expense' ? item.amount : null,         // 歳出（円）
        item.note || '',                                      // 摘要
        item.category                                         // 項目
      ];
    });

  excelFillRows(wsZenki, zenkiRows, 5);  // R5（1-indexed）から書き込む

  // =============================================
  // 収支（後期）シート：7〜12月のデータを書き込む
  // =============================================
  var wsKoki = workbook.getWorksheet('収支（後期）');
  wsKoki.getCell('A1').value = '令和　' + reiwa + '年　黒鳥三番組収支会計報告書（後期）';

  var kokiRows = transactions
    .filter(function (item) { return Number(item.date.slice(5, 7)) >= 7; })
    .sort(function (a, b) { return a.date.localeCompare(b.date); })
    .map(function (item) {
      return [
        Number(item.date.slice(5, 7)),
        Number(item.date.slice(8, 10)),
        item.type === 'income'  ? item.amount : null,
        item.type === 'expense' ? item.amount : null,
        item.note || '',
        item.category
      ];
    });

  excelFillRows(wsKoki, kokiRows, 5);

  // =============================================
  // ダウンロードする（FileSaverを使う）
  // =============================================
  var buffer = await workbook.xlsx.writeBuffer();
  var blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, '自治会会計_令和' + reiwa + '年.xlsx');

  console.log('Excel出力完了：自治会会計_令和' + reiwa + '年.xlsx');

}

// =============================================
// Phase 6補助：シートのデータ行にSupabaseデータを書き込む
// テンプレートのデータ行（startRow）のスタイル（罫線・行高さ）を
// 後続の行にコピーして、書式を統一する
// 引数 ws：ExcelJSのワークシートオブジェクト
// 引数 rows：書き込むデータ配列（[月, 日, 歳入, 歳出, 摘要, 項目]）
// 引数 startRow：書き込み開始行（1-indexed）
// =============================================
function excelFillRows(ws, rows, startRow) {

  // テンプレートのデータ行（startRow = R5）の情報を取得する
  var templateRow = ws.getRow(startRow);

  for (var i = 0; i < rows.length; i++) {
    var rowNum = startRow + i;
    var row = rows[i];
    var excelRow = ws.getRow(rowNum);

    // startRow より後の行は、テンプレート行のスタイルをコピーする
    if (i > 0) {
      // テンプレート行と同じ高さに設定する
      excelRow.height = templateRow.height;

      // テンプレート行の各セル（A〜F列）のスタイルをコピーする
      for (var col = 1; col <= 6; col++) {
        var srcCell = templateRow.getCell(col);
        var dstCell = excelRow.getCell(col);
        // JSON経由でスタイルをディープコピーする（参照にならないように）
        try {
          dstCell.style = JSON.parse(JSON.stringify(srcCell.style));
        } catch (e) {
          // スタイルコピー失敗は無視する
        }
      }
    }

    // 値を書き込む
    excelRow.getCell(1).value = row[0];                                   // 月（数値）
    excelRow.getCell(2).value = row[1];                                   // 日（数値）
    excelRow.getCell(3).value = (row[2] !== null) ? row[2] : null;        // 歳入（円）
    excelRow.getCell(4).value = (row[3] !== null) ? row[3] : null;        // 歳出（円）
    excelRow.getCell(5).value = row[4] || '';                             // 摘要
    excelRow.getCell(6).value = row[5] || '';                             // 項目

    excelRow.commit();
  }

}
