document.addEventListener("DOMContentLoaded", () => {
  const dineinBtn = document.getElementById("dineinBtn");
  const popup = document.getElementById("tablePopup");
  const cancelPopup = document.getElementById("cancelPopup");
  const confirmPopup = document.getElementById("confirmPopup");
  let selectedTable = null;

  dineinBtn.addEventListener("click", () => {
    popup.classList.remove("hidden");
  });

  cancelPopup.addEventListener("click", () => {
    selectedTable = null;
    document.querySelectorAll(".table-btn").forEach(btn => btn.classList.remove("selected"));
    popup.classList.add("hidden");
  });

  confirmPopup.addEventListener("click", () => {
    if (selectedTable) {
      console.log("Đã chọn bàn:", selectedTable);
      // TODO: chuyển sang màn order với selectedTable
      popup.classList.add("hidden");
    }
  });

  document.querySelectorAll(".table-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".table-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedTable = btn.dataset.table;
    });
  });
});
