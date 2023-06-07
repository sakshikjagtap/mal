const readline = require('readline');
const { read_str } = require('./reader.js');
const { pr_str } = require('./printer.js');
const { MalSymbol, MalList, MalValue, MalVector, MalMap, MalNil, MalString, MalFunction, MalSequence } = require('./types.js');
const { Env } = require('./env.js');
const fs = require('fs');
const { core } = require('./core.js');
const { monitorEventLoopDelay } = require('perf_hooks');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
  return [doForms, newEnv];
}

const handleDo = (ast, env) => {
  const newAst = ast.value.slice(1);
  newAst.slice(0, -1).reduce((c, e) => EVAL(e, env), new MalNil());
  return newAst[newAst.length - 1];
}

const handleIf = (ast, env) => {
  const [, condition, trueBlock, falseBlock] = ast.value;
  const exp_result = EVAL(condition, env);
  if (exp_result && !(exp_result instanceof MalNil)) {
    return trueBlock;
  }
  return falseBlock !== undefined ? falseBlock : new MalNil();
}

const handleFn = (ast, env) => {
  const [, args, ...fnBody] = ast.value;
  const doForms = new MalList([new MalSymbol('do'), ...fnBody]);
  return new MalFunction(doForms, args, env);
}

const quasiquote = (ast) => {
  if (ast instanceof MalList &&
    ast.value.length > 0 &&
    ast.value[0].value === 'unquote') {
    return ast.value[1];
  }

  if (ast instanceof MalSequence) {
    let result = new MalList([]);
    for (let index = ast.value.length - 1; index >= 0; index--) {
      const element = ast.value[index];

      if (element instanceof MalList &&
        element.value.length > 0 &&
        element.value[0].value === "splice-unquote") {
        result = new MalList([new MalSymbol('concat'), element.value[1], result]);
      } else {
        result = new MalList([new MalSymbol('cons'), quasiquote(element), result]);
      }
    }

    if (ast instanceof MalVector) {
      return new MalList([new MalSymbol('vec'), result]);
    }

    return result;
  }

  if (ast instanceof MalSymbol) {
    return new MalList([new MalSymbol('quote'), ast]);
  }

  return ast
}

const READ = str => read_str(str);
const EVAL = (ast, env) => {
  while (true) {
    if (!(ast instanceof MalList)) {
      return eval_ast(ast, env);
    }

    if (ast.isEmpty()) return ast;

    switch (ast.value[0].value) {
      case 'def!':
        return handleDef(ast, env);
      case 'let*':
        [ast, env] = handleLet(ast, env);
        break;
      case 'do':
        ast = handleDo(ast, env);
        break;
      case 'if':
        ast = handleIf(ast, env);
        break;
      case 'fn*':
        ast = handleFn(ast, env);
        break;
      case 'quote':
        return ast.value[1];
      case 'quasiquoteexpand':
        return quasiquote(ast.value[1]);
      case 'quasiquote':
        ast = quasiquote(ast.value[1]);
        break;
      default:
        const [fn, ...args] = eval_ast(ast, env).value;
        if (fn instanceof MalFunction) {
          const binds = fn.binds;
          const oldEnv = fn.env;
          env = new Env(oldEnv, binds.value, args);
          ast = fn.value;
        } else {
          return fn.apply(null, args);
        }
    }
  }

};

const PRINT = str => pr_str(str);

const env = new Env();

const not = (arg) => {
  if (arg.value === 0) return false;
  if (arg instanceof MalNil) return true;
  return !(EVAL(arg, env))
}

env.set(new MalValue('not'), (arg) => not(arg));

const createReplEnv = () => {
  Object.entries(core).forEach(([s, v]) => env.set(new MalSymbol(s), v));
  env.set(new MalValue('eval'), (ast) => EVAL(ast, env));
}

createReplEnv();

const rep = str => PRINT(EVAL(READ(str), env));

rep('(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil) ")))))')

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

