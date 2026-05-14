# :satellite: Sho'ma

The new League client. Except it's on your phone.

Sho'ma is a spiritual successor to [Mimic](https://github.com/molenzwiebel/Mimic) — a complete reimagining of the remote League of Legends client experience. While the original Mimic pioneered the concept, Sho'ma is built on entirely different foundations: every line of code, every architectural decision, and every technology choice has been rethought from the ground up to create a faster, more secure, and more reliable experience. It allows you to go through the game setup flow (from lobby until the end of champ select) from the safety of your toilet seat.

This repository contains the source code for Sho'ma. [Looking for the page with features and downloads instead?](https://shoma.lol)

## Developing Sho'ma

Sho'ma is composed of three different components: **Loom**, **Conduit** and **Leyline**. Please read the appropriate READMEs in the subdirectories for information on how to develop for the platform.

- [**Loom**](/loom) is the mobile-first web user interface. Built with React 19, TanStack Router, and Tailwind CSS v4.

- [**Conduit**](/conduit) is the cross-platform desktop bridge. Written in Rust with Tauri v2, it connects to the League Client (LCU) and securely relays traffic to your phone.

- [**Leyline**](/leyline) is the relay + registration backend. Built with Elysia, Bun, and Effect-TS, it brokers encrypted connections between Loom and Conduit without ever inspecting plaintext game data.

### Quick start

```bash
# Install dependencies
pnpm install

# Run everything in parallel
pnpm run dev:loom    # mobile UI on :5176
pnpm run dev:leyline # relay server on :51001
```

### Other useful commands

```bash
pnpm run build          # build all workspaces
pnpm run test           # run tests across all workspaces
pnpm run lint           # lint all source code
pnpm run fmt            # format with oxfmt
pnpm run typecheck      # TypeScript type check
pnpm run doctor:react   # React diagnostics
```

### Agent commands

> 🤖 These commands are for AI agents working on the codebase.

```bash
# Update agent knowledge base after structural changes
pnpm run agents:update  # regenerates AGENTS.md files from source
```

## Acknowledgments

- **Thijs Molendijk** ([@molenzwiebel](https://github.com/molenzwiebel)) — for creating the original [Mimic](https://github.com/molenzwiebel/Mimic) project that proved remote League client control was possible, and whose architectural ideas continue to inspire Sho'ma's design.
- **Querijn Heijmans** ([@Querijn](https://github.com/Querijn)) — for the invaluable [League Client API documentation](https://github.com/Querijn/LeagueClientUxModels) and reverse-engineering work that made LCU integration feasible for the entire ecosystem.
- **AlsoSylv** ([@AlsoSylv](https://github.com/AlsoSylv)) — for [Irelia](https://github.com/AlsoSylv/Irelia), the Rust LCU client wrapper that powers Conduit's desktop bridge.
- **dysolix** ([@dysolix](https://github.com/dysolix)) — for [Hasagi](https://github.com/dysolix/hasagi-core) and [`@hasagi/types`](https://github.com/dysolix/hasagi-types), which provide the auto-generated TypeScript types and client bindings for the LCU API.
- **WJZ-P** ([@WJZ-P](https://github.com/WJZ-P)) — for [Sona](https://github.com/WJZ-P/sona); we integrated and adapted several of its patterns including the asset resolver, fuzzy search, LCU normalizers, and deduped-query store pattern.
- **CommunityDragon** ([@CommunityDragon](https://github.com/communitydragon)) — for maintaining the community-driven [CDTB](https://github.com/communitydragon/CDTB) and [CDN services](https://communitydragon.org), which provide essential League of Legends static data and assets used throughout the ecosystem.
- **Riot Games** — for the League Client Update (LCU) API that powers this entire ecosystem of third-party tools.
- All open-source maintainers behind React, Vite, TanStack, Tauri, Elysia, Effect-TS, Tailwind CSS, and Bun — this project stands on the shoulders of giants.

## License

Sho'ma and all of its components are released under the [MIT](https://github.com/JosueGalRe/shoma/blob/master/LICENSE) license. Feel free to browse through the code as you like, and if you end up making any improvements or changes, please do not hesitate to make a pull request. :)
