import { Transaction } from '@mysten/sui/transactions';

async function test() {
  const tx = new Transaction();
  tx.moveCall({
    target: '0x123::test::test',
    arguments: [tx.pure.vector("u8", [1, 2, 3])],
  });
  
  // Without client, we can't build if we have objects, but we don't!
  const bytesWithKind = await tx.build({ onlyTransactionKind: true });
  console.log("onlyTransactionKind: true ->", Buffer.from(bytesWithKind).toString('hex'));
  
  tx.setSender('0xf682bfac6c6317b9f75b177fd86e5faaa889848d10f00209d203b66a47746474');
  const bytesWithoutKind = await tx.build();
  console.log("onlyTransactionKind: false ->", Buffer.from(bytesWithoutKind).toString('hex'));
}
test().catch(console.error);
