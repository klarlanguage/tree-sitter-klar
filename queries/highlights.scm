; Generic nodes
; They are listed first so they don't override anything
; ========
(identifier) @variable

((identifier) @constant
  (#match? @constant "^\\p{Lu}[\\p{Lu}\\p{N}_]*$"))

(discard) @variable

(type_alias) @type

; Punctuation
; ========
[
  ":"
  ","
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  "#{"
] @punctuation.bracket

; Keywords
; ========
[
  "and"
  "as"
  "await"
  "for"
  "func"
  "go"
  "import"
  "if"
  "in"
  "next"
  "or"
  "public"
  "readonly"
  "return"
  "stop"
  "try"
  "type"
  "when"
  "while"
] @keyword

; 'self'
((identifier) @variable.builtin
  (#eq? @variable.builtin "self")
  (#is-not? local))

; Operators
; ========
[
  "..."
  "..<"
  ":="
  "+="
  "-="
  "*="
  "/="
  "%="
  "^="
  "=="
  "!="
  ">="
  "<="
  "||"
  "&&"
  "->"
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "^"
  "!"
  "!!"
  ">"
  "<"
  "|"
  "?"
  "|>"
  "|."
] @operator

; Highlight colons as operators when used in type contexts
(variable_declaration
  ":" @operator)

(function_param_declaration
  ":" @operator)

(field_declaration
  ":" @operator)

(type_pair_list
  ":" @operator)

(named_self
  ":" @operator)

; TODO: Also apply to other colons that are followed by types
(comment) @comment

; Literals
; ========
(discard) @keyword ; TODO: Don't know what this should be (keyword or variable?)

[
  (int_literal)
  (float_literal)
] @number

(string_literal) @string

(string_escape) @string.escape

[
  "true"
  "false"
  "none"
  "nil"
] @constant.builtin

(enum_literal
  (identifier) @enum)

(regex_literal
  [
    "#/"
    "/"
  ] @punctuation.bracket)

(regex_literal
  content: _ @string.regex)

(regex_literal
  flags: _ @keyword)

; Types
; ========
; Angle brackets are punctuation when being used in generics
(generic_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

(generic_types_declaration
  [
    "<"
    ">"
  ] @punctuation.bracket)

(lambda_type
  params: (_
    label: _ @variable.parameter))

; Builtin types
; https://github.com/ProCode-Software/klar/tree/main/internal/ast/ast.go
((type_alias) @type.builtin
  (#any-of? @type.builtin "Any" "String" "Int" "Float" "Bool" "Nothing" "Result" "Error")
  (#is-not? local))

; Declarations
; ========
(struct_declaration
  name: (_) @type)

(enum_declaration
  name: (_) @type)

(tag_declaration
  name: (_) @type)

(interface_declaration
  name: (_) @type)

(interface_method_declaration
  param_label: (_) @property)

(function_declaration
  name: (_) @function)

(function_param_declaration
  name: (_) @variable.parameter)

(function_param_declaration
  label: (_) @property)

(enum_item_declaration
  name: (_) @enum)

(enum_item_declaration
  params: (_
    label: (_) @property))

(attribute
  name: (_) @attribute)

(attribute
  "@" @punctuation.delimiter)

; Expressions
; ========
(call_expression
  callee: [
    (identifier) @function
    (index_expression
      right: (identifier) @function)
  ])

; Initializer
(call_expression
  callee: [
    ((identifier) @type
      (#match? @type "^_?\\p{Lu}"))
    (index_expression
      left: (identifier) @namespace
      right: ((identifier) @type
        (#match? @type "^_?\\p{Lu}")))
  ])

; Builtin functions
; https://github.com/ProCode-Software/klar/tree/main/internal/analysis/builtin.go
((identifier) @function.builtin
  (#any-of? @function.builtin "print" "crashout" "clone" "zip" "TODO")
  (#is-not? local))

(lambda_expression
  name: (_) @variable.parameter)

(call_param
  label: (identifier) @property)

; TODO: 'value' in a pipeline
