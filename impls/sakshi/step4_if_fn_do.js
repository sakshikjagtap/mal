const readline = require('readline');
const { read_str } = require('./reader.js');
const { pr_str } = require('./printer.js');
const { MalSymbol, MalList, MalValue, MalVector, MalMap, MalNil, MalString } = require('./types.js');
const { Env } = require('./env.js');
const { core } = require('./core.js');

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

const not = (arg) => {
  if (arg.value === 0) return false;
  if (arg instanceof MalNil) return true;
  return !(EVAL(arg, env))
}

const isIteratoratable = (ele) => {
  return ele instanceof MalList || ele instanceof MalVector
}

const isBothIteratoratable = (a, b) => {
  return isIteratoratable(a) && isIteratoratable(b);
}

const equals = (a, b, env) => {
  if (isBothIteratoratable(a, b)) {
    if (a.value.length === 0 && b.value.length === 0) {
      return true;
    }
    return deepEquals([a, b], env);
  }
  return EVAL(a.value, env) === EVAL(b.value, env);
}

const deepEquals = ([a, b], env) => {
  if (isBothIteratoratable(a, b) && a.value.length === b.value.length) {
    return a.value.every((ele, index) => {
      return equals(ele, b.value[index], env);
    })
  }

  return EVAL(a.value, env) === EVAL(b.value, env);
}


const greaterThan = (a, b) => a > b;
const lessThan = (a, b) => a < b;
const greaterThanOrEqual = (a, b) => a >= b;
const lessThanOrEqual = (a, b) => a <= b;

const operate = (operation, args, env) => {
  return args.slice(0, -1).every((ele, index) =>
    operation(EVAL(ele, env).value, EVAL(args[index + 1], env).value, env)
  );
}

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    return env.get(ast);
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

const handleDef = (ast, env) => {
  env.set(ast.value[1], EVAL(ast.value[2], env));
  return env.get(ast.value[1]);
}

const handleLet = (ast, env) => {
  const [binds, ...forms] = ast.value.slice(1);
  const newEnv = new Env(env, binds, forms);

  for (let i = 0; i < ast.value[1].value.length; i += 2) {
    newEnv.set(ast.value[1].value[i], EVAL(ast.value[1].value[i + 1], newEnv))
  }
  const doForms = new MalList([new MalSymbol('do'), ...forms]);
  return EVAL(doForms, newEnv);
}

const handleDo = (ast, env) => {
  const newAst = ast.value.slice(1);
  return newAst.reduce((c, e) => EVAL(e, env), new MalNil());
}

const handleIf = (ast, env) => {
  const [, condition, trueBlock, falseBlock] = ast.value;
  const exp_result = EVAL(condition, env);
  if (exp_result && !(exp_result instanceof MalNil)) {
    return EVAL(trueBlock, env);
  }
  return falseBlock !== undefined ? EVAL(falseBlock, env) : new MalNil();
}

const handleFn = (ast, env) => {
  const [, args, ...fnBody] = ast.value;
  const clojure = (...fnArgs) => {
    const fnEnv = new Env(env, args.value, fnArgs);
    const doForms = new MalList([new MalSymbol('do'), ...fnBody]);
    return EVAL(doForms, fnEnv);
  }
  clojure.toString = () => '#<function>';
  return clojure;
}

const READ = str => read_str(str);
const EVAL = (ast, env) => {
  if (!(ast instanceof MalList)) {
    return eval_ast(ast, env);
  }

  if (ast.isEmpty()) return ast;

  switch (ast.value[0].value) {
    case 'def!':
      return handleDef(ast, env);
    case 'let*':
      return handleLet(ast, env);
    case 'do':
      return handleDo(ast, env);
    case 'if':
      return handleIf(ast, env);
    case 'fn*':
      return handleFn(ast, env);
  }

  const [fn, ...args] = eval_ast(ast, env).value;
  return fn.apply(null, args);

};
const PRINT = str => pr_str(str, true);

const env = new Env();
// env.set(new MalValue('+'), (...args) => args.reduce((sum, ele) => new MalValue(sum.value + ele.value)))
// env.set(new MalValue('-'), (...args) => substraction(args))
// env.set(new MalValue('*'), (...args) => args.reduce((sum, ele) => new MalValue(sum.value * ele.value)))
// env.set(new MalValue('/'), (...args) => args.reduce((sum, ele) => new MalValue(sum.value / ele.value)))
// env.set(new MalValue('='), (...args) => deepEquals(args, env));
// env.set(new MalValue('>'), (...args) => operate(greaterThan, args));
// env.set(new MalValue('<'), (...args) => operate(lessThan, args));
// env.set(new MalValue('>='), (...args) => operate(greaterThanOrEqual, args));
// env.set(new MalValue('<='), (...args) => operate(lessThanOrEqual, args));
// env.set(new MalValue('not'), (arg) => not(arg));
// env.set(new MalValue('count'), (arg) => {
//   if (!isIteratoratable(arg)) return 0;
//   return new MalValue(arg.value.length)
// });
// env.set(new MalValue('list'), (...args) => new MalList(args));
// env.set(new MalValue('list?'), (arg) => arg instanceof MalList);
// env.set(new MalValue('empty?'), (arg) => arg.value.length === 0);
// env.set(new MalValue('prn'), (...args) => {
//   const str = args.reduce((c, e) => c += EVAL(e).value, "");
//   console.log(str);
//   return new MalNil()
// })
// env.set(new MalValue('str'), (...args) => {
//   return args.map(e => e.value).join("");
// });
// env.set(new MalValue('pr-str'), (...args) => {
//   return args.map(e => e.value).join(" ");
// });

const createReplEnv = () => {
  Object.entries(core).forEach(([s, v]) => env.set(new MalSymbol(s), v));
}

env.set(new MalValue('not'), (arg) => not(arg));
createReplEnv();

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

