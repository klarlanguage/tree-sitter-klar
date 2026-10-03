# Klar Tree-sitter Grammar 🌳🐨

A [Tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar for Klar files.

The [`grammar.js`](./grammar.js) file is designed to be a syntax reference for Klar implementations. Any discrepancy will be documented in the file.

## Development

[Bun](https://bun.com) and [tree-sitter-cli](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html#installation) are required. You can install tree-sitter-cli as a Rust crate, or as an NPM dependency (use `bun tree-sitter-cli` or `bunx tree-sitter-cli` to run).

```sh
bun install # Install dependencies
tree-sitter playground # Test parser and queries in browser
tree-sitter parse # Test parser in the terminal
tree-sitter generate # Regenerate C parser
tree-sitter init # Regenerate bindings and miscellaneous files
tree-sitter build # Compile parser to object file (use --wasm for a .wasm file)
```

## Contributing

Issues, bug reports, and discussions should be created in the [main Klar repo](https://github.com/ProCode-Software/klar).

Contributions should follow our [style guide](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#code-style) and [AI policy](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#using-ai) in the main Klar repo.

### References

- [Klar Parser](https://github.com/ProCode-Software/klar/tree/main/internal/parser)
- [Klar Lexer](https://github.com/ProCode-Software/klar/tree/main/internal/lexer)

### Formatting

All source files (excluding generated files) in your PRs should be properly formatted. Run [`oxfmt`](https://oxc.rs/docs/guide/usage/formatter.html) to format. Queries can be formatted using [`ts-query-ls format ./queries`](https://github.com/ribru17/ts_query_ls#formatter).

### Resources

For new contributors, see [Tree-sitter's documentation](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html) on how to write parsers.

#### Writing Queries

See https://tree-sitter.github.io/tree-sitter/using-parsers/queries/index.html and https://tree-sitter.github.io/tree-sitter/3-syntax-highlighting.html on how to write queries and syntax highlighting. As a tip, when writing queries, we recommend using the `tree-sitter playground` command and [ts-query-ls](https://github.com/ribru17/ts_query_ls) in your editor.

## Roadmap

- [ ] Properly parse nested block comments
- [ ] Share string/numeric literal formats with [Klon](https://github.com/klarlanguage/tree-sitter-klon)
- [ ] Set up CI for automatically generating the parser on commit
- [ ] Write tests
- [ ] Publish to NPM and crates.io

## License

[Apache-2.0](./LICENSE)
