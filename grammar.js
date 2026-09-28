/**
 * @file The progressive programming language
 * @author ProCode Software
 * @license Apache-2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/** @see https://github.com/ProCode-Software/klar/blob/main/internal/parser/binding_power.go */
const Precedence = {
    Default: 0, // Zero
    Expression: 1, // Minimum
    WhenAs: 2, // as
    ObjectPipeline: 3, // |.
    Logical: 4, // ||, &&
    WhenOption: 5, // |
    Pipeline: 6, // |>
    Relational: 7, // ==, !=, >, <, <=, >=, in, !in
    Distributive: 8, // and, or
    Range: 9, // ..., ..<
    Additive: 10, // +, -
    Multiplicative: 11, // *, /, %
    Unary: 12, // await, go, !
    Exponentiation: 13, // ^ (higher than unary: -2 ^ 3 = -(2 ^ 3))
    Call: 14, // Call: (
    Member: 15, // Index/Slice: . [
    Primary: 16, // Primary expressions (literals)
}

export default grammar({
    name: 'klar',
    supertypes: $ => [$.statement, $.expression, $.type],
    word: $ => $.identifier,
    rules: {
        source_file: $ =>
            repeat(seq(sep($.attribute, '\n'), $.top_level_statement, '\n')),
        statement_list: $ => repeat(seq($.statement, '\n')),
        block: $ => seq('{', $.statement_list, '}'),

        // Statements
        // ===========
        statement: $ =>
            choice(
                $.variable_declaration,
                $.assignment_statement,
                $.type_declaration,
                $.function_declaration,
                $.function_alias_declaration,
                $.for_statement,
                $.while_statement,
                $.return_statement,
                $.next_statement,
                $.stop_statement,
                $.expression_statement
            ),
        top_level_statement: $ =>
            alias(
                choice($.statement, $.import_statement, $.public_declaration),
                $.statement
            ),
        public_declaration: $ =>
            seq(
                'public',
                alias(
                    choice(
                        $.variable_declaration,
                        $.function_declaration,
                        $.type_declaration,
                        $.function_alias_declaration
                    ),
                    $.statement
                )
            ),
        variable_declaration: $ =>
            seq(
                commaSep1($.destructure),
                optional(seq(':', field('type', $.type))),
                ':=',
                $.expression
            ),
        type_declaration: $ =>
            choice(
                $.struct_declaration,
                $.enum_declaration,
                $.interface_declaration,
                $.tag_declaration
            ),
        struct_declaration: $ =>
            seq(
                'type',
                field('name', $.identifier_or_discard),
                optional($.inherited_types),
                '{',
                sep($.struct_field, '\n'),
                '}'
            ),
        enum_declaration: $ =>
            seq(
                'type',
                field('name', $.identifier_or_discard),
                optional($.inherited_types),
                '{',
                sep($.enum_item, choice('\n', ',')),
                '}'
            ),
        interface_declaration: $ =>
            seq(
                'type',
                '#',
                field('name', $.identifier_or_discard),
                optional($.inherited_types),
                '{',
                sep($.interface_entry, '\n'),
                '}'
            ),
        tag_declaration: $ =>
            seq(
                'type',
                '#',
                field('name', $.identifier_or_discard),
                optional($.inherited_types)
            ),
        inherited_types: $ =>
            seq(':', commaSep1(alias(choice($.identifier, $.generic_type), $.type))),
        interface_entry: $ => choice($.field, $.interface_method),
        field: $ =>
            seq(
                commaSep1(field('name', $.identifier_or_discard)),
                ':',
                field('type', $.type)
            ),
        interface_method: $ =>
            seq(
                field('name', $.identifier_or_discard),
                '(',
                // TODO: Params
                commaSep($.type),
                ')',
                optional(seq('->', field('return_type', $.type)))
            ),
        struct_field: $ => seq($.field, optional($.default_value)),
        enum_item: $ => seq('.', $.identifier, optional($.default_value)),

        function_declaration: $ =>
            seq(
                'func',
                optional($.method_self_declaration),
                field('name', $.identifier_or_discard),
                '(',
                commaSep($.function_param_declaration),
                ')',
                optional(seq('->', field('return_type', $.type))),
                optional(choice(seq('=', field('func_expr', $.expression)), $.block))
            ),
        method_self_declaration: $ =>
            seq(
                choice(
                    alias(
                        seq(
                            '(',
                            $.identifier,
                            ':',
                            field('self_type', alias($.identifier, 'type')),
                            ')'
                        ),
                        $.named_self
                    ),
                    alias(field('self_type', alias($.identifier, 'type')), $.method_self)
                ),
                '.'
            ),
        function_param_declaration: $ =>
            seq(
                // TODO: Multiple params with one type
                optional(field('label', $.identifier)),
                field('name', $.identifier_or_discard),
                ':',
                field('type', $.type),
                optional($.default_value)
            ),
        function_alias_declaration: $ =>
            seq(
                'func',
                optional(seq(alias(alias($.identifier, 'type'), $.method_self), '.')),
                $.identifier_or_discard,
                '=',
                // TODO: alias for enum_literal
                field('target', choice($.identifier, $.index_expression, $.enum_literal))
            ),
        for_statement: $ =>
            seq(
                'for',
                optional(
                    seq(
                        commaSep1(
                            seq(
                                commaSep1(field('name', $.destructure)),
                                optional(seq(':', field('type', $.type)))
                            )
                        ),
                        'in'
                    )
                ),
                field('iterator', $.expression),
                optional($.loop_label),
                $.block
            ),
        while_statement: $ =>
            seq(
                'while',
                field('condition', $.expression),
                optional($.loop_label),
                $.block
            ),
        return_statement: $ => seq('return', optional($.expression)),
        stop_statement: $ => seq('stop', optional($.loop_label)),
        next_statement: $ => seq('next', optional($.loop_label)),
        expression_statement: $ => $.expression,
        loop_label: $ => seq(':', field('label_name', $.identifier)),
        assignment_statement: $ => null,
        import_statement: $ =>
            seq(
                'import',
                field('path', sep1($.identifier, '.')),
                optional($.unqualified_imports),
                optional(seq('as', field('alias', $.identifier)))
            ),
        unqualified_imports: $ =>
            seq(
                '.{',
                commaSep1(
                    seq(
                        field('name', $.identifier),
                        optional(seq('as', field('alias', $.identifier)))
                    )
                ),
                '}'
            ),
        attribute: $ =>
            seq('@', field('name', $.identifier), field('arguments', $.call_args)),

        // Expressions
        // ===========
        expression: $ =>
            choice(
                $.identifier,
                $.string_literal,
                $.int_literal,
                $.float_literal,
                $.bool_literal,
                $.none_literal,
                $.list_literal,
                $.tuple_literal,
                $.map_literal,
                $.enum_literal,
                $.regex_literal,

                $.binary_expression,
                $.unary_expression,
                $.call_expression,
                $.index_expression,
                $.go_expression,
                $.try_expression,
                $.when_expression,
                $.pipeline_expression,
                $.object_pipeline_expression
            ),
        expression_or_rest: $ =>
            choice($.expression, alias(seq($.expression, '...'), $.rest)),
        int_literal: $ => choice($.hex_literal, $.decimal_literal, $.binary_literal),
        hex_literal: () => /0x[A-Fa-f0-9_]+/,
        binary_literal: () => /0b[0-1_]+/,
        decimal_literal: () => /[0-9_]+/,
        regex_literal: $ =>
            seq('#/', field('content', 'x'), '/', optional(field('flags', /[a-z]+/))),
        float_literal: () =>
            choice(
                /-?[0-9_]+\.[0-9_]+([eE][+-]?[0-9_]+)?/,
                /-?[0-9_]+([eE][+-]?[0-9_]+)?/
            ),
        bool_literal: () => choice('true', 'false'),
        // See https://github.com/ProCode-Software/klar/discussions/7
        none_literal: () => choice('none', 'nil'),
        list_literal: $ => seq('[', commaSep($.expression), ']'),
        tuple_literal: $ => seq('(', commaSep1($.expression), ')'),
        string_literal: () => alias(),
        when_expression: $ =>
            seq(
                'when',
                commaSep($.expression),
                '{',
                sep($.when_case, choice('\n', ',')),
                '}'
            ),
        when_case: $ =>
            // TODO: Other statements are allowed outside a block
            seq(commaSep1($.when_pattern), '->', choice($.block, $.expression)),
        when_pattern: $ => choice($.expression),
        binary_expression: $ =>
            choice(
                ...[
                    ['||', Precedence.Logical],
                    ['&&', Precedence.Logical],
                    ['in', Precedence.Relational],
                    ['!in', Precedence.Relational],
                    ['==', Precedence.Relational],
                    ['!=', Precedence.Relational],
                    ['>', Precedence.Relational],
                    ['<', Precedence.Relational],
                    ['<=', Precedence.Relational],
                    ['>=', Precedence.Relational],
                    ['and', Precedence.Distributive],
                    ['or', Precedence.Distributive],
                    ['...', Precedence.Range],
                    ['..<', Precedence.Range],
                    ['+', Precedence.Additive],
                    ['-', Precedence.Additive],
                    ['*', Precedence.Multiplicative],
                    ['/', Precedence.Multiplicative],
                    ['%', Precedence.Multiplicative],
                    ['^', Precedence.Exponentiation],
                ].map(([op, precedence]) =>
                    prec(
                        precedence,
                        seq(
                            field('left', $.expression),
                            //@ts-ignore
                            field('operator', op),
                            field('right', $.expression)
                        )
                    )
                )
            ),
        unary_expression: $ =>
            choice(
                ...['!', 'await'].map(op =>
                    prec(
                        Precedence.Unary,
                        seq(field('operator', op), field('right', $.expression))
                    )
                )
            ),
        pipeline_expression: $ =>
            sep1(choice($.expression, alias('return', $.return_statement)), '|>'),
        object_pipeline_expression: $ => null,
        go_expression: $ => prec(Precedence.Unary, seq('go', $.call_expression)),
        try_expression: $ => prec(Precedence.Unary, seq('try', $.call_expression)),
        call_expression: $ =>
            prec(
                Precedence.Call,
                seq(field('left', $.expression), field('arguments', $.call_args))
            ),
        call_args: $ => seq('(', commaSep($.call_param), ')'),
        call_param: $ =>
            choice(
                alias(
                    seq(field('label', $.identifier), ':', field('value', $.expression)),
                    $.labelled_param
                ),
                // :name, :user.name
                alias(
                    seq(
                        ':',
                        field(
                            'value',
                            alias(
                                choice(field('label', $.identifier), $.index_expression),
                                $.expression
                            )
                        )
                    ),
                    $.shorthand_labelled_param
                ),
                field('value', $.expression)
            ),
        index_expression: $ =>
            prec(
                Precedence.Member,
                seq(field('left', $.expression), '.', field('right', $.expression))
            ),
        enum_literal: $ => seq('.', $.identifier),

        // Destructuring
        // ==========
        destructure: $ =>
            choice(
                $.identifier,
                alias('_', $.discard),
                $.tuple_destructure,
                $.list_destructure
            ),
        list_destructure: $ =>
            seq('[', commaSep(choice($.destructure, $.destructure_rest)), ']'),
        tuple_destructure: $ => seq('(', commaSep1($.destructure), ')'),
        destructure_rest: $ => seq($.identifier, '...'),

        // Types
        // ===========
        type: $ =>
            choice(
                $.identifier,
                $.map_type,
                $.tuple_type,
                $.lambda_type,
                $.list_type,
                $.union_type,
                $.generic_type
            ),
        map_type: $ => seq('#{', $.type, ':', $.type, '}'),
        list_type: $ => seq('[', $.type, ']'),
        tuple_type: $ => seq('(', commaSep1($.type), ')'),
        lambda_type: $ =>
            seq(
                'func',
                '(',
                field(
                    'params',
                    commaSep(
                        seq(
                            optional(seq(commaSep1($.identifier_or_discard), ':')),
                            field('type', $.type)
                        )
                    )
                ),
                ')',
                optional(seq('->', field('return_type', $.type)))
            ),
        union_type: $ => seq(optional('|'), sep1($.type, '|')),
        generic_type: $ => seq($.type, '<', commaSep1($.type), '>'),

        identifier: () => /[\p{L}_][\p{L}\p{N}_]*/u,
        identifier_or_discard: $ => choice($.identifier, alias('_', $.identifier)),
        default_value: $ => seq('=', $.expression),
    },
})

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
    return seq(rule, repeat(seq(separator, rule)))
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)))
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
    return optional(commaSep1(rule))
}

/**
 * Creates a rule to optionally match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {ChoiceRule}
 */
function sep(rule, separator) {
    return optional(sep1(rule, separator))
}
