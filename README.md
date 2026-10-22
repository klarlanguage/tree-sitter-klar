# Klar Tree-sitter Grammar 🌳🐨

A [Tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar for Klar files.

The [`grammar.js`](./grammar.js) file is designed to be a syntax reference for Klar implementations. Any discrepancy will be documented in the file.

**Status: Prototype** - Currently, we're just getting all of the syntax covered. Tests and optimizations will be done later.

## Development

[Bun](https://bun.com) is required

```sh
bun install # Install dependencies
bun tree-sitter playground # Test parser and queries in browser
bun tree-sitter parse # Test parser in the terminal
bun tree-sitter generate # Regenerate C parser
bun tree-sitter init # Regenerate bindings and miscellaneous files
bun tree-sitter build # Compile parser to object file (use --wasm for a .wasm file)
```

## Contributing

Issues, bug reports, and discussions should be created in the [main Klar repo](https://github.com/ProCode-Software/klar).

Contributions should follow our [style guide](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#code-style) and [AI policy](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#using-ai) in the main Klar repo.

### References

- [Klar Parser](https://github.com/ProCode-Software/klar/tree/main/internal/parser)
- [Klar Lexer](https://github.com/ProCode-Software/klar/tree/main/internal/lexer)

### Formatting

All source files (excluding generated files) in your PRs should be properly formatted. Run [`oxfmt`](https://oxc.rs/docs/guide/usage/formatter.html) to format. Queries can be formatted by running [`ts-query-ls format ./queries`](https://github.com/ribru17/ts_query_ls#formatter).

### Resources

For new contributors, see [Tree-sitter's documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html) on how to write parsers.

#### Writing Queries

See https://tree-sitter.github.io/tree-sitter/using-parsers/queries/index.html and https://tree-sitter.github.io/tree-sitter/3-syntax-highlighting.html on how to write queries and syntax highlighting. As a tip, when writing queries, we recommend using the `tree-sitter playground` command and the [ts-query-ls](https://github.com/ribru17/ts_query_ls) language server in your editor.

## Roadmap

- [ ] Properly parse nested block comments
- [ ] Share string/numeric literal formats with [Klon](https://github.com/klarlanguage/tree-sitter-klon)
- [ ] Set up CI for automatically generating the parser on commit
- [ ] Write tests
- [x] Publish to NPM
- [ ] Publish to crates.io
- [ ] Doc comments with Markdown injections
- [ ] Fix statement termination (newlines)
- [ ] Inject [tree-sitter-regex](https://github.com/tree-sitter/tree-sitter-regex) in regular expressions
- [ ] Handle interpolation rules (no number or comma immediately following `{`) in regular expressions

## License

[Apache-2.0](./LICENSE)
