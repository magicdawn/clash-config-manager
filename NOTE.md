# Todos

- electron-store upgrade
- handle @deprecated `react-beautiful-dnd`
- electron renderer esm + vite

## deps issue

### react

```txt
chunk-H6LW2QOQ.js?v=adabc928:521 Warning: PaletteTrigger: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.
    at PaletteTrigger (http://localhost:7749/node_modules/.vite/deps/react-command-palette.js?v=2174efc0:4543:23)
```

```
Warning: Connect(Droppable): Support for defaultProps will be removed from memo components in a future major release. Use JavaScript default parameters instead.
    at div
    at Provider (http://localhost:7749/node_modules/.vite/deps/react-beautiful-dnd.js?v=a57f419f:1261:20)
    at App (http://localhost:7749/node_modules/.vite/deps/react-beautiful-dnd.js?v=a57f419f:7793:25)
    at ErrorBoundary2 (http://localhost:7749/node_modules/.vite/deps/react-beautiful-dnd.js?v=a57f419f:2290:35)
    at DragDropContext (http://localhost:7749/node_modules/.vite/deps/react-beautiful-dnd.js?v=a57f419f:7913:19)
    at div
    at ConfigDND (http://localhost:7749/src/pages/current-config/ConfigDND.tsx:34:25)
```
