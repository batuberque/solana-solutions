const fs = require("fs");
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} = require("@solana/web3.js");

// rewrite with process.env
const connectionString = "http://127.0.0.1:8899";

const connection = new Connection(connectionString);

const walletPath = "./wallet.json";

async function main() {
  const [command, ...params] = process.argv.slice(2);
  switch (command) {
    case "new":
      await createWallet();
      break;
    case "airdrop":
      const sol = params[0] ? parseFloat(params[0]) : 1;
      await requestAirdrop(sol);
      break;
    case "balance":
      await checkBalance();
      break;
    case "transfer":
      const recipientPublicKey = new PublicKey(params[0]);
      const amount = parseFloat(params[1]);
      await transferSol(recipientPublicKey, amount);
      break;
    default:
      console.log("Invalid command");
  }
}

async function createWallet() {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toString();
  const secretKey = keypair.secretKey.toString();
  const balance = await getBalance(publicKey);

  const walletData = { publicKey, secretKey, balance };
  fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
}

async function requestAirdrop(sols) {
  const wallet = JSON.parse(fs.readFileSync(walletPath));
  const publicKey = new PublicKey(wallet.publicKey);
  await connection.requestAirdrop(publicKey, sols * LAMPORTS_PER_SOL);
  await checkBalance();
}

async function getBalance(publicKey) {
  const balanceInLamports = await connection.getBalance(publicKey);
  return balanceInLamports / LAMPORTS_PER_SOL;
}

async function checkBalance() {
  const walletData = JSON.parse(fs.readFileSync(walletPath));
  const publicKey = new PublicKey(walletData.publicKey);
  const balance = await getBalance(publicKey);
  return balance;
}

// must be changed!! this function, wrong
async function transferSol(recipientPublicKey, amount) {
  try {
    const walletData = JSON.parse(fs.readFileSync(walletPath));
    const secretKeyArray = JSON.parse("[" + walletData.secretKey + "]");
    const senderWallet = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: recipientPublicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderWallet.publicKey;

    const signedTransaction = await connection.signer.signTransaction(
      transaction
    );

    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      }
    );

    console.log(
      `${amount} SOL transferred to ${recipientPublicKey.toString()} with signature: ${signature}`
    );
  } catch (error) {
    console.error("Error transferring SOL:", error);
  }
}

main().catch(console.error);
