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

    DefaultType: 2,
    VariadicType: 3, // ...
    OptionalType: 4, // ?
    UnionType: 5, // |
    GenericType: 6, // <
    NamespaceType: 7, // .
    PrimaryType: 8, // Names
}

let stringEscape

export default grammar({
    name: 'klar',
    supertypes: $ => [$.statement, $.expression, $.type],
    word: $ => $.identifier,
    extras: $ => [/\s/, $.comment],
    reserved: {
        // See
        // https://github.com/ProCode-Software/klar/blob/main/internal/lexer/token_types.go
        // (ReservedIdent)
        _: () => [
            'and',
            'as',
            'await',
            'true',
            'false',
            'for',
            'func',
            'go',
            'import',
            'if',
            'in',
            'next',
            'nil',
            'none',
            'or',
            'public',
            'readonly',
            'return',
            'stop',
            'try',
            'type',
            'when',
            'while',
            '_',
        ],
        fields: () => ['_'], // No reserved keywords for fields except discard
    },
    conflicts: $ => [
        // TODO: These conflicts are horrible. Investigate how to reduce these
        // and check if everything is
        [$.expression, $.destructure],
        [$.expression, $.destructure_rest],
        [$.method_self_declaration, $.function_alias_declaration],
        [$.parenthesized_expression, $.tuple_literal],
        [$.variable_declaration, $.assignment_statement],
        [$._for_variables_declaration],
        [$.union_type],
        [$.range_expression],
        [$.type_alias, $._identifier_or_discard],
        [$.expression, $.destructure, $.type_alias],
        [$.expression, $.type_alias],
        [$.expression, $.type_alias, $._identifier_or_discard],
        // Lambda expressions create a whole lot of conflicts
        [$.lambda_expression, $.tuple_destructure],
        [$.destructure, $.type_alias, $._identifier_or_discard, $.expression],
        [$.destructure, $.type_alias, $._identifier_or_discard],
        [$.destructure, $._identifier_or_discard],
        [$.destructure, $.type_alias],
        [$.lambda_expression],
        [$.attribute],
        [$.assignment_statement, $.expression],
        [$.named_self, $.destructure],
    ],
    rules: {
        source_file: $ =>
            repeat(seq(sep($.attribute, '\n'), $.top_level_statement, '\n')),
        block: $ => seq('{', sep($.statement, '\n', true), '}'),

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
            choice($.statement, $.import_statement, $.public_declaration),
        public_declaration: $ =>
            seq(
                'public',
                choice(
                    $.variable_declaration,
                    $.function_declaration,
                    $.type_declaration,
                    $.function_alias_declaration
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
                $.tag_declaration,
                $.type_alias_declaration
            ),
        type_alias_declaration: $ =>
            seq('type', field('name', $._identifier_or_discard), '=', $.type),
        struct_declaration: $ =>
            seq(
                'type',
                field('name', $._identifier_or_discard),
                optional(field('type_params', $.generic_types_declaration)),
                optional(field('inherited_types', $.inherited_types)),
                '{',
                sep($.struct_field_declaration, '\n', true),
                '}'
            ),
        enum_declaration: $ =>
            seq(
                'type',
                field('name', $._identifier_or_discard),
                optional(field('type_params', $.generic_types_declaration)),
                optional(field('inherited_types', $.inherited_types)),
                '{',
                sep1($.enum_item_declaration, choice('\n', ','), true),
                '}'
            ),
        interface_declaration: $ =>
            seq(
                'type',
                '#',
                field('name', $._identifier_or_discard),
                optional(field('type_params', $.generic_types_declaration)),
                optional(field('inherited_types', $.inherited_types)),
                '{',
                sep($.interface_entry, '\n', true),
                '}'
            ),
        tag_declaration: $ =>
            seq(
                'type',
                '#',
                field('name', $._identifier_or_discard),
                optional(field('inherited_types', $.inherited_types))
            ),
        inherited_types: $ => seq(':', commaSep1(choice($.identifier, $.generic_type))),
        generic_types_declaration: $ =>
            seq('<', commaSep1(choice($.type_alias, $.generic_type), true), '>'),
        interface_entry: $ => choice($.field_declaration, $.interface_method_declaration),
        field_declaration: $ =>
            seq(
                commaSep1(field('name', $._map_identifier_or_discard)),
                ':',
                field('type', $.type)
            ),
        interface_method_declaration: $ =>
            seq(
                field('name', $._map_identifier_or_discard),
                optional(field('type_params', $.generic_types_declaration)),
                '(',
                alias(
                    commaSep(
                        seq(
                            optional(
                                seq(
                                    optional(
                                        field(
                                            'param_label',
                                            reserved('fields', $.identifier)
                                        )
                                    ),
                                    field('param_name', $._identifier_or_discard),
                                    ':'
                                )
                            ),
                            $.type
                        ),
                        true
                    ),
                    $.type_pair_list
                ),
                ')',
                optional(seq('->', field('return_type', $.type)))
            ),
        struct_field_declaration: $ =>
            seq(optional('readonly'), $.field_declaration, optional($.default_value)),
        enum_item_declaration: $ =>
            seq(
                '.',
                reserved('fields', field('name', $.identifier)),
                optional(
                    field('params', seq('(', optional($._maybe_label_and_type_list), ')'))
                ),
                optional($.default_value)
            ),

        function_declaration: $ =>
            seq(
                'func',
                optional($.method_self_declaration),
                field('name', $._identifier_or_discard),
                optional(field('type_params', $.generic_types_declaration)),
                '(',
                commaSep($.function_param_declaration, true),
                ')',
                optional(seq('->', field('return_type', $.type))),
                optional(choice(seq('=', field('func_expr', $.expression)), $.block))
            ),
        method_self_declaration: $ =>
            seq(choice($.named_self, field('self_type', $.type_alias)), '.'),
        named_self: $ =>
            seq(
                '(',
                field('self_name', $.identifier),
                ':',
                field('self_type', $.type_alias),
                ')'
            ),
        function_param_declaration: $ =>
            seq(
                commaSep1(
                    seq(
                        optional(field('label', reserved('fields', $.identifier))),
                        field('name', $._identifier_or_discard)
                    )
                ),
                ':',
                field('type', $.type_or_rest),
                optional($.default_value)
            ),
        function_alias_declaration: $ =>
            seq(
                'func',
                optional(seq(alias($.type_alias, $.method_self), '.')),
                $._identifier_or_discard,
                '=',
                // TODO: alias for enum_literal
                field('target', choice($.identifier, $.index_expression, $.enum_literal))
            ),
        for_statement: $ =>
            seq('for', $._for_variables_declaration, optional($.loop_label), $.block),
        _for_variables_declaration: $ =>
            seq(
                optional(
                    seq(
                        field(
                            'variables',
                            commaSep1(
                                seq(
                                    commaSep1(field('name', $.destructure)),
                                    optional(seq(':', field('type', $.type)))
                                )
                            )
                        ),
                        'in'
                    )
                ),
                field('iterator', $.expression)
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
        assignment_statement: $ =>
            seq(
                field(
                    'left',
                    commaSep1(
                        choice(
                            $.destructure,
                            $.index_expression,
                            $.computed_index_expression,
                            $.slice_expression
                        )
                    )
                ),
                field('operator', choice('=', '+=', '-=', '*=', '/=', '%=', '^=')),
                field('right', $.expression)
            ),
        import_statement: $ =>
            seq(
                'import',
                field('path', sep1($.identifier, '.')),
                optional(choice($.unqualified_imports, seq('.', '*'))),
                optional(seq('as', field('alias', $.identifier)))
            ),
        unqualified_imports: $ =>
            seq(
                '.',
                '{',
                sep1(
                    seq(
                        field('name', $.identifier),
                        optional(seq('as', field('alias', $.identifier)))
                    ),
                    choice(',', '\n')
                ),
                '}'
            ),
        attribute: $ =>
            seq(
                '@',
                field('name', $.identifier),
                field('arguments', optional($.call_params))
            ),

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
                $.computed_index_expression,
                $.slice_expression,
                $.go_expression,
                $.try_expression,
                $.when_expression,
                $.pipeline_expression,
                $.object_pipeline_expression,
                $.range_expression,
                $.parenthesized_expression,
                $.for_expression,
                $.assertion_expression,
                $.dot_init_expression,
                $.list_cast_expression,
                $.map_cast_expression,
                $.lambda_expression
            ),
        expression_or_rest: $ => choice($.expression, $.rest),
        rest: $ => prec(Precedence.Range, seq($.expression, '...')),
        int_literal: $ => choice($.hex_literal, $.decimal_literal, $.binary_literal),
        // In Klar, '_' can only be used between 2 digits ('2_', '_2', and '2__4' aren't allowed)
        hex_literal: () => /0x[A-Fa-f0-9_]+/,
        binary_literal: () => /0b[0-1_]+/,
        decimal_literal: () => /[0-9](?:[0-9_]*[0-9])?/,
        float_literal: () =>
            choice(/[0-9_]+\.[0-9_]+([eE][+-]?[0-9_]+)?/, /[0-9_]+[eE][+-]?[0-9_]+/),
        regex_literal: $ =>
            seq(
                '#/',
                field('content', repeat($._regex_fragment)),
                token.immediate('/'),
                token.immediate(optional(field('flags', /[a-z]+/)))
            ),
        _regex_fragment: $ =>
            choice(
                $.regex_text_fragment,
                alias($.string_interpolation, $.regex_interpolation)
            ),
        // Braces are used for regex interpolations, similar to strings, with the
        // added rule that '{' may not be immediately followed by a number or comma.
        // Those are parsed as regex quantifiers.
        regex_text_fragment: () =>
            token.immediate(prec(1, choice('\\{', '\\/', /\{[\d,]/, /[^/{]+/))),
        bool_literal: () => choice('true', 'false'),
        // See https://github.com/ProCode-Software/klar/discussions/7
        none_literal: () => choice('none', 'nil'),
        list_literal: $ => seq('[', commaSep($.expression, true), ']'),
        tuple_literal: $ => seq('(', commaSep1($.expression, true), ')'),
        parenthesized_expression: $ => seq('(', $.expression, ')'),
        enum_literal: $ => seq('.', $.identifier),

        // I just want to keep this definition close to where it's used
        ...((stringEscape =
            // See https://github.com/ProCode-Software/klar/tree/main/internal/lexer/string.go
            /** @param {any} $ @param {string[]} extraChars */
            ($, ...extraChars) =>
                token.immediate(
                    seq(
                        '\\',
                        choice(
                            alias(
                                new RegExp(`[\\\\befnrt${extraChars.join('')}]`),
                                $.character_escape
                            ),
                            alias(/x[0-9A-Fa-f]/, $.hex_escape),
                            alias(/u\{[0-9A-Fa-f]{2,6}\}/, $.unicode_escape)
                        )
                    )
                )),
        {}),
        // See https://github.com/ProCode-Software/klar/discussions/1
        string_literal: $ =>
            choice($.single_quoted_string, $.double_quoted_string, $.backquoted_string),
        single_quoted_string: $ =>
            seq("'", repeat($._single_quoted_string_fragment), "'"),
        double_quoted_string: $ =>
            seq('"', repeat($._double_quoted_string_fragment), '"'),
        backquoted_string: $ =>
            seq(
                '`',
                alias(token.immediate(prec(1, /[^`]+/)), $.string_text_fragment),
                '`'
            ),
        _single_quoted_string_fragment: $ =>
            choice(
                alias(token.immediate(prec(1, /[^\n'\\]+/)), $.string_text_fragment),
                alias(stringEscape($, "'"), $.string_escape)
            ),
        _double_quoted_string_fragment: $ =>
            choice(
                alias(token.immediate(prec(1, /[^{"\\]+/)), $.string_text_fragment),
                $.string_interpolation,
                alias(stringEscape($, '"', '{'), $.string_escape)
            ),
        string_interpolation: $ => seq('{', $.expression, '}'),

        map_literal: $ => seq('#{', sep($.map_entry, choice(',', '\n')), '}'),
        map_entry: $ =>
            seq(field('key', commaSep1($.expression)), ':', field('value', $.expression)),
        when_expression: $ =>
            seq(
                'when',
                commaSep($.expression),
                '{',
                sep($.when_case, choice('\n', ','), true),
                '}'
            ),
        when_case: $ =>
            // TODO: Other statements are allowed outside a block
            seq(
                commaSep1($.when_pattern_set),
                optional(seq('if', $.expression)),
                '->',
                choice(
                    $.block,
                    $.expression,
                    // Some statements don't have to be in braces. See parseWhenCase() in
                    // https://github.com/ProCode-Software/klar/tree/main/internal/parser/when.go
                    $.assignment_statement,
                    $.return_statement,
                    $.next_statement,
                    $.stop_statement
                )
            ),
        when_pattern_set: $ =>
            prec.left(0, seq(optional('|'), sep1($.when_pattern, '|'))),
        // TODO. This include string pattern matching using '...'
        when_pattern: $ => choice($.expression, $.destructure),
        binary_expression: $ =>
            choice(
                ...[
                    ['||', Precedence.Logical],
                    ['&&', Precedence.Logical],
                    ['in', Precedence.Relational],
                    ['!in', Precedence.Relational],
                    // TODO: Should comparison operators be moved to a separate type of expression?
                    ['==', Precedence.Relational],
                    ['!=', Precedence.Relational],
                    ['>', Precedence.Relational],
                    ['<', Precedence.Relational],
                    ['<=', Precedence.Relational],
                    ['>=', Precedence.Relational],
                    ['and', Precedence.Distributive],
                    ['or', Precedence.Distributive],
                    ['+', Precedence.Additive],
                    ['-', Precedence.Additive],
                    ['*', Precedence.Multiplicative],
                    ['/', Precedence.Multiplicative],
                    ['%', Precedence.Multiplicative],
                    ['^', Precedence.Exponentiation],
                ].map(([op, precedence]) =>
                    prec.left(
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
                ...['!', 'await', '-'].map(op =>
                    prec.left(
                        Precedence.Unary,
                        seq(field('operator', op), field('right', $.expression))
                    )
                )
            ),
        pipeline_expression: $ =>
            prec.left(
                Precedence.Pipeline,
                seq(
                    $.expression,
                    repeat1(
                        seq(
                            '|>',
                            choice($.expression, alias('return', $.return_statement))
                        )
                    )
                )
            ),
        object_pipeline_expression: $ =>
            prec.left(
                Precedence.ObjectPipeline,
                seq(
                    $.expression,
                    repeat1(
                        prec.left(
                            Precedence.ObjectPipeline,
                            seq(
                                '|.',
                                choice(
                                    $.call_expression,
                                    $.try_expression,
                                    $.go_expression,
                                    $.assignment_statement
                                )
                            )
                        )
                    )
                )
            ),
        go_expression: $ => prec.left(Precedence.Unary, seq('go', $.call_expression)),
        try_expression: $ =>
            prec.left(
                Precedence.Unary,
                seq(
                    'try',
                    choice(
                        $.call_expression,
                        $.map_cast_expression,
                        $.list_cast_expression
                    )
                )
            ),
        call_expression: $ =>
            prec(
                Precedence.Call,
                seq(field('callee', $.expression), field('arguments', $.call_params))
            ),
        call_params: $ => seq('(', commaSep($.call_param, true), ')'),
        call_param: $ =>
            choice(
                seq(
                    field('label', reserved('fields', $.identifier)),
                    ':',
                    field('value', $.expression)
                ),
                // :name, :user.name
                seq(
                    ':',
                    field(
                        'value',
                        field('label', choice($.identifier, $.index_expression))
                    )
                ),
                field('value', $.expression)
            ),
        index_expression: $ =>
            prec.left(
                Precedence.Member,
                seq(
                    field('left', $.expression),
                    '.',
                    field('right', reserved('fields', $.identifier))
                )
            ),
        computed_index_expression: $ =>
            prec(Precedence.Member, seq($.expression, '[', $.expression, ']')),
        slice_expression: $ =>
            prec(
                Precedence.Member,
                seq(
                    $.expression,
                    '[',
                    prec(
                        Precedence.Range,
                        seq(
                            // x...y, x..<y, ...y, x..., ..<y
                            choice(
                                seq(
                                    field('start', $.expression),
                                    choice('...', '..<'),
                                    field('end', $.expression)
                                ),
                                seq(field('start', $.expression), '...'),
                                seq(choice('...', '..<'), field('end', $.expression))
                            )
                        )
                    ),
                    ']'
                )
            ),
        range_expression: $ =>
            prec.left(
                Precedence.Range,
                seq(
                    field('start', $.expression),
                    choice('...', '..<'),
                    field('end', $.expression),
                    optional(seq('...', field('step', $.expression)))
                )
            ),
        for_expression: $ => seq('for', $._for_variables_declaration, '->', $.expression),
        assertion_expression: $ => prec.left(Precedence.Unary, seq($.expression, '!!')),

        // Destructuring
        // ==========
        destructure: $ =>
            choice(
                $.identifier,
                alias('_', $.discard),
                $.tuple_destructure,
                $.list_destructure
            ), // TODO: Map/object destructure once decided in Klar
        list_destructure: $ =>
            seq('[', commaSep1(choice($.destructure, $.destructure_rest), true), ']'),
        tuple_destructure: $ =>
            seq('(', commaSep1(choice($.destructure, $.destructure_rest), true), ')'),
        destructure_rest: $ => seq($.identifier, '...'),
        // TODO: If the Klar lexer makes '.(' a single token, update this
        dot_init_expression: $ => seq('.', $.call_params),
        list_cast_expression: $ => seq($.list_type, $.call_params),
        map_cast_expression: $ => seq($.map_type, $.call_params),
        lambda_expression: $ =>
            seq(
                'func',
                optional(
                    choice(
                        commaSep1(field('name', $.destructure)),
                        seq(
                            '(',
                            commaSep(
                                seq(
                                    commaSep1(field('name', $.destructure)),
                                    optional(seq(':', $.type)),
                                    optional($.default_value)
                                ),
                                true
                            ),
                            ')'
                        )
                    )
                ),
                choice($.block, seq('->', $.expression))
            ),

        // Types
        // ===========
        type: $ =>
            choice(
                $.type_alias,
                $.generic_type,
                $.optional_type,
                $.union_type,
                $.list_type,
                $.map_type,
                $.tuple_type,
                $.lambda_type
            ),
        type_or_rest: $ => choice(seq('...', $.type), $.type),
        map_type: $ => seq('#{', field('key', $.type), ':', field('value', $.type), '}'),
        list_type: $ => seq('[', field('item_type', $.type), ']'),
        tuple_type: $ => seq('(', $._maybe_label_and_type_list, ')'),
        lambda_type: $ =>
            seq(
                'func',
                '(',
                field('params', optional($._maybe_label_and_type_list)),
                ')',
                optional(seq('->', field('return_type', $.type)))
            ),
        union_type: $ =>
            prec.left(
                Precedence.UnionType,
                seq(optional('|'), $.type, repeat1(seq('|', $.type)))
            ),
        generic_type: $ =>
            prec(Precedence.GenericType, seq($.type, '<', commaSep1($.type, true), '>')),
        optional_type: $ => prec(Precedence.OptionalType, seq($.type, '?')),
        type_alias: $ => alias($.identifier, $.type_alias),

        identifier: () => /[\p{L}_][\p{L}\p{N}_]*/u,
        _identifier_or_discard: $ => choice($.identifier, alias('_', $.identifier)),
        _map_identifier_or_discard: $ =>
            choice(reserved('fields', $.identifier), alias('_', $.identifier)),
        default_value: $ => seq('=', $.expression),
        // TODO: Create reusable rules for name-type lists
        // Types of parameter lists
        // 1. Destructure + optional type: for loop
        // 2. Optional label + name + type + optional default: Function
        // 3. Destructure + optional type + optional default: Lambda
        // 4. Optional name + type: Enum, lambda type, tuple type
        // 5. Optional label + optional name + type: Interface method
        // 6. Label + type: String interpolation pattern
        _maybe_label_and_type_list: $ =>
            // TODO: alias $.type_pair_list
            commaSep1(
                seq(
                    optional(
                        seq(commaSep1(field('label', $._identifier_or_discard)), ':')
                    ),
                    field('type', $.type_or_rest)
                ),
                true
            ),

        // TODO: Nested block comments. I can't recursively use a $.block_comment rule
        // as it makes $.comment a nonterminal rule. We may have to use an external
        // scanner.
        //
        // See:
        // - https://github.com/tlaplus-community/tree-sitter-tlaplus/pull/16
        // - https://github.com/tree-sitter/tree-sitter-rust/blob/master/src/scanner.c#L335
        //
        comment: () =>
            token(choice(seq('//', /.*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),
    },
})

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 * @param {boolean} allowTrailing
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator, allowTrailing = false) {
    return seq(
        rule,
        repeat(seq(separator, rule)),
        ...(allowTrailing ? [optional(separator)] : [])
    )
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 * @param {boolean} allowTrailing
 *
 * @returns {SeqRule}
 */
function commaSep1(rule, allowTrailing = false) {
    return seq(rule, repeat(seq(',', rule)), ...(allowTrailing ? [optional(',')] : []))
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 * @param {boolean} allowTrailing
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule, allowTrailing = false) {
    return optional(commaSep1(rule, allowTrailing))
}

/**
 * Creates a rule to optionally match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 * @param {RuleOrLiteral} separator
 * @param {boolean} allowTrailing
 *
 * @returns {ChoiceRule}
 */
function sep(rule, separator, allowTrailing = false) {
    return optional(sep1(rule, separator, allowTrailing))
}
