// =============================================
// 町内会計管理アプリ - メインロジック
// Phase 1: 基本構造・タブ切り替え
// =============================================

// ページが完全に読み込まれてからJavaScriptを実行する
// （HTMLより先にJSが動くとエラーになるため、これが定番の書き方）
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
// Phase 2 以降で追加予定の関数（現在は空）
// =============================================

// 収支データを保存する関数（Phase 3で実装）
// function saveTransaction(data) { ... }

// 収支データを一覧表示する関数（Phase 3で実装）
// function renderList() { ... }

// 残高を計算する関数（Phase 3で実装）
// function calcBalance() { ... }

// 月別・カテゴリ別に集計する関数（Phase 4で実装）
// function summarize() { ... }

// CSVファイルを出力する関数（Phase 5で実装）
// function exportCSV() { ... }
