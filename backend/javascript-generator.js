/* eslint-disable max-len */
/* eslint-disable func-names */
/* eslint-disable no-unused-vars */
const prettyJs = require('pretty-js');
const util = require('util');

const Argument = require('../ast/argument');
const ArrayExpression = require('../ast/array-expression');
const AssignmentStatement = require('../ast/assignment-statement');
const Block = require('../ast/block');
const BooleanLiteral = require('../ast/boolean-literal');
const BinaryExpression = require('../ast/binary-expression');
const BreakStatement = require('../ast/break-statement');
const Call = require('../ast/call');
const Case = require('../ast/case');
const ClassDeclaration = require('../ast/class-declaration');
const { ClassicForLoop, SpreadForLoop } = require('../ast/loop');
const ContinueStatement = require('../ast/continue-statement');
const DefaultCase = require('../ast/default-case');
const DictExpression = require('../ast/dict-expression');
const FunctionDeclaration = require('../ast/function-declaration');
const IdentifierDeclaration = require('../ast/identifier-declaration');
const IdentifierExpression = require('../ast/identifier-expression');
const IdType = require('../ast/id-type');
const IfStatement = require('../ast/if-statement');
const KeyValueExpression = require('../ast/keyvalue-expression');
const MemberExpression = require('../ast/member-expression');
const NumericLiteral = require('../ast/numeric-literal');
const Parameter = require('../ast/parameter');
const PrimitiveType = require('../ast/primitive-type');
const PrintStatement = require('../ast/print-statement');
const Program = require('../ast/program');
const ReturnStatement = require('../ast/return-statement');
const SetExpression = require('../ast/set-expression');
const StringLiteral = require('../ast/string-literal');
const SubscriptedExpression = require('../ast/subscripted-expression');
const SwitchStatement = require('../ast/switch-statement');
const CallStatement = require('../ast/call-statement');
const TupleExpression = require('../ast/tuple-expression');
const UnaryExpression = require('../ast/unary-expression');
const VariableDeclaration = require('../ast/variable-declaration');
const VariableExpression = require('../ast/variable-expression');
const Variable = require('../ast/variable');
const WhileStatement = require('../ast/while-statement');

function makeOp(op) {
  return (
    {
      BANGENERGY: '!',
      '-': '-',
      '+': '+',
      '*': '*',
      '/': '/',
      '%': '%',
      '&&': '&&',
      '||': '||',
      '==': '===',
      '!=': '!==',
      '++': '++',
      '--': '--',
      '<': '<',
      '<=': '<=',
      '>': '>',
      '>=': '>=',
    }[op] || op
  );
}

const builtin = {
  exit([code]) {
    return `process.exit(${code})`;
  },
  length([str]) {
    return `${str}.length`;
  },
  charAt([char, index]) {
    return `${char}.charAt(${index})`;
  },
  absVal([num]) {
    return `Math.abs(${num})`;
  },
  square([num]) {
    return `Math.sqrt(${num})`;
  },
};

const jsName = (() => {
  let lastId = 0;
  const map = new Map();
  return v => {
    if (!map.has(v)) {
      map.set(v, ++lastId); // eslint-disable-line no-plusplus
    }
    return `${v}_${map.get(v)}`;
  };
})();

function generateBlock(block) {
  return block.map(s => `${s.gen()};`).join('');
}

module.exports = function (exp) {
  return prettyJs(generateBlock(exp.statements), { indent: '  ' });
};

Argument.prototype.gen = function () {
  return this.expression.gen();
};

ArrayExpression.prototype.gen = function () {
  const jsMembers = this.expressions.map(expressions => expressions.gen());
  return `[${jsMembers.join(',')}]`;
};

AssignmentStatement.prototype.gen = function () {
  const formattedIds = [];
  const sources = this.source.map(s => s.gen());
  for (let i = 0; i < this.target.length; i += 1) {
    formattedIds.push(`${this.target[i].gen()} = ${sources[i]}`);
  }
  return `${formattedIds.join(', ')}`;
};

BinaryExpression.prototype.gen = function () {
  return `(${this.left.gen()} ${makeOp(this.op)} ${this.right.gen()})`;
};

Block.prototype.gen = function () {
  if (this.statements) {
    if (Array.isArray(this.statements)) {
      const statements = this.statements.map(s => s.gen());
      if (statements.length !== 0) {
        return `${statements.join(';')};`;
      }
    }
  }
};

BooleanLiteral.prototype.gen = function () {
  if (this.value === 'trueShit') {
    return 'true';
  }
  return 'false';
};

BreakStatement.prototype.gen = function () {
  return 'break';
};

Call.prototype.gen = function () {
  const args = this.args.map(a => a.gen());
  if (this.id.builtin) {
    return builtin[this.id.id](args);
  }
  return `${jsName(this.id.id)}(${args.join(',')})`;
};

CallStatement.prototype.gen = function () {
  return this.call.gen();
};

Case.prototype.gen = function () {
  const exp = this.expression.gen();
  const body = this.body.gen();
  return `case ${exp}: ${body}`;
};

ClassDeclaration.prototype.gen = function () {
  let param = '';
  if (this.params.length) {
    console.log(`PARAM: ${util.inspect(this.params)}`);
    param = this.params.map(p => p.gen());
  }
  const dec = `class ${jsName(this.id)} (${param})`;
  return `${dec} {${this.body.gen()}}`;
};

