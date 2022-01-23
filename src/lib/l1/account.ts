import {
  BlockChainClient,
  withBlockchainClient,
} from "web3subscriber/src/client";

export async function loginL1Account() {
  return await withBlockchainClient(async (client: BlockChainClient) => {
    return {
      address: await client.getAccountInfo(),
      chainId: await (await client.getChainID()).toString(),
    };
  });
}

export async function deriveL2Account(l1Account: string) {
  let sign: { [key: string]: string } = await withBlockchainClient(
    async (l1client: BlockChainClient) => {
      return l1client.send("personal_sign", [
        "Sign this message to derive Delphinus L2 account, do not expose the signature to other.",
        l1Account,
      ]);
    }
  );
  return sign.result;
}
