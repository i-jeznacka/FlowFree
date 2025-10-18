function createGridGame(): void {
    const container = document.getElementById("container-grid");
    
    const x = container?.getAttribute("data-cols");
    const y = container?.getAttribute("data-rows");

    let cols = x? parseInt(x): 0;
    let rows = y? parseInt(y): 0;

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

                const col = c? parseInt(c): 0;
                const row = r? parseInt(r): 0;

                let prv_r = (prv_x+15)/31;
                let prv_c = (prv_y+15)/31;

                if (cell.getElementsByClassName("dot")[0]) { // There is dot in the cell
                    if (!lines.some(l => (l.r1 === row && l.c1 === col) || (l.r2 === row && l.c2 === col))) {
                        const dot = cell.getElementsByClassName("dot")[0];
                        let dot_color = (dot as HTMLElement).style.backgroundColor;
                        if (cur_color === dot_color && empty(row, col) &&
                          (Math.abs(prv_r - row) + Math.abs(prv_c - col) == 1)) { // Continue line
                            const svg = document.getElementById("board-svg");
                            const new_line = document.createElementNS(ns, "line");

                            new_line.setAttribute('x1', prv_x.toString());
                            new_line.setAttribute('y1', prv_y.toString());
                            prv_x = row*31 - 15;
                            prv_y = col*31 - 15;
                            new_line.setAttribute('x2', prv_x.toString());
                            new_line.setAttribute('y2', prv_y.toString());
                            new_line.setAttribute('stroke', cur_color);

                            svg?.appendChild(new_line);

                            lines.push(createLine(prv_c, prv_r, col, row, cur_color));
                            cur_color = ""; //End drawing
                        }
                        else {
                            cur_color = dot_color;
                            let color_dot = document.getElementById("color-dot");
                            (color_dot as HTMLElement).style.backgroundColor = dot_color;
                            prv_x = row*31 - 15;
                            prv_y = col*31 - 15;
                        }
                    }
                }

                else {
                    const svg = document.getElementById("board-svg");
                    const new_line = document.createElementNS(ns, "line");

                    if (Math.abs(prv_r - row) + Math.abs(prv_c - col) === 1 && empty(row, col)) {

                        new_line.setAttribute('x1', prv_x.toString());
                        new_line.setAttribute('y1', prv_y.toString());
                        prv_x = row*31 - 15;
                        prv_y = col*31 - 15;
                        new_line.setAttribute('x2', prv_x.toString());
                        new_line.setAttribute('y2', prv_y.toString());
                        new_line.setAttribute('stroke', cur_color);

                        svg?.appendChild(new_line);

                        lines.push(createLine(prv_c, prv_r, col, row, cur_color));
                    }

                    else if (!lines.some(l => l.r1 === row && l.c1 === col)) {
                        const end = lines.find(l => l.r2 === row && l.c2 === col);
                        if (end) {
                            cur_color = end.color;
                            let color_dot = document.getElementById("color-dot");
                            (color_dot as HTMLElement).style.backgroundColor = cur_color;
                            prv_x = row*31 - 15;
                            prv_y = col*31 - 15;
                        }
                    }
                }
            });
            container?.appendChild(cell);
        }
    }
}

function setUpLineButton(): void {
    const button = document.getElementById("lineconf");
    button?.addEventListener("click", (event) => postLines());
}

function postLines(): Promise<void> {
    const headers: Headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-CSRFToken', csrfToken || '');

    const request: RequestInfo = new Request('/flowfree/' + gid + '/save_game/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(lines)
    });

    return fetch(request)
        .then(res => res.json()).then(data => {
            if('error' in data) {
                alert(data.error);
            }
            else {
                if (data.message === 'GAME')
                    alert("Congratulations! You completed the game.");
                }
        });

}

function setUpSVG(): void {
    getLines().then(res => {
        const svg = document.getElementById("board-svg");
        for (const elem of res) {
            const el: line = elem;
            const new_line = document.createElementNS(ns, "line");
            new_line.setAttribute('x1', (el['r1']*31 - 15).toString());
            new_line.setAttribute('y1', (el['c1']*31 - 15).toString());
            new_line.setAttribute('x2', (el['r2']*31 - 15).toString());
            new_line.setAttribute('y2', (el['c2']*31 - 15).toString());
            new_line.setAttribute('stroke', el['color']);
            svg?.appendChild(new_line);

            lines.push(el);
        }
    });
}


function getLines(): Promise<line[]> {
    const headers: Headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-CSRFToken', csrfToken || '');

    const request: RequestInfo = new Request('/flowfree/' + gid + '/get_game/', {
        method: 'GET',
        headers: headers
    });

    return fetch(request)
        .then(res => res.json()).then(res => {
            if('data' in res) {
                return res.data as line[];
            }
            else {
                return [];
            }
        });
}

function setUpClearButton(): void {
    const button = document.getElementById('cleaner');
    button?.addEventListener('click', (event) => {
        lines.length = 0;
        const svg = document.getElementById('board-svg');
        if (svg) {
            svg.innerHTML = "";
        }
    });
}

function empty(x: number, y: number): boolean {
    return (!lines.some(l => l.r1 === x && l.c1 === y)) &&
    (!lines.some(l => l.r2 === x && l.c2 === y) || lines.some(l => l.r2 === x && l.c2 === y && l.color === cur_color));
}


interface line {
    c1: number;
    r1: number;
    c2: number;
    r2: number;
    color: string;
}

function createLine(c1: number, r1: number, c2: number, r2: number, color: string): line {
    return { c1, r1, c2, r2, color }; // uses property shorthand
}

const lines: line[] = [];
let cur_color: string = "";
let prv_x: number = 0;
let prv_y: number = 0;

const ns: string = "http://www.w3.org/2000/svg"
const gid = container?.getAttribute("data-game");
createGridGame();
setUpGrid();
setUpLineButton();
setUpSVG();
setUpClearButton();
