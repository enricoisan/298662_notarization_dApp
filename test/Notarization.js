const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Notarization", function () {
  let contract;

  beforeEach(async function () {
    // Account
    [deployer] = await ethers.getSigners();

    // Deploy del contratto prima di ogni test
    const Factory = await ethers.getContractFactory("Notarization");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("Returns false when hash is not registered", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("Test"));
    const result = await contract.verify(hash);

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(0);
    expect(result[2]).to.equal(ethers.ZeroAddress);
  });

  it("Registers a new hash", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("Test"));
    await contract.notarize(hash);
    const result = await contract.verify(hash);

    expect(result[0]).to.equal(true);
    expect(result[2]).to.equal(await deployer.getAddress());
    expect(result[1]).to.be.gt(0);
  });

  it("Prevents duplicate registrations", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("Test"));
    await contract.notarize(hash);
    await expect(contract.notarize(hash))
      .to.be.revertedWith("Document already notarized");
  });
});
