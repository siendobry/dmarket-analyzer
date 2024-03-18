export default class Item {

    constructor(title) {
        this.title = title;
        this.imgUrl = null;
        this.target = null;
        this.lowestListing = null;
        this.lowestWithdrawableListing = null;
        this.transactions = [];
    }
}