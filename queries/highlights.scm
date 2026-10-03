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

(comment) @comment

[
  (int_literal)
  (float_literal)
] @number

(string_literal) @string

(call_expression
    callee:
    [
    (identifier) @function
    (index_expression right: (identifier) @function)])

    (identifier) @variable

    ["true" "false" "none" "nil"] @constant.builtin

(type_alias) @type