const url = "https://sui-testnet.gateway.tatum.io/";

async function rpcCall(method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });
  return response.json();
}

async function run() {
  const data = await rpcCall("suix_queryTransactionBlocks", [
    { filter: null }, // no filter, just recent transactions on network
    null,
    1,
    true
  ]);
  console.log("NO OPTIONS:", JSON.stringify(data, null, 2));

  // try with showInput
  const data2 = await rpcCall("suix_queryTransactionBlocks", [
    { filter: null, options: { showInput: true } },
    null,
    1,
    true
  ]);
  console.log("showInput:", JSON.stringify(data2, null, 2));
}
run();
