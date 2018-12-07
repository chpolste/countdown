"use strict";

function create(tag, inner) {
    const node = document.createElement(tag);
    if (inner != null) node.appendChild(document.createTextNode(inner));
    return node;
}

function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}


const numbers = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 25, 50, 75, 100];
const selected = new Set();


const solutions = new Map();
for (let i = 100; i < 1000; i++) {
    solutions.set(i, create("div"));
}

const cards = numbers.map((n, i) => newCard(n, i));

function newCard(n, i) {
    const node = create("div", n.toString());
    node.addEventListener("click", () => select(i));
    return node;
}

function select(i) {
    if (selected.has(i)) {
        selected.delete(i);
        cards[i].className = "";
    } else if (selected.size >= 6) {
        return;
    } else {
        selected.add(i);
        cards[i].className = "selected";
    }
    update();
}

function deselectAll() {
    cards.forEach((_) => { _.className = ""; });
    selected.clear();
    update();
}

function randomize() {
    selected.clear();
    while (selected.size < 6) {
        selected.add(Math.floor(Math.random() * numbers.length));
    }
    cards.forEach((card, i) => {
        card.className = selected.has(i) ? "selected" : "";
    });
    update();
}

function update() {
    numbersNode.className = selected.size >= 6 ? "locked" : "open";
    solutions.forEach(clear);
    if (selected.size === 6) {
        newRequest();
    } else {
        cancelRequest();
    }
}


const worker = new Worker("index-worker.js");
let currentID = 0;

function newRequest() {
    worker.postMessage({
        id: currentID,
        ns: Array.from(selected).map((i) => numbers[i])
    });
}

function cancelRequest() {
    currentID++;
}

worker.onmessage = (msg) => {
    const id = msg.data.id;
    if (id !== currentID) return;
    for (let [tgt, sol] of msg.data.ts) {
        const node = solutions.get(tgt);
        if (node == null) continue;
        if (!node.firstChild) {
            node.appendChild(create("h2", tgt.toString()));
            node.appendChild(create("p", sol));
        }
    }
    worker.postMessage({ id: id });
};


let numbersNode = null;
let controlNode = null;
let solutionsNode = null;

document.addEventListener("DOMContentLoaded", () => {
    numbersNode = document.getElementById("numbers");
    controlNode = document.getElementById("control");
    solutionsNode = document.getElementById("solutions");
    
    const deselector = create("a", "deselect all");
    deselector.addEventListener("click", deselectAll);
    const randomizer = create("a", "randomize");
    randomizer.addEventListener("click", randomize);
    controlNode.appendChild(deselector);
    controlNode.appendChild(document.createTextNode(" | "));
    controlNode.appendChild(randomizer);

    cards.forEach((_) => numbersNode.appendChild(_));
    solutions.forEach((_) => solutionsNode.appendChild(_));
    update();
});

