function setUpGrid(): void {
    getDots().then(res => {
        for (const el of res) {
            const cell = document.getElementById(el[0] + "-" + el[1]);

            const dot = document.createElement("span");
            dot.className = "dot";
            dot.style.backgroundColor = el[2];
            cell?.appendChild(dot);

            dots.push(el);
        }
    });
}

function getDots(): Promise<dotTuple[]> {
    const headers: Headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('X-CSRFToken', csrfToken || '');

    const request: RequestInfo = new Request('/flowfree/' + pk + '/get_board/', {
        method: 'GET',
        headers: headers
    });

    return fetch(request)
        .then(res => res.json()).then(res => {
            if('data' in res) {
                return res.data as dotTuple[];
            }
            else {
                return [];
            }
        });
}



type dotTuple = [number, number, string];
const dots: dotTuple[] = [];

const container = document.getElementById("container-grid");
const pk = container?.getAttribute("data-id");
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

