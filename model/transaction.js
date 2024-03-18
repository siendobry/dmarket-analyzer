export default class Transaction {

    constructor(buyDate, sellDate, buyPrice, sellPrice, potentialProfit) {
        this.buyDate = buyDate;
        this.sellDate = sellDate;
        this.buyPrice = buyPrice;
        this.sellPrice = sellPrice;
        this.potentialProfit = potentialProfit;
    }
}