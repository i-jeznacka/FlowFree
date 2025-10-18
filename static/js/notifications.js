"use strict";
function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container)
        return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    container.appendChild(toast);
    // Remove the toast after it fades out
    setTimeout(() => {
        container.removeChild(toast);
    }, 5000); // 5 seconds
}
const sse = new EventSource("/flowfree/sse/notifications/");
sse.addEventListener("newGame", (e) => {
    const data = JSON.parse(e.data);
    //alert("User " + data.username + " started new game on board " + data.board_name);
    showToast("User " + data.username + " started new game on board " + data.board_name);
});
sse.addEventListener("newBoard", (e) => {
    const data = JSON.parse(e.data);
    showToast("User " + data.username + " created new board: " + data.name);
});
//# sourceMappingURL=notifications.js.map