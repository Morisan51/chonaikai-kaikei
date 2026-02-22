// =============================================
// 町内会計管理アプリ - メインロジック
// Phase 1: 基本構造・タブ切り替え
// Phase 2: 収支入力フォーム
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
// Phase 3 以降で追加予定の関数（現在は空）
// =============================================

// 収支データをLocalStorageに保存する関数（Phase 3で実装）
// function saveTransaction(data) { ... }

// 収支データを一覧表示する関数（Phase 3で実装）
// function renderList() { ... }

// 残高を計算する関数（Phase 3で実装）
// function calcBalance() { ... }

// 月別・カテゴリ別に集計する関数（Phase 4で実装）
// function summarize() { ... }

// CSVファイルを出力する関数（Phase 5で実装）
// function exportCSV() { ... }
