// =============================================
// 町内会計管理アプリ - メインロジック
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

// 収入カテゴリの一覧
const INCOME_CATEGORIES = ["町内会費", "補助金", "繰越金", "その他収入"];

// 支出カテゴリの一覧
const EXPENSE_CATEGORIES = ["行事費", "消耗品費", "通信費", "慶弔費", "その他支出"];

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

  console.log("✅ 町内会計管理アプリ 起動完了（Supabase接続済み）");

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
    const typeLabel = (type === "income") ? "収入" : "支出";
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
// Phase 3：一覧タブに収支データを表示する
// =============================================
async function renderList() {

  const tbody = document.getElementById("transaction-tbody");
  const noDataMsg = document.getElementById("no-data-message");

  // Supabaseから全データを取得する
  const transactions = await loadTransactions();

  if (transactions.length === 0) {
    tbody.innerHTML = "";
    noDataMsg.style.display = "block";
    return;
  }

  noDataMsg.style.display = "none";
  tbody.innerHTML = "";

  // データを1件ずつ行として追加する
  transactions.forEach(function (item) {

    const tr = document.createElement("tr");
    const amountFormatted = item.amount.toLocaleString();
    const isIncome = (item.type === "income");
    const badgeClass = isIncome ? "table__badge--income" : "table__badge--expense";
    const badgeText = isIncome ? "収入" : "支出";
    const amountClass = isIncome ? "table__amount--income" : "table__amount--expense";
    const amountSign = isIncome ? "+" : "-";

    tr.innerHTML =
      "<td>" + item.date + "</td>" +
      "<td><span class='table__badge " + badgeClass + "'>" + badgeText + "</span></td>" +
      "<td>" + item.category + "</td>" +
      "<td class='" + amountClass + "'>" + amountSign + "¥" + amountFormatted + "</td>" +
      "<td>" + (item.note || "—") + "</td>" +
      "<td><button class='table__delete-btn' data-id='" + item.id + "'>削除</button></td>";

    tbody.appendChild(tr);

  });

  // 削除ボタンにクリック処理を登録する
  const deleteButtons = tbody.querySelectorAll(".table__delete-btn");
  deleteButtons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      const id = btn.dataset.id;
      if (confirm("このデータを削除しますか？")) {
        await deleteTransaction(id);
      }
    });
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
// Phase 4：月別集計テーブルを作る
// =============================================
function renderMonthlyTable(transactions) {

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

  const months = Object.keys(monthlyMap).sort(function (a, b) {
    return b.localeCompare(a);
  });

  const tbody = document.getElementById("monthly-tbody");
  tbody.innerHTML = "";

  months.forEach(function (month) {
    const income = monthlyMap[month].income;
    const expense = monthlyMap[month].expense;
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

}

// =============================================
// Phase 4：カテゴリ別集計バーチャートを作る
// =============================================
function renderCategoryChart(transactions, type) {

  const filtered = transactions.filter(function (item) {
    return item.type === type;
  });

  const categoryMap = {};
  filtered.forEach(function (item) {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = 0;
    }
    categoryMap[item.category] += item.amount;
  });

  const categories = Object.keys(categoryMap).sort(function (a, b) {
    return categoryMap[b] - categoryMap[a];
  });

  const maxAmount = categories.length > 0 ? categoryMap[categories[0]] : 1;

  const containerId = (type === "income") ? "income-category-chart" : "expense-category-chart";
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (categories.length === 0) {
    container.innerHTML = "<p style='color:#999; font-size:0.85rem;'>データなし</p>";
    return;
  }

  categories.forEach(function (category) {
    const amount = categoryMap[category];
    const barWidth = Math.round((amount / maxAmount) * 100);
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
        item.type === "income" ? "収入" : "支出",
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
  rows.push(["収入合計", "", "", totalIncome, ""]);
  rows.push(["支出合計", "", "", totalExpense, ""]);
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
  link.download = "町内会計_" + label + ".csv";
  link.click();
  URL.revokeObjectURL(url);

  console.log("CSV出力完了：" + link.download);

}
