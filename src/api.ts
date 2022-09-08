import util from "util";
import Web3 from "web3";
import * as Codec from "@truffle/codec";
import { fetchAndCompileForDebugger } from "@truffle/fetch-and-compile";
import type * as Txlog from "./txlog";

const Debugger = require("@truffle/debugger");
const { selectors } = Debugger;

export interface GetTxlogOptions {
  txHash?: string;
  rpcUrl?: string;
  etherscanKey?: string;
}

export async function getTxlog({
  txHash = "0x2c86c8ab611b7fcfeb1849aa0ab5ddbb61a357941b8d31c605fb02fdd6c61bb4",
  rpcUrl = process.env.MAINNET_URL || "http://localhost:8545",
  etherscanKey = process.env.ETHERSCAN_KEY || ""
}: GetTxlogOptions = {}): Promise<Txlog.TransactionNode> {
  //get network info
  const web3 = new Web3(rpcUrl);
  const provider = web3.currentProvider;
  const networkId = await web3.eth.net.getId();

  //set up debugger
  let bugger = await Debugger.forTx(txHash, {
    provider,
    compilations: [],
    lightMode: true
  });
  //add external sources
  await fetchAndCompileForDebugger(
    bugger,
    {
      network: {
        networkId
      },
      fetcherOptions: {
        etherscan: {
          apiKey: etherscanKey
        }
      }
    }
  );
  await bugger.startFullMode();
  //debugger is now set up

  //run to end so we can get txlog
  await bugger.runToEnd();

  //get txlog
  const txlog = bugger.view(selectors.txlog.views.transactionLog);

  return txlog;
}

export type FlattedEvent =
  & Omit<Txlog.EventNode, "type">
  & {
      address: string | null;
      codeAddress: string | null;
      status: boolean;
    };

export function flattedEvents(log: Txlog.TransactionNode): FlattedEvent[] {
  const returnStatus = (node: Txlog.Node): boolean => {
    if (!("returnKind" in node)) {
      return true;
    }
    switch (node.returnKind) {
      case "revert":
        return false;
      case "unwind":
        //note: if the returnKind is "unwind", the last action *must*
        //be a callinternal!  if not, something has gone very wrong.
        const lastCall = node.actions[node.actions.length - 1];
        return returnStatus(lastCall);
      default:
        return true;
    }
  };

  const getFlattedEvents = (
    node: Txlog.Node,
    address: string | null,
    codeAddress: string | null,
    status: boolean
  ): FlattedEvent[] => {
    switch (node.type) {
      case "transaction":
        return node.actions.flatMap(subNode =>
          getFlattedEvents(subNode, node.origin, node.origin, status)
        );
      case "callexternal":
        const subNodeStatus = returnStatus(node);
        return node.actions.flatMap(subNode =>
          getFlattedEvents(
            subNode,
            node.isDelegate ? address : node.address,
            node.address,
            status && subNodeStatus
          )
        );
      case "callinternal":
        return node.actions.flatMap(subNode =>
          getFlattedEvents(subNode, address, codeAddress, status)
        );
      case "event":
        return [
          {
            decoding: node.decoding,
            raw: node.raw,
            address,
            codeAddress,
            status
          }
        ];
      default:
        return [];
    }
  };

  return getFlattedEvents(log, null, null, true);
}

export function emittedFlattedEvents(log: Txlog.TransactionNode) {
  return flattedEvents(log).filter(event => event.status);
}

export function printFlattedEvents(log: Txlog.TransactionNode) {
  const events = flattedEvents(log);
  for (const event of events) {
    const { status, address, codeAddress, decoding } = event;
    if (!status) {
      console.log("NOTE: This event was later reverted.");
    }
    if (address === codeAddress) {
      console.log(`Emitted by ${event.address}:`);
    } else {
      console.log(`Emitted by ${event.codeAddress} on behalf of ${event.address}:`);
    }
    console.log(
      util.inspect(
        new Codec.Export.LogDecodingInspector(decoding),
        {
          depth: null,
          colors: true,
          maxArrayLength: null,
          breakLength: 80
        }
      )
    );
    console.log();
  }
}
