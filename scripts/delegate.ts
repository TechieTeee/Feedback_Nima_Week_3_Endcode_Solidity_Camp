import { ethers, Contract } from "ethers";
import "dotenv/config";
import { CustomBallot, MyToken } from "../typechain";
import * as TokenJson from "../artifacts/contracts/Token.sol/MyToken.json";
import * as CustomBallotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import hre from "hardhat";

const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

async function main() {
  // Connect wallets:
  console.log("== Start delegating == ");
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address 1: ${wallet.address}`);

  const provider = ethers.providers.getDefaultProvider("ropsten", {
    etherscan: process.env.ETHERSCAN_API_KEY,
    infura: process.env.INFURA_API_KEY,
  });

  const [wallet2, wallet3] = await hre.ethers.getSigners();
  console.log(`Using address 2: ${wallet2.address}`);
  console.log(`Using address 3: ${wallet3.address}`);

  // Get signers & voters:
  const signer = wallet.connect(provider);
  const voters = [wallet2, wallet3];

  // Get Contracts - TokenContract + BallotContract:
  console.log("== Deploy Contracts ==");
  const TokenContract: MyToken = new Contract(
    "0x7E70b137e5D5d87e096C5b29cDDa67fBA27743A9",
    TokenJson.abi,
    signer
  ) as MyToken;

  const BallotContract: CustomBallot = new Contract(
    "0x1e5A2c8583E4A1dfF2db2Ae20625E3d6F28af306",
    CustomBallotJson.abi,
    signer
  ) as CustomBallot;

  // Get voting poower:
  for (const voter of voters) {
    const votingPower = await BallotContract.votingPower();
    console.log(`Voting power: ${voter.address} = ${votingPower}`);
  }

  // Start Delegating:
  console.log("== Delegating ==");
  for (const voter of voters) {
    if (
      (await TokenContract.delegates(voter.address)) ===
      ethers.constants.AddressZero
    ) {
      if (voter.address === "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") {
        const delegateTransaction = await TokenContract.delegate(
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        );
        const confirmation = await delegateTransaction.wait();
        console.log(
          `Delegation: ${voter.address} on transaction: 
          ${confirmation.transactionHash} to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
        );
      } else {
        const delegateTransaction = await TokenContract.delegate(voter.address);
        const receipt = await delegateTransaction.wait();
        console.log(
          `Self Delegation: for ${voter.address} on trasanction: ${receipt.transactionHash}`
        );
      }
    }
  }

  // Voting status:
  console.log("== Voting: ==");
  for (const voter of voters) {
    const votingPower = await TokenContract.getVotes(voter.address);
    console.log(`Voting power of ${voter.address} is ${votingPower}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
