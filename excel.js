const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const table = $("#table");
const thead = table.querySelector("thead");
const tbody = table.querySelector("tbody");

const ROWS = 10;
const COLUMNS = 5;
const FIRST_LETTER = 65;

const times = (n) => Array.from({ length: n }, (_, k) => k);
const getColumn = (i) => String.fromCharCode(i + FIRST_LETTER);

let selectedColumn

let STATE = times(COLUMNS).map((i) =>
    times(ROWS).map((j) => {
        return {
            computedValue: 0,
            value: 0,
        };
    })
);

console.log(STATE);

const generateCellConstants = (cells) => {
    // 
    return cells.map((rows, x) => {
        return rows.map((cell, y) => {
            const letter = getColumn(x); // -> A
            const cellId = `${letter}${y + 1}`; // -> A1

            return `const ${cellId} = ${cell.computedValue};`
        }).join("\n")
    }).join("\n")
}

const computeAllCells = (cells, constants) => {
    cells.forEach((rows, x) => {
        rows.forEach((cell, y) => {
            const computedValue = computeValue(cell.value, constants);
            cell.computedValue = computedValue;
        })
    });
}


const computeValue = (value, constants) => {
    if (typeof value === "number") return value

    if (!value.startsWith("=")) {
        return value
    }

    const formula = value.slice(1);

    let computedValue = 0

    try {

        // computedValue = eval(formula) //esto solo es ejemplo, eval es peligroso

        // esto tiene todas las variables
        computedValue = eval(`(() => {
                ${constants}

                return ${formula}
                })()`)
    } catch (error) {
        computedValue = `!ERROR!`
    }

    return computedValue
};

const updateCell = (x, y, value) => {
    //
    const newState = structuredClone(STATE);
    const constants = generateCellConstants(newState);
    const cell = newState[x][y];

    // cell.computedValue = Number(value); //TODO:

    cell.computedValue = computeValue(value, constants);
    cell.value = value;

    newState[x][y] = cell;

    computeAllCells(newState, generateCellConstants(newState));

    STATE = newState;

    renderSpreadSheet();
};



export const renderSpreadSheet = () => {
    const headerHTML = `<tr> 
                <th></th>
                ${times(COLUMNS)
            .map((i) => `<th>${getColumn(i)}</th>`)
            .join("")}
                </tr>`;
    thead.innerHTML = headerHTML;

    const bodyHTML = times(ROWS)
        .map((row) => {
            return `<tr> 
                    <td>${row + 1}</td>
                    ${times(COLUMNS)
                    .map(
                        (column) =>
                            `<td data-x=${column} data-y=${row}>
                        <span>${STATE[column][row].computedValue}</span>
                        <input type="text" value=${STATE[column][row].value} />
                    </td>`
                    )
                    .join("")}
                    
                </tr>`;
        })
        .join("");
    tbody.innerHTML = bodyHTML;
};

tbody.addEventListener("click", (e) => {
    console.log("event.target", e.target);
    const td = e.target.closest("td");
    if (!td) return;

    console.log("td", td);
    const { x, y } = td.dataset;
    console.log("x", x, "y", y);

    const input = td.querySelector("input");
    const span = td.querySelector("span");

    const endPosition = input.value.length;
    input.setSelectionRange(endPosition, endPosition);
    input.focus();

    $$('.selected').forEach((th) => { th.classList.remove("selected") })
    selectedColumn = null

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            input.blur()
        }
    })

    input.addEventListener(
        "blur",
        (e) => {
            if (input.value === STATE[x][y].value) return;

            updateCell(x, y, input.value);
        },
        { once: true }
    );
});

thead.addEventListener("click", (e) => {
    const th = event.target.closest("th");
    if (!th) return;

    const x = [...th.parentNode.children].indexOf(th)

    if (x <= 0) return;

    selectedColumn = x - 1

    th.classList.toggle("selected")
    $$(`tr td:nth-child(${x + 1})`).forEach((td) => {
        td.classList.toggle("selected")
    })
})

console.log('selectedColumn', selectedColumn)
document.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && selectedColumn !== null) {
        times(ROWS).forEach((row) => {
            updateCell(selectedColumn, row, "")
        })

        renderSpreadSheet();
    }


})

document.addEventListener("copy", (e) => {
    if (selectedColumn !== null) {


        const columnValues = times(ROWS).map((row) => {
            return STATE[selectedColumn][row].computedValue
        })

        e.clipboardData.setData("text/plain", columnValues.join("\n"))

        e.preventDefault()
    }

})

document.addEventListener("click", (e) => {
    const { target } = e

    const isThClicked = target.closest("th")
    const isTdClicked = target.closest("td")

    if (!isThClicked && !isTdClicked) {
        $$('.selected').forEach((th) => { th.classList.remove("selected") })
        selectedColumn = null
    }



})


