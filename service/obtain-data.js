import * as api from "../external/dmarket/api.js";
import { getTimestamp } from "../util/util.js";


export async function getItemTransactions(title, daysPrior) {
    const daysPriorDate = getTimestamp() - (daysPrior * 24 * 60 * 60);
    const transactions = [];

    let numFetchedTransactions = 0;
    do {
        const fetchedTransactions = (await api.fetchItemHistory(title, transactions.length))
        .map(transaction => {
            transaction.date = Number(transaction.date);
            transaction.price = Number(transaction.price);
            return transaction;
        });
        numFetchedTransactions = fetchedTransactions.length;

        transactions.push(...fetchedTransactions);
    } while (numFetchedTransactions > 0 && transactions[transactions.length - 1].date >= daysPriorDate);

    while (transactions.length > 0 && transactions[transactions.length - 1].date < daysPriorDate) {
        transactions.pop();
    }

    return transactions;
}

export async function getHighestTarget(title) {
    const targetList = await api.fetchItemOrders(title);

    return targetList.length !== 0 ? Number(targetList[0].price) / 100 : null;
}

export async function getItemListings(title) {
    const listings = [];
    let cursor = '';

    let numFetchedItems = 0;
    do {
        const result = await api.fetchItemListings(title, cursor);
        numFetchedItems = result.total;
        
        listings.push(...result.objects);
        cursor = result.cursor;
    } while (numFetchedItems > 0);

    const mappedListings = listings.map(listing => {
        return {
            title: listing.title,
            price: listing.price.USD / 100,
            withdrawable: listing.extra.withdrawable === true
        }
    })

    return mappedListings;
}

export function getLowestListing(listings, withdrawable=true) {
    let filteredListings = listings.filter(listing => listing.withdrawable === withdrawable);

    let lowestPriceIdx = 0;
    for (let i = 1; i < filteredListings.length; ++i) {
        if (filteredListings[i].price < filteredListings[lowestPriceIdx].price) {
            lowestPriceIdx = i;
        }
    }

    if (filteredListings.length === 0) {
        return 0;
    } else {
        return filteredListings[lowestPriceIdx].price;
    }
}

export async function getItemTitle(query) {
    const response = await api.fetchItemListings(query, "", 1);
    if (response !== undefined && response.objects.length > 0) {
        return response.objects[0].title;
    } else {
        throw { status: 404, message: "Item not found!" };
    }
}

export async function getItemImage(title) {
    const response = await api.fetchItemListings(title, "", 1);
    if (response !== undefined && response.objects.length > 0) {
        return response.objects[0].image;
    } else {
        throw { status: 404, message: "Item not found!" };
    }
}