; Generic nodes
; They are listed first so they don't override anything
(identifier) @variable

(discard) @variable

(type_alias) @type

; Punctuation
[
  ":"
  ","
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

"." @punctuation.delimiter

; Keywords
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
  (#eq? @variable.builtin "self"))

; Operators
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

(variable_declaration
  ":" @operator)

(function_param_declaration
  ":" @operator)

(field
  ":" @operator)

(enum_params_declaration
  ":" @operator)

; TODO: Also apply to other colons that are followed by types
(comment) @comment

; Literals
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

; (regex_literal (["#/", "/"]) @punctuation.bracket)
; (regex_literal content: (_) @string.regex)
; Types
(generic_type
  [
    "<"
    ">"
  ] @punctuation.bracket)

; Builtin types
; https://github.com/ProCode-Software/klar/tree/main/internal/ast/ast.go
((type_alias) @type.builtin
  (#any-of? @type.builtin "Any" "String" "Int" "Float" "Bool" "Nothing" "Result" "Error"))
(#is-not? local)

; Declarations
(struct_declaration
  name: (_) @type)

(enum_declaration
  name: (_) @type)

(tag_declaration
  name: (_) @type)

(interface_declaration
  name: (_) @type)

(function_declaration
  name: (_) @function)

(function_param_declaration
  name: (_) @variable.parameter)

(enum_item
  name: (_) @enum)

(enum_params_declaration
  name: (_) @variable.parameter)

(attribute
  name: (_) @attribute)

(attribute
  "@" @punctuation.delimiter)

; Expressions
(call_expression
  callee: [
    (identifier) @function
    (index_expression
      right: (identifier) @function)
  ])

(lambda_expression
  name: (_) @variable.parameter)

; Builtin functions
; https://github.com/ProCode-Software/klar/tree/main/internal/analysis/builtin.go
((identifier) @function.builtin
  (#any-of? @function.builtin "print" "crashout" "clone" "zip" "TODO")
  (#is-not? local))

; TODO: 'value' in a pipeline
