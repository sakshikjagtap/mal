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

class MalList extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str() {
    return "(" + this.value.map(x => x.pr_str()).join(" ") + ")";
  }

  isEmpty() {
    return this.value.length === 0;
  }
}

class MalVector extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str() {
    return "[" + this.value.map(x => x.pr_str()).join(" ") + "]";
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

class MalBool extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str() {
    return this.value.toString();
  }

}

module.exports = {
  MalSymbol, MalValue, MalList, MalVector, MalNil, MalBool, MalMap
};