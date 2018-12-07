"use strict";

self.importScripts("countdown.js");


let generator = null;
let targets = new Set();

function sendSolutions(id) {
    if (generator == null) return;
    let next = generator.next();
    let solutions = new Map();
    let i = 0;
    while (i < 1000 && next.done !== true) {
        const target = next.value.val;
        if (!targets.has(target)) {
            targets.add(target);
            solutions.set(target, termToString(next.value));
        }
        next = generator.next();
        i++;
    }
    postMessage({
        id: (i > 0 || targets.size === 900) ? id : -999,
        ts: solutions
    });
}

self.onmessage = function (msg) {
    if (msg.data.ns != null) {
        generator = countdown(msg.data.ns);
        targets.clear();
    }
    sendSolutions(msg.data.id);
};