ClassicForLoop.prototype.gen = function () {
  const i = jsName(this.initId);
  const low = this.initexpression.gen();
  const test = this.testExpression.gen().substring(1, this.testExpression.gen().length - 1); // removes parens around binary expression
  const loopControl = `for (let ${i} = ${low}; ${test}; ${jsName(this.updateid)}${this.incop})`;
  const body = this.body.gen();
  return `${loopControl} {${body}}`;
};

ContinueStatement.prototype.gen = function () {
  return 'continue';
};

DefaultCase.prototype.gen = function () {
  return `default: ${this.body.gen()}`;
};

DictExpression.prototype.gen = function () {
  const formattedKeyValues = [];
  const keyValues = this.expressions.map(kv => kv.gen());
  for (let i = 0; i < this.expressions.length; i += 1) {
    formattedKeyValues.push(keyValues[i]);
  }
  return `{ ${formattedKeyValues.join(', ')} }`;
};

FunctionDeclaration.prototype.gen = function () {
  const name = jsName(this.id);
  let asyncAddition = ' ';
  if (this.async) {
    asyncAddition = ' async ';
  }
  const params = this.params.map(p => p.gen());
  const body = this.body.gen();
  return `${asyncAddition}function ${name} (${params.join(',')}) {${body}}`;
};

IdType.prototype.gen = function () {
  // Intentionally left blank
};

IdentifierDeclaration.prototype.gen = function () {
  // Intentionally left blank
};

IdentifierExpression.prototype.gen = function () {
  if (this.ref !== undefined) {
    if (this.ref.id !== undefined) {
      if (this.ref.id.id !== undefined) {
        return jsName(this.ref.id.id);
      } else {
        return jsName(this.ref.id);
      }
    }
  }
  return jsName(this.id);
};

IfStatement.prototype.gen = function () {
  const cases = this.tests.map((test, index) => {
    const prefix = index === 0 ? 'if' : '} else if';
    return `${prefix} ${test.gen()} {${this.consequents[index].gen()}`;
  });
  const alternate = this.alternate ? `}else{${this.alternate.gen()}` : '';
  return `${cases.join('')}${alternate}}`;
};

KeyValueExpression.prototype.gen = function () {
  return `${this.key.value}: ${this.value.value}`;
};

MemberExpression.prototype.gen = function () {
  return `${this.varexp.gen()}.${jsName(this.member)}`;
};

NumericLiteral.prototype.gen = function () {
  return `${this.value}`;
};

Parameter.prototype.gen = function () {
  return jsName(this.id);
};

PrintStatement.prototype.gen = function () {
  return `console.log(${this.expression.gen()})`;
};

Program.prototype.gen = function () { };

ReturnStatement.prototype.gen = function () {
  return `return ${this.expression.gen()}`;
};

SetExpression.prototype.gen = function () {
  const jsMembers = this.expressions.map(expression => expression.gen());
  return `new Set([${jsMembers}])`;
};

StringLiteral.prototype.gen = function () {
  return `${this.value}`;
};

SpreadForLoop.prototype.gen = function () {
  const min = jsName(new Variable(false, new PrimitiveType('digitz'), 'min').id);
  const max = jsName(new Variable(false, new PrimitiveType('digitz'), 'max').id);
  const preAssign = `let ${min} = ${this.min.gen()}; let ${max} = ${this.max.gen()};`;
  const loopControl = `for (let i = ${min}; i <= ${max}; i++)`;
  let body = "";
  if (this.body) {
    body = this.body.gen();
  }
  return `${preAssign} ${loopControl} {${body}}`;
};

SubscriptedExpression.prototype.gen = function () {
  const base = this.varexp.gen();
  const subscript = this.subscript.gen();
  return `${base}[${subscript}]`;
};

SwitchStatement.prototype.gen = function () {
  let allCases = '';
  this.cases.forEach(c => {
    allCases += c.gen();
  });
  const alternate = this.alternate.gen();
  return `switch(${this.expression.gen()}) { ${allCases}${alternate}}`;
};

TupleExpression.prototype.gen = function () {
  const jsMembers = this.expressions.map(expressions => expressions.gen());
  return `[${jsMembers.join(',')}]`;
};

UnaryExpression.prototype.gen = function () {
  return `(${makeOp(this.op)} ${this.operand.gen()})`;
};

Variable.prototype.gen = function () {
  // Intentionally left blank
};

VariableDeclaration.prototype.gen = function () {
  const formattedIds = [];

  const expressions = this.expressions.map(v => v.gen());
  for (let i = 0; i < this.ids.length; i += 1) {
    if (this.expressions[0].constructor === Call) {
      if (this.expressions[0].id.builtin) {
        formattedIds.push(`${jsName(this.ids[i].id)} = ${expressions[i]}`);
      } else {
        formattedIds.push(`${jsName(this.ids[i].id)} = new ${expressions[i]}`);
      }
    } else {
      formattedIds.push(`${jsName(this.ids[i].id)} = ${expressions[i]}`);
    }
  }
  if (this.constant) {
    return `const ${formattedIds.join(', ')}`;
  }
  return `let ${formattedIds.join(', ')}`;
};

VariableExpression.prototype.gen = function () {
  // Intentionally left blank
};

WhileStatement.prototype.gen = function () {
  console.log(`BODY: ${util.inspect(this.body)}`);
  if (this.body.statements.length !== 0) {
    this.body = this.body.gen();
  } else {
    this.body = "";
  }
  return `while (${this.expression.gen()}) { ${this.body} }`;
};
