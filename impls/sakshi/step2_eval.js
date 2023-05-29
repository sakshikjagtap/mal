const readline = require('readline');
const { read_str } = require('./reader.js');
const { pr_str } = require('./printer.js');
const { MalSymbol, MalList, MalValue, MalVector, MalMap } = require('./types.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const oneArgSubstaraction = (arg) => {
  return new MalValue(0 - arg.value);
}

const substraction = (args) => {
  if (args.length === 1) return oneArgSubstaraction(args[0]);

  return args.reduce((sub, ele) => new MalValue(sub.value - ele.value))
}

const env = {
  '+': (...args) => args.reduce((sum, ele) => new MalValue(sum.value + ele.value)),
  '-': (...args) => substraction(args),
  '*': (...args) => args.reduce((mul, ele) => new MalValue(mul.value * ele.value)),
  '/': (...args) => args.reduce((div, ele) => new MalValue(div.value / ele.value)),
}

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    return env[ast.value];
  }

  if (ast instanceof MalList) {
    const newAst = ast.value.map(x => EVAL(x, env))
    return new MalList(newAst);
  }

  if (ast instanceof MalVector) {
    const newAst = ast.value.map(x => EVAL(x, env))
    return new MalVector(newAst);
  }

  if (ast instanceof MalMap) {
    const newAst = ast.value.map((x, i) => {
      return i % 2 === 0 ? x : EVAL(x, env);
    })
    return new MalMap(newAst);
  }
  return ast;
}

const READ = str => read_str(str);
const EVAL = (ast, env) => {
  if (!(ast instanceof MalList)) {
    return eval_ast(ast, env);
  }

  if (ast.isEmpty()) return ast;

  const [fn, ...args] = eval_ast(ast, env).value;
  return fn.apply(null, args);

};
const PRINT = str => pr_str(str);

const rep = str => PRINT(EVAL(READ(str), env));

const repl = () =>
  rl.question('user> ', line => {
    try {
      console.log(rep(line));
    }
    catch (error) {
      console.log(error);
    }
    repl();
  });

repl();

