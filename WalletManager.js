const fs = require("fs");
const { Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");

class WalletManager {
  constructor(walletPath, blockchainConnection) {
    this.walletPath = walletPath;
    this.blockchainConnection = blockchainConnection;
  }

  loadWalletData() {
    return JSON.parse(fs.readFileSync(this.walletPath));
  }

  saveWalletData(walletData) {
    fs.writeFileSync(this.walletPath, JSON.stringify(walletData, null, 2));
  }

  async createWallet() {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const secretKey = Array.from(keypair.secretKey);
    const walletData = { publicKey, secretKey, balance: 0 };
    this.saveWalletData(walletData);
  }

  async updateWalletBalance() {
    const wallet = this.loadWalletData();
    const balance = await this.blockchainConnection.getBalance(
      wallet.publicKey
    );
    wallet.balance = balance / LAMPORTS_PER_SOL;
    this.saveWalletData(wallet);

    return wallet.balance;
  }

  async requestAirdrop(amount) {
    const walletData = this.loadWalletData();
    const publicKey = walletData.publicKey;
    const airdropSignature = await this.blockchainConnection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    console.log(`Airdrop requested: ${airdropSignature}`);

    await this.updateWalletBalance();

    return airdropSignature;
  }
}

module.exports = WalletManager;
