"use strict";
var _a;
function setUpGrid() {
    getDots().then(res => {
        for (const el of res) {
            const cell = document.getElementById(el[0] + "-" + el[1]);
            const dot = document.createElement("span");
            dot.className = "dot";
            dot.style.backgroundColor = el[2];
            cell === null || cell === void 0 ? void 0 : cell.appendChild(dot);
            dots.push(el);
        }
    });
}
function getDots() {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-CSRFToken', csrfToken || '');
    const request = new Request('/flowfree/' + pk + '/get_board/', {
        method: 'GET',
        headers: headers
    });
    return fetch(request)
        .then(res => res.json()).then(res => {
        if ('data' in res) {
            return res.data;
        }
        else {
            return [];
        }
    });
}
const dots = [];
const container = document.getElementById("container-grid");
const pk = container === null || container === void 0 ? void 0 : container.getAttribute("data-id");
const csrfToken = (_a = document.querySelector('meta[name="csrf-token"]')) === null || _a === void 0 ? void 0 : _a.getAttribute('content');
//# sourceMappingURL=basics.js.map