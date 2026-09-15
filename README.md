# Klar Tree-sitter Grammar 🌳🐨

A [Tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar for Klar files.

## Development

[Bun](https://bun.com) and [tree-sitter-cli](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html#installation) are required

```sh
bun install # Install dependencies
tree-sitter playground # Test parser in browser
tree-sitter parse # Test parser in the terminal
tree-sitter generate # Regenerate C parser
tree-sitter init # Regenerate bindings and miscellaneous files
tree-sitter build # Compile parser to object file (use --wasm for a .wasm file)
```

## Contributing

Issues, bug reports, and discussions should be created in the [main Klar repo](https://github.com/ProCode-Software/klar).

Contributions should follow our [style guide](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#code-style) and [AI policy](https://github.com/ProCode-Software/klar/blob/main/CONTRIBUTING.md#using-ai) in the main Klar repo.

### Formatting

All files in your PRs should be properly formatted. Run [`oxfmt`](https://oxc.rs/docs/guide/usage/formatter.html) to format.

## License

[Apache-2.0](./LICENSE)
