const readline = require('readline');
const { read_str } = require('./reader.js');
const { pr_str } = require('./printer.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const READ = str => read_str(str);
const EVAL = str => str;
const PRINT = str => pr_str(str);

const rep = str => PRINT(EVAL(READ(str)));

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

