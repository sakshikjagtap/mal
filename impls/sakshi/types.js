const pr_str = (malValue, print_redability = false) => {
  if (malValue instanceof MalValue) {
    return malValue.pr_str(print_redability)
  };

  return malValue.toString();
}

const makeReadable = (str) => {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

class MalValue {
  constructor(value) {
    this.value = value;
  }

  pr_str() {
    return this.value.toString();
  }
}

class MalSymbol extends MalValue {
  constructor(value) {
    super(value);
  }
}

class MalSequence extends MalValue {

}

class MalList extends MalSequence {
  constructor(value) {
    super(value);
  }

  pr_str(print_redability = false) {
    return "(" + this.value.map(x => pr_str(x, print_redability)).join(" ") + ")";
  }

  isEmpty() {
    return this.value.length === 0;
  }

  toString() {
    return '\"' + this.pr_str() + '\"';
  }
}

class MalVector extends MalSequence {
  constructor(value) {
    super(value);
  }

  pr_str(print_redability = false) {
    return "[" + this.value.map(x => pr_str(x, print_redability)).join(" ") + "]";
  }

  toString() {
    return '\"' + this.pr_str() + '\"';
  }
}

class MalMap extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str() {
    return "{" + this.value.map((x, i) => {
      const separator = i % 2 !== 0 && i !== this.value.length - 1 ? "," : ''
      return x.pr_str() + separator;
    }).join(" ") + "}";

  }
}

class MalNil extends MalValue {
  constructor() {
    super(null);
  }

  pr_str() {
    return 'nil';
  }
}

class MalKeyword extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str() {
    return this.value.toString();
  }
}

class MalString extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str(print_redability = false) {
    if (print_redability) {
      return '"' + makeReadable(this.value) + '"';
    }
    return '"' + this.value.toString() + '"';
  }
}

class MalFunction extends MalValue {
  constructor(ast, binds, env, fn) {
    super(ast);
    this.binds = binds;
    this.env = env;
    this.fn = fn
  }

  pr_str() {
    return '#<Function>';
  }
  apply(ctx, args) {
    return this.fn.apply(ctx, args);
  }
}

const createMalString = (str) => {
  const string = str.replace(/\\(.)/g, (y, captured) => captured === 'n' ? '\n' : captured);
  return new MalString(string);
}

class MalAtom extends MalValue {
  constructor(value) {
    super(value);
  }

  deref() {
    return this.value;
  }

  reset(newValue) {
    this.value = newValue;
    return this.value;
  }

  swap(fn, args) {
    this.value = fn.apply(null, [this.value, ...args]);
    return this.value;
  }
  pr_str() {
    return `(atom ${this.value.value})`;
  }
}

module.exports = {
  MalSymbol, MalValue, MalList, MalVector, MalNil, MalMap, MalKeyword, MalString, MalFunction, createMalString, pr_str, MalAtom, MalSequence
};