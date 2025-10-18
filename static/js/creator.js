"use strict";
function createGrid() {
    const container = document.getElementById("container-grid");
    const x = container === null || container === void 0 ? void 0 : container.getAttribute("data-cols");
    const y = container === null || container === void 0 ? void 0 : container.getAttribute("data-rows");
    let cols = x ? parseInt(x) : 0;
    let rows = y ? parseInt(y) : 0;
    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            const cell = document.createElement("div");
            cell.className = "grid-item";
            cell.id = i.toString() + "-" + j.toString();
            cell.setAttribute("data-col", i.toString());
            cell.setAttribute("data-row", j.toString());
            cell.addEventListener("click", (event) => {
                const c = cell.getAttribute("data-col");
                const r = cell.getAttribute("data-row");
                const col = c ? parseInt(c) : 0;
                const row = r ? parseInt(r) : 0;
                const picker = document.getElementById("dotcolor");
                const color = picker === null || picker === void 0 ? void 0 : picker.value;
                if (color) {
                    if (cell.getElementsByClassName("dot")[0]) { //There is dot in the cell
                        let dotId = dots.findIndex(([x, y]) => x === col && y === row);
                        if (dotId != -1) {
                            dots.splice(dotId, 1);
                            const dot = cell.getElementsByClassName("dot")[0];
                            dot.remove();
                        }
                    }
                    else {
                        const count = dots.filter(([, , dotcolor]) => dotcolor === color).length;
                        if (count < 2) {
                            const dot = document.createElement("span");
                            dot.className = "dot";
                            dot.style.backgroundColor = color;
                            cell.appendChild(dot);
                            let dotEl = [col, row, color];
                            dots.push(dotEl);
                        }
                        else {
                            alert("You can't put more than two dots of the same color");
                        }
                    }
                }
            });
            container === null || container === void 0 ? void 0 : container.appendChild(cell);
        }
    }
}
function setUpButton() {
    const button = document.getElementById("dotconf");
    button === null || button === void 0 ? void 0 : button.addEventListener("click", (event) => postDots());
}
function postDots() {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-CSRFToken', csrfToken || '');
    const request = new Request('/flowfree/' + pk + '/save_board/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(dots)
    });
    return fetch(request)
        .then(res => res.json()).then(data => {
        if ('error' in data) {
            alert(data.error);
        }
    });
}
createGrid();
setUpGrid();
setUpButton();
//# sourceMappingURL=creator.js.map