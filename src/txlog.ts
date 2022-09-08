import type * as Codec from "@truffle/codec";

export type Node =
  | TransactionNode
  | CallexternalNode
  | CallinternalNode
  | EventNode

export interface HasActions {
  actions: Node[];
}

export interface HasReturnKind {
  returnKind:
    | "revert"
    | "unwind"
    | unknown;
}

export type TransactionNode =
  & {
      type: "transaction";
      origin: string;
    }
  & HasActions
  & unknown;

export type CallexternalNode =
  & {
      type: "callexternal";
      address: string;
      isDelegate: boolean;
    }
  & HasActions
  & HasReturnKind
  & unknown;

export type CallinternalNode =
  & {
      type: "callinternal";
    }
  & HasActions
  & unknown;

export type EventNode =
  & {
      type: "event";
      decoding: Codec.LogDecoding;
      raw: unknown;
    }
  & unknown;
