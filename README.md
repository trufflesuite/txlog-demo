# txlog-demo

This repository serves to provide a fairly basic demonstration of running
@truffle/debugger against a transaction and reading the corresponding txlog.

## Usage

1. First clone this repository and install its dependencies:

   ```console
   git clone git@github.com:trufflesuite/txlog-demo.git
   cd txlog-demo
   yarn
   ```

2. Then, run `ts-node`:

   ```console
   npx ts-node
   ```
   
3. Inside ts-node, import the provided behavior:

   ```typescript
   import { getTxlog, emittedFlattedEvents, printFlattedEvents } from "./src";
   ```

4. Invoke `getTxlog` and capture the result to a variable. Listed here are the
   provided default values, but you will likely want to override these:
   
   ```typescript
   const txlog = await getTxlog({
     txHash: "0x2c86c8ab611b7fcfeb1849aa0ab5ddbb61a357941b8d31c605fb02fdd6c61bb4",
     rpcUrl: process.env.MAINNET_URL,
     etherscanKey: process.env.ETHERSCAN_KEY
   });
   ```
   
   This step runs @truffle/fetch-and-compile to obtain verified sources on
   Etherscan, invokes solc, and runs the debugger to the end.
   **This may take a while and/or may produce warnings during compilation.**

5. Use `emittedFlattedEvents` to see only those events that were actually
   emitted (i.e., not part of a reverted call):
   
   ```typescript
   emittedFlattedEvents(txlog);
   ```
6. Use `printFlattedEvents()` to produce a human-friendly display of the
   events emitted as part of the transaction:
   
   ```typescript
   printFlattedEvents(txlog);
   ```

<details>
   <summary>See example usage with output</summary>
   <img width="703" alt="Screen Shot 2022-09-08 at 6 27 23 PM" src="https://user-images.githubusercontent.com/151065/189236995-3888541b-aa8c-4e54-9ce5-f41ee5d1613a.png">
</details>
