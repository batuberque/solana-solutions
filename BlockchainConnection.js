class BlockchainConnection {
  constructor(connection) {
    if (new.target === BlockchainConnection) {
      throw new TypeError(
        "Cannot construct BlockchainConnection instances directly"
      );
    }

    this.connection = connection;
  }

  async getBalance(publicKey) {
    throw new Error("getBalance method must be implemented");
  }

  async requestAirdrop(publicKey, amount) {
    throw new Error("requestAirdrop method must be implemented");
  }

  async sendTransaction(transaction) {
    throw new Error("sendTransaction method must be implemented");
  }
}

module.exports = BlockchainConnection;
