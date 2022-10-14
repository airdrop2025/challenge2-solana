require('dotenv').config()

const Wallet = require('./Wallet');

const main = async () => {
    const walletA = new Wallet('A');
    const walletB = new Wallet('B');
    const amountAirDrop = 1;

    await walletA.getBalance();
    await walletB.getBalance();
    await walletA.airDrop(amountAirDrop);
    await walletA.getBalance();
    await walletA.sendTokenTo(walletB, amountAirDrop / 2);
    await walletA.getBalance();
    await walletB.getBalance();
}

main();