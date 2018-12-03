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

// Generate all terms that can be made from given numbers. Expects the array of
// numbers to be sorted. With optimizations in the term generation inspired by
// http://www.datagenetics.com/blog/august32014/index.html.
// TODO avoid (... * a * ...) / a but not a / a = 1
// TODO avoid (... + a + ...) - a
// TODO avoid duplicate terms when number is in selection more than once
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
                // smallest to largest value, merged into n-ary sums from only
                // one direction and subtraction is never inluded in a sum
                // because (a - b) + c = (a + c) - b
                if (l.op !== "+" && l.op !== "-" && r.op !== "-") {
                    if (r.op === "+") {
                        if (l.val <= r.args[0].val) {
                            yield { op: "+", args: [l, ...r.args], val: l.val + r.val };
                        }
                    } else if (l.val <= r.val) {
                        yield { op: "+", args: [l, r], val: l.val + r.val };
                    }
                }
                // Multiplication: to avoid duplicates, arguments are ordered
                // from smallest to largest value, merged into n-ary products
                // from only one direction and division is never inluded in
                // a sum because (a / b) * c = (a * c) / b
                if (l.op !== "*" && l.op !== "/" && r.op !== "/" && l.val !== 1 && r.val !== 1) {
                    if (r.op === "*") {
                        if (l.val <= r.args[0].val) {
                            yield { op: "*", args: [l, ...r.args], val: l.val * r.val };
                        }
                    } else if (l.val <= r.val) {
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
function* countdown(numbers) {
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

// Export countdown function if used as module
if (typeof module !== "undefined") {
    module.exports = countdown;
}


// Basic operator precedence rules
const precedence = { "+": 1, "-": 2, "*": 3, "/": 4 };

// Pretty printer
function termToString(term, parentPrecedence) {
    if (term.op === "#") {
        return term.val.toString();
    }
    const out = term.args.map((_) => termToString(_, precedence[term.op])).join(term.op);
    const parentheses = parentPrecedence != null && parentPrecedence > precedence[term.op];
    return parentheses ? "(" + out + ")" : out;
}

// Command line interface
if (typeof require !== "undefined" && require.main === module) {
    const args = process.argv.slice(2).map((_) => parseInt(_, 10));
    if (args.length < 2 || args.map(isNaN).reduce((p, q) => p || q)) {
        console.log("countdown.js target number [number...]");
    } else {
        const [target, ...numbers] = args;
        const seen = new Set();
        for (let calc of countdown(numbers)) {
            if (calc.val === target) {
                const repr = termToString(calc);
                // If some number occurs twice in selection, solutions
                // involving both numbers will be generated twice
                if (!seen.has(repr)) console.log(repr);
                seen.add(repr);
            }
        }
    }
}

