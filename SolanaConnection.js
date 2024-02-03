const {
  PublicKey,
  Connection,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const BlockchainConnection = require("./BlockchainConnection");

class SolanaConnection extends BlockchainConnection {
  constructor(connectionString) {
    super(new Connection(connectionString));
  }

  async getBalance(publicKeyStr) {
    const publicKey = new PublicKey(publicKeyStr);
    return await this.connection.getBalance(publicKey);
  }

  async requestAirdrop(publicKeyStr, amount) {
    const publicKey = new PublicKey(publicKeyStr);
    return await this.connection.requestAirdrop(publicKey, amount);
  }

  async sendTransaction(transaction, signerKeypairs) {
    try {
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        signerKeypairs,
        {
          commitment: "confirmed",
        }
      );

      return signature;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error("Failed to send transaction");
    }
  }
}

module.exports = SolanaConnection;
