function showToast(message: string) {
  const toaster = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  toaster.appendChild(toast);

  setTimeout(() => {
    toaster.removeChild(toast);
  }, 5000); // 5 seconds
}

const sse = new EventSource("/flowfree/sse/notifications/");
sse.addEventListener("newGame", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    showToast("User " + data.username + " started new game on board " + data.board_name);
});

sse.addEventListener("newBoard", (e: MessageEvent) => {
    const data = JSON.parse(e.data);
    showToast("User " + data.username + " created new board: " + data.name);
});



