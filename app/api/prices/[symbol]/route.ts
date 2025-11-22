import { NextRequest, NextResponse } from "next/server";

const RPC_URL = "https://ethereum-rpc.publicnode.com";
const METHOD_SELECTOR = "0x50d25bcd";

const feeds = {
  BTC: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
  ETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155C5b8419",
  SOL: "0x4ffC43a60e009B551865A93d232E33Fce9f01507",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol || !feeds[symbol]) {
    return NextResponse.json(
      { error: "Invalid or missing symbol" },
      { status: 400 }
    );
  }

  const address = feeds[symbol as keyof typeof feeds];

  const payload = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [
      {
        to: address,
        data: METHOD_SELECTOR,
      },
      "latest",
    ],
    id: 1,
  };

  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.result) {
      throw new Error("No result from RPC");
    }

    // The result is a hex string. It may be 322 chars (full) or 66 chars (truncated).
    // We only need the `answer` field which is the second 32‑byte word.
    const hex = data.result as string;
    const trimmed = hex.startsWith("0x") ? hex.slice(2) : hex;

    // Ensure we have at least 64 hex chars (32 bytes) for the answer.
    const answerHex = trimmed.length >= 64
      ? trimmed.slice(64, 96)
      : trimmed.slice(0, 64);

    const answer = BigInt(`0x${answerHex}`);
    // Chainlink feeds use 8 decimals.
    const price = Number(answer) / 1e8;

    return NextResponse.json({ price, symbol });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
