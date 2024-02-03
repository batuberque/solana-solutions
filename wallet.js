const SolanaConnection = require("./SolanaConnection");
const WalletManager = require("./WalletManager");
const TransactionService = require("./TransactionService");

async function main() {
  const connectionString =
    process.env.CONNECTION_STRING || "http://127.0.0.1:8899";
  const solanaConnection = new SolanaConnection(connectionString);
  const walletManager = new WalletManager("./wallet.json", solanaConnection);
  const transactionService = new TransactionService(
    solanaConnection,
    walletManager
  );

  const [command, ...params] = process.argv.slice(2);

  switch (command) {
    case "new":
      console.log("Creating a new wallet...");
      await walletManager.createWallet();
      console.log("New wallet created.");
      break;

    case "balance":
      console.log("Checking balance...");
      const balance = await walletManager.updateWalletBalance();
      console.log(`Current balance: ${balance} SOL`);
      break;

    case "airdrop":
      const sols = params[0] ? parseFloat(params[0]) : 1;
      console.log(`Requesting ${sols} SOL airdrop...`);
      await walletManager.requestAirdrop(sols);
      console.log("Airdrop completed.");
      break;

    case "transfer":
      const recipientPublicKey = params[0];
      const amount = parseFloat(params[1]);
      console.log(`Transferring ${amount} SOL to ${recipientPublicKey}...`);
      await transactionService.transferSol(recipientPublicKey, amount);
      console.log(`${amount} SOL transferred to ${recipientPublicKey}.`);
      break;

    default:
      console.log(
        "Invalid command. Available commands are: new, balance, airdrop, transfer"
      );
  }
}

main().catch(console.error);
