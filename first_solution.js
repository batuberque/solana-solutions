const fs = require("fs");
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

class WalletService {
  constructor(connection, walletPath) {
    this.connection = connection;
    this.walletPath = walletPath;
  }

  loadWalletData() {
    return JSON.parse(fs.readFileSync(this.walletPath));
  }

  async getBalance(publicKeyStr) {
    const publicKey = new PublicKey(publicKeyStr);
    const balance = await this.connection.getBalance(publicKey);

    return balance / LAMPORTS_PER_SOL;
  }

  async checkBalance() {
    const walletData = this.loadWalletData();
    const balance = await this.getBalance(walletData.publicKey);
    console.log(`Current balance: ${balance} SOL`);

    return balance;
  }

  async createWallet() {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    const secretKey = keypair.secretKey.toString();
    const balance = await this.getBalance(publicKey);

    const walletData = { publicKey, secretKey, balance };
    fs.writeFileSync(this.walletPath, JSON.stringify(walletData, null, 2));
  }

  async updateWalletBalance() {
    const wallet = this.loadWalletData();
    const balance = await this.getBalance(wallet.publicKey);
    wallet.balance = balance;
    fs.writeFileSync(this.walletPath, JSON.stringify(wallet, null, 2));
  }

  async requestAirdrop(sols) {
    const wallet = this.loadWalletData();
    const publicKey = new PublicKey(wallet.publicKey);
    const airdropSignature = await this.connection.requestAirdrop(
      publicKey,
      sols * LAMPORTS_PER_SOL
    );

    await this.connection.confirmTransaction(airdropSignature);

    await this.updateWalletBalance();
  }

  async transferSol(recipientPublicKeyStr, amount) {
    try {
      const walletData = this.loadWalletData();
      const secretKeyArray = new Uint8Array(
        walletData.secretKey.split(",").map((num) => parseInt(num, 10))
      );
      const senderWallet = Keypair.fromSecretKey(secretKeyArray);
      const recipientPublicKey = new PublicKey(recipientPublicKeyStr);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderWallet.publicKey,
          toPubkey: recipientPublicKey,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderWallet.publicKey;

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [senderWallet],
        { commitment: "confirmed" }
      );

      console.log(
        `${amount} SOL, ${recipientPublicKeyStr} adresine transfer edildi. İşlem imzası: ${signature}`
      );
    } catch (error) {
      console.error("SOL transferi sırasında bir hata meydana geldi:", error);
    }
  }
}

async function main() {
  const connectionString =
    process.env.CONNECTION_STRING || "http://127.0.0.1:8899";
  const connection = new Connection(connectionString);
  const walletService = new WalletService(connection, "./wallet.json");

  const [command, ...params] = process.argv.slice(2);
  switch (command) {
    case "new":
      await walletService.createWallet();
      break;
    case "airdrop":
      const sol = params[0] ? parseFloat(params[0]) : 1;
      await walletService.requestAirdrop(sol);
      break;
    case "balance":
      await walletService.checkBalance();
      break;
    case "transfer":
      const recipientPublicKey = params[0];
      const amount = parseFloat(params[1]);
      await walletService.transferSol(recipientPublicKey, amount);
      break;
    default:
      console.log("Invalid command");
  }
}

main().catch(console.error);
