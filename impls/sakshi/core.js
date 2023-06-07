const { read_str } = require('./reader');
const { MalList, MalString, MalValue, MalVector, MalAtom, MalNil, MalSequence, pr_str } = require('./types');
const fs = require('fs');

const oneArgSubstaraction = (arg) => {
  return new MalValue(0 - arg.value);
}

const substraction = (args) => {
  if (args.length === 1) return oneArgSubstaraction(args[0]);

  return args.reduce((sub, ele) => new MalValue(sub.value - ele.value))
}

const isIteratoratable = (ele) => {
  return ele instanceof MalList || ele instanceof MalVector
}

const isBothIteratoratable = (a, b) => {
  return isIteratoratable(a) && isIteratoratable(b);
}

const equals = (a, b) => {
  if (isBothIteratoratable(a, b)) {
    if (a.value.length === 0 && b.value.length === 0) {
      return true;
    }
    return deepEquals([a, b]);
  }
  return a.value === b.value;
}

const deepEquals = ([a, b]) => {
  if (isBothIteratoratable(a, b) && a.value.length === b.value.length) {
    return a.value.every((ele, index) => {
      return equals(ele, b.value[index]);
    })
  }

  return a.value === b.value;
}


const greaterThan = (a, b) => a > b;
const lessThan = (a, b) => a < b;
const greaterThanOrEqual = (a, b) => a >= b;
const lessThanOrEqual = (a, b) => a <= b;
// const equals = (a, b) => a === b;

const operate = (operation, args, env) => {
  return args.slice(0, -1).every((ele, index) =>
    operation(ele.value, args[index + 1].value)
  );
}

const concatStrings = (args, separator, wrapRequired = false, asString = false) => {
  let result = "";
  for (let i = 0; i < args.length; i++) {
    let element;
    if (args[i] instanceof MalSequence) {
      element = concatStrings(args[i].value, " ", false, true);
    } else {
      element = asString ? args[i].pr_str() : args[i].value.toString();
    }
    result = result.concat(separator + element);
  }
  return wrapRequired ? `"${result.trim()}"` : result.trim();
};


const core = {
  '+': (...args) => args.reduce((sum, ele) => new MalValue(sum.value + ele.value)),
  '-': (...args) => substraction(args),

  '*': (...args) => args.reduce((sum, ele) => new MalValue(sum.value * ele.value)),
  '/': (...args) => args.reduce((sum, ele) => new MalValue(sum.value / ele.value)),
  '=': (...args) => deepEquals(args),
  '>': (...args) => operate(greaterThan, args),
  '<': (...args) => operate(lessThan, args),
  '>=': (...args) => operate(greaterThanOrEqual, args),
  '<=': (...args) => operate(lessThanOrEqual, args),
  'count': (arg) => {
    if (!isIteratoratable(arg)) return 0;
    return new MalValue(arg.value.length)
  },
  'list': (...args) => new MalList(args),
  'list?': (arg) => arg instanceof MalList,
  'empty?': (arg) => arg.value.length === 0,

  'prn': (...args) => {
    const str = args.map((el) => pr_str(el, true)).join(" ");
    console.log(str);
    return new MalNil();
  },

  'pr-str': (...args) => {
    const str = args.map((el) => pr_str(el, true)).join(" ");
    return pr_str(new MalString(str), true);
  },

  'str': (...args) => {
    const str = args.map((el) => pr_str(el, false)).join("");
    return new MalString(str);
  },

  'println': (...args) => {
    const str = args.map((el) => pr_str(el, false)).join(" ");
    console.log(str);
    return new MalNil();
  },

  'read-string': (str) => read_str(str.value),
  'slurp': (filename) => new MalString(fs.readFileSync(filename.value, 'utf8')),
  'atom': (arg) => new MalAtom(arg),
  'atom?': (atom) => atom instanceof MalAtom,
  'deref': (atom) => atom.deref().value,
  'reset!': (atom, value) => atom.reset(value),
  'swap!': (atom, fn, ...args) => atom.swap(fn, args),
  'cons': (value, list) => new MalList([value, ...list.value]),
  'concat': (...lists) => new MalList(lists.flatMap(x => x.value)),
  'vec': list => new MalVector(list.value.slice()),
}

module.exports = { core };