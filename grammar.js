// const types = require("./grammar-types");
const operators = require("./grammar-operators.js");
const literals = require("./grammar-literals.js");
const declarations = require("./grammar-declarations");
const keywords = require('./grammar-keywords');
const builtins = require('./grammar-builtins');

const {commaSep} = require('./utils')

const preprocessor_statement_start_tokens = ['if', 'elseif'];
const preprocessor_statement_end_tokens = ['else', 'end'];

const haxe_grammar = {
  name: 'haxe',
  word: ($) => $.identifier,
  inline: ($) => [$.statement, $.expression],
  extras: ($) => [$.comment, /[\s\uFEFF\u2060\u200B\u00A0]/],
  supertypes: ($) => [
    $.declaration,
  ],
  precedences: ($) => [
    [$._unaryOperator, $._binaryOperator],
    [$.runtime_type_check_expression, $.pair]
  ],
  conflicts: ($) => [
    [$.block, $.object],
    [$.call_expression, $._constructor_call],
    [$._rhs_expression, $.pair],
    [$._literal, $.pair],
    [$.function_declaration],
    [$.function_declaration, $.variable_declaration],
    [$._prefixUnaryOperator, $._arithmeticOperator],
    [$._prefixUnaryOperator, $._postfixUnaryOperator],
  ],
  rules: {
    module: ($) => seq(repeat($.statement)),

    // Statements
    statement: ($) =>
      // Use prec.left to favor rules that end SOONER
      // since we have optional semi, this means a semicolon ends the statement.
      prec.left(seq(
        choice(
          $.preprocessor_statement,
          $.import_statement,
          $.package_statement,
          $.declaration,
          $.expression,
          $.conditional_statement,
          $.block,
        ),
        optional($._semicolon)
      )
      ),

    preprocessor_statement: ($) =>
      prec.right(
        seq(
          '#',
          choice(
            seq(
              token.immediate(choice(...preprocessor_statement_start_tokens)),
              $.statement,
            ),
            token.immediate(choice(...preprocessor_statement_end_tokens))
          )
        )
      ),

    package_statement: ($) =>
      seq(
        alias('package', $.keyword),
        field('name', $._lhs_expression),
        $._semicolon
      ),

    import_statement: ($) => seq(
      alias('import', $.keyword),
      field('name', $._lhs_expression),
      $._semicolon
    ),

    _rhs_expression: ($) => choice(
      $._literal,
      $.identifier,
      $.member_expression,
      $.call_expression
    ),

    _unaryExpression: ($) => prec.left(1, choice(
      // unary on LHS
      seq($.operator, $._rhs_expression),
      // unary on RHS
      seq($._rhs_expression, $.operator),
    )),

    runtime_type_check_expression: ($) =>
      prec(2, seq('(', $.expression, ':', $.type, ')')),

    cast_expression: ($) =>
      choice(
        seq(alias('cast', $.keyword), $._rhs_expression),
        seq(
          alias('cast', $.keyword),
          '(',
          $._rhs_expression,
          optional(seq(',', field('type', $.type))),
          ')'
        )
      ),

    _parenthesized_expression: $ => seq(
      '(',
      repeat1(prec.left($.expression)),
      ')'
    ),

    expression: ($) => choice(
      $._unaryExpression,
      $.subscript_expression,
      $.runtime_type_check_expression,
      $.cast_expression,
      $._parenthesized_expression,
      // simple expression, or chained.
      seq(
        $._rhs_expression,
        repeat(seq($.operator, $._rhs_expression)),
      ),
    ),

    subscript_expression: $ =>
      prec.right(1,
        seq(
          $.expression,
          '[', field('index', $.expression), ']'
        )
      ),

    member_expression: ($) =>
      prec.right(
        seq(
          field('object', $.identifier),
          token('.'),
          repeat1(field('member', $._lhs_expression))
        )
      ),

    _lhs_expression: ($) => prec(1, choice($.identifier, $.member_expression)),

    builtin_type: ($) => prec.right(choice(...builtins)),
    complex_type: ($) =>
      prec.right(seq(
        $._lhs_expression,
        optional(seq('<',$.complex_type,'>'))
      )),
    type: ($) => prec.right(seq(
      choice(
        field('type_name', $.complex_type),
        field('built_in', alias($.builtin_type, $.identifier))
      ),
      optional($.type_params)
    )),

    block: ($) => seq('{', repeat($.statement), '}'),

    metadata: ($) => seq(
      choice(token('@'), token('@:')),
      field('name', $._lhs_expression),
      optional(seq('(', $.expression, ')'))
    ),

    // arg list is () with any amount of expressions followed by commas
    _arg_list: ($) => seq('(', commaSep($.expression), ')'),

    conditional_statement: ($) => prec(1,
      seq(
        field('name', $.keyword),
        field('arguments_list', $._arg_list)
      )
    ),

    _call: ($) => prec(1, seq(
      field('object', $._lhs_expression),
      optional($.type_params),
      field('arguments_list', $._arg_list)
    )),

    _constructor_call: ($) => seq(
      optional(alias('new', $.keyword)), // for constructor calls.
      $._call
    ),

    call_expression: ($) => choice($._call, $._constructor_call),

    ...operators,
    ...declarations,
    ...literals,

    comment: ($) =>
      token(
        choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))
      ),
    keyword: ($) => prec.right(choice(...keywords)),
    identifier: ($) => /[a-zA-Z_]+[a-zA-Z0-9]*/,
    // Hidden Nodes in tree.
    _semicolon: ($) => ';',
  },
};

module.exports = grammar(haxe_grammar);
