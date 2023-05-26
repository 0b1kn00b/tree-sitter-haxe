const { commaSep } = require('./utils')

module.exports = {
  // Declarations
  declaration: ($) =>
    choice(
      $.class_declaration,
      $.typedef_declaration,
      $.function_declaration,
      $.variable_declaration
    ),

  class_declaration: ($) =>
    seq(
      repeat($.metadata),
      alias('class', $.keyword),
      field('name', $._lhs_expression),
      optional($.type_params),
      repeat(
        choice(
          seq(alias('extends', $.keyword), $._lhs_expression),
          seq(alias('implements', $.keyword), $._lhs_expression)
        )  
      ),
      field('body', $.block)
    ),

  typedef_declaration: ($) =>
    seq(
      repeat($.metadata),
      alias('typedef', $.keyword),
      field('name', $._lhs_expression),
      optional($.type_params),
      choice(
        seq("=", $.block),
        seq("=", $._lhs_expression)
      )
    ),

  type_param: ($) => $._lhs_expression,
  type_params: ($) =>
    prec(1,
      seq('<', repeat(seq($.type_param, ',')), $.type_param, '>')
    ),
  function_arg: ($) =>
    seq(
      field('name', $._lhs_expression),
      optional('?'),
      optional(seq(':', alias($._lhs_expression, $.type))),
      optional(seq($._assignmentOperator, $._literal))
    ),

  function_arg_list: ($) => seq('(', commaSep($.function_arg), ')'),

  function_declaration: ($) =>
    seq(
      repeat($.metadata),
      repeat($.keyword),
      alias('function', $.keyword),
      choice(
        field('name', $._lhs_expression),
        field('name', alias('new', $.identifier))
      ),
      optional($.type_params),
      $.function_arg_list,
      optional(seq(':', field('return_type', $.type))),
      field('body', $.block)
    ),
  variable_declaration: ($) =>
    seq(
      repeat($.metadata),
      repeat($.keyword),
      choice(alias('var', $.keyword), alias('final', $.keyword)),
      field('name', $._lhs_expression),
      optional(seq(':', field('type', $.type))),
      optional(seq(($._assignmentOperator, $.operator), $.expression)),
      $._semicolon
    ),
}
