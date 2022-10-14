// Import Solana web3 functinalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

const connection = new Connection(clusterApiUrl(process.env.BC_STAGE), "confirmed");


class Wallet {
    constructor(walletName, publicKey, secretKey) {
        this._name = walletName;
        this._connection = connection;
        this._signatures = [];
        
        if (null == publicKey && secretKey == null) {
            const newPair = new Keypair();

            this._pubKey = new PublicKey(newPair._keypair.publicKey);
            this._secretKey = newPair._keypair.secretKey;
        } else {
            this._pubkey = publicKey;
            this._secretKey = secretKey;
        }
    }

    getName() { return this._name; }

    getCredential() {
        return {
            publicKey: this._pubKey,
            secretKey: this._secretKey,
        }
    }

    async getBalance(notUseLog) {
        try {
            const walletBalance = await this._connection.getBalance(
                new PublicKey(this._pubKey)
            );
            const balance = (parseInt(walletBalance) / LAMPORTS_PER_SOL);

            if(!notUseLog) console.log(`Wallet Id: ${this._name}\nBalance: ${balance} Sol\n`)
            return balance
        } catch (err) {
            console.log(err);
        }
    }

    async airDrop(amount) {
        try {
            const fromAirDropSignature = await this._connection.requestAirdrop(
                new PublicKey(this._pubKey),
                parseInt(amount) * LAMPORTS_PER_SOL
            );
            await this._connection.confirmTransaction(fromAirDropSignature);
            console.log(`airDropping for ${amount} Sol to ${this._name} wallet\n`)
            this._signatures.push(fromAirDropSignature)
            return fromAirDropSignature;
        } catch (err) {
            console.log(err);
        }
    }

    async _checkLastBlock(signature) {
        let latestBlockHash = await this._connection.getLatestBlockhash();
        await this._connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature,
        });
    }

    async sendTokenTo(targetWallet, amount) {
        try {
            const targetPubkey = targetWallet.getCredential().publicKey;
            const currentBalance = await this.getBalance(true);
            const walletOwner = Keypair.fromSecretKey(this._secretKey);
            
            if (currentBalance < amount) {
                console.log('\nInsufficient balance!\n')
                return
            }

            await this._checkLastBlock(this._signatures[0]);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this._pubKey,
                    toPubkey: targetPubkey,
                    lamports: amount * LAMPORTS_PER_SOL,
                })
            );
            
            const signature = await sendAndConfirmTransaction(
                this._connection,
                transaction,
                [walletOwner]
            );
            console.log(`Transfer from ${this._name} to ${targetWallet.getName()} success!\n`);
        } catch (err) {
            console.log('Transfer failed!');
            console.log(err)
        }
    }
}

module.exports = Wallet;