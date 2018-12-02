"use strict";

// Partition an array according to a boolean vector and maintain ordering of
// array elements
function partition(xs, selection) {
    const ls = [];
    const rs = [];
    for (let i = 0; i < selection.length; i++) {
        (selection[i] ? ls : rs).push(xs[i]);
    }
    return [ls, rs];
}

// Generate all boolean vectors of length n, omitting all false and all true
function* selections(n) {
    const fs = [];
    for (let i = 0; i < n; i++) {
        fs.push(false);
    }
    // There are 2^n possible vectors
    const max = Math.pow(2, n) - 2;
    for (let _ = 0; _ < max; _++) {
        let carry = true;
        let j = 0;
        while (carry) {
            carry = fs[j];
            fs[j] = !fs[j];
            j++;
        }
        yield fs;
    }
}

// Generate all unique terms that can be made from numbers. Expects the array
// of numbers to be sorted. With optimizations in the term generation inspired
// by http://www.datagenetics.com/blog/august32014/index.html.
function* terms(numbers) {
    if (numbers.length === 1) {
        yield { op: "#", args: numbers, val: numbers[0] };
        return;
    }
    // Split arguments into all possible variations of two subsets and combine
    // these subsets with the binary operators - and /
    for (let selection of selections(numbers.length)) {
        const [ls, rs] = partition(numbers, selection);
        for (let l of terms(ls)) {
            for (let r of terms(rs)) {
                // Addition: to avoid duplicates, arguments are ordered from
                // smallest to largest value and merged from only one direction
                if (l.op !== "+") {
                    // Merge nested addition into n-ary operator
                    if (r.op === "+") {
                        if (l.val <= r.args[0].val) {
                            yield { op: "+", args: [l, ...r.args], val: l.val + r.val };
                        }
                    // Avoid duplicates by never including subtraction in
                    // a sum because (a - b) + c = (a + c) - b
                    } else if (r.op !== "-" && l.val <= r.val) {
                        yield { op: "+", args: [l, r], val: l.val + r.val };
                    }
                }
                // Multiplication: to avoid duplicates, arguments are ordered from
                // smallest to largest value and merged from only one direction
                if (l.op !== "*" && l.val !== 1 && r.val !== 1) {
                    // Merge nested multiplication into n-ary operator
                    if (r.op === "*") {
                        if (l.val <= r.args[0].val) {
                            yield { op: "*", args: [l, ...r.args], val: l.val * r.val };
                        }
                    // Avoid duplicates by never including division in
                    // a product because (a - b) + c = (a + c) - b
                    } else if (r.op !== "/" && l.val <= r.val) {
                        yield { op: "*", args: [l, r], val: l.val * r.val };
                    }
                }
                // Subtraction: binary only because a - b - c = a - (b + c)
                if (l.op !== "-" && r.op !== "-") {
                    const val = l.val - r.val;
                    // Don't create 0 or negative numbers and skip a - b = b
                    if (val > 0 && val !== r.val) {
                        yield { op: "-", args: [l, r], val: val };
                    }
                }
                // Division: binary only because a / b / c = a / (b * c)
                // Skip a / b = a
                if (l.op !== "/" && r.op !== "/" && r.val > 1) {
                    const val = l.val / r.val;
                    // Don't create non-integer numbers and skip a / b = b
                    if (Number.isInteger(val) && val !== r.val) {
                        yield { op: "/", args: [l, r], val: val };
                    }
                }
            }
        }
    }
}

// Generate all possible calculations that can be made with the given set of
// numbers as well as its subsets
function* calculations(numbers) {
    // Numbers in ascending order
    const sortedNumbers = Array.from(numbers).sort((x, y) => x - y);
    // Filter out same subsets when a number is given twice
    const subsets = new Map();
    for (let selection of selections(sortedNumbers.length)) {
        const subset = partition(sortedNumbers, selection)[0];
        subsets.set(subset.join(","), subset);
    }
    subsets.set(sortedNumbers.join(","), sortedNumbers);
    // Try to find short solutions first
    const sortedSubsets = Array.from(subsets.values()).sort((x, y) => x.length - y.length);
    for (let subset of sortedSubsets) {
        yield* terms(subset);
    }
}


function termToString(term) {
    if (term.op === "#") {
        return term.val.toString();
    }
    const out = term.args.map(termToString).join(term.op);
    return term.args.length > 1 ? "(" + out + ")" : out;
}

const NUMBERS = [2, 7, 9, 10, 25, 50];
const TARGET = 744;

console.log("Target: " + TARGET);
console.log("Numbers: " + NUMBERS.join(" "));
console.log("---");
for (let calculation of calculations(NUMBERS)) {
    if (calculation.val === TARGET) {
        console.log(calculation.val + " = " + termToString(calculation));
    }
}

