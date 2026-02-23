const hre = require("hardhat");

async function main() {
  const ContractFactory = await hre.ethers.getContractFactory("Notarization");
  const contract = await ContractFactory.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Contract Notarization address:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

