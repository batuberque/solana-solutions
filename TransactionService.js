const {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

class TransactionService {
  constructor(blockchainConnection, walletManager) {
    this.blockchainConnection = blockchainConnection;
    this.walletManager = walletManager;
  }

  async transferSol(recipientPublicKeyStr, amount) {
    try {
      const walletData = this.walletManager.loadWalletData();

      const secretKeyArray = new Uint8Array(walletData.secretKey);
      const senderKeypair = Keypair.fromSecretKey(secretKeyArray);

      const recipientPublicKey = new PublicKey(recipientPublicKeyStr);

      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: recipientPublicKey,
          lamports: lamports,
        })
      );

      const signature = await this.blockchainConnection.sendTransaction(
        transaction,
        [senderKeypair]
      );

      console.log(`Transfer successful. Signature: ${signature}`);

      await this.walletManager.updateWalletBalance();
    } catch (error) {
      console.error("Error during SOL transfer:", error);
      throw error;
    }
  }
}

module.exports = TransactionService;
