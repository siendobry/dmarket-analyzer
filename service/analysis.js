import { getTimestamp } from "../util/util.js";
import Transaction from "../model/transaction.js";


const SECONDS_IN_DAY = 24 * 60 * 60;


export function getItemProfits(transactions) {
    const groupedTransactions = groupTransactionsByDay(transactions);
    const targetPrices = groupedTransactions.targets;
    const salePrices = groupedTransactions.sales;

    const imputedSalePrices = { ...salePrices };
    const saleDayDiffs = Object.keys(salePrices).sort((a, b) => a - b).map(day => Number(day));
    for (let i = 1; i < saleDayDiffs.length; ++i) {
        for (let j = saleDayDiffs[i - 1] + 1; j < saleDayDiffs[i]; ++j) {
            imputedSalePrices[j] = imputedSalePrices[i - 1];
        }
    }

    const potentialTransactions = [];

    const targetDays = Object.keys(targetPrices).sort((a, b) => a - b).map(day => Number(day));
    targetDays.forEach(day => {
        if (day - 8 >= 0 && imputedSalePrices[day - 8] !== undefined) {
            const profit = (imputedSalePrices[day - 8].price - targetPrices[day].price) / targetPrices[day].price;
            const buyDate = new Date(targetPrices[day].date * 1000);
            const sellDate = new Date(imputedSalePrices[day - 8].date * 1000);
            const formattedBuyDate = `${buyDate.getDate()}-${buyDate.getMonth()}-${buyDate.getFullYear()}`;
            const formattedSellDate = `${sellDate.getDate()}-${sellDate.getMonth()}-${sellDate.getFullYear()}`;


            potentialTransactions.push(
                new Transaction(
                    formattedBuyDate,
                    formattedSellDate,
                    targetPrices[day].price + '$',
                    imputedSalePrices[day - 8].price + '$',
                    Math.round(profit * 10_000) / 100 + '%'
                )
            );
        }
    });

    return potentialTransactions;
}


function groupTransactionsByDay(transactions) {
    const currDate = getTimestamp();
    const targetPrices = {};
    const salePrices = {};
    const dayTransactions = {};

    transactions.sort((a, b) => a.price - b.price).forEach(transaction => {
        const timeDiff = currDate - transaction.date;

        const daysSinceCurrDate = Math.floor(timeDiff / SECONDS_IN_DAY);
        if (dayTransactions[daysSinceCurrDate] === undefined) {
            dayTransactions[daysSinceCurrDate] = [];
        }
        dayTransactions[daysSinceCurrDate].push(transaction);
    });

    Object.keys(dayTransactions).sort((a, b) => a - b).forEach(day => {
        const targets = [];
        const sales = [];

        dayTransactions[day].forEach(transaction => {
                if (transaction.txOperationType === 'Target') {
                    targets.push({ date: transaction.date, price: transaction.price });
                } else if (transaction.txOperationType === 'Offer') {
                    sales.push({ date: transaction.date, price: transaction.price });
                }
            });
            
        if (targets.length > 0) targetPrices[day] = targets[Math.floor(targets.length / 2)];
        if (sales.length > 0) salePrices[day] = sales[Math.floor((sales.length - 1) / 2)];
    });

    return {targets: targetPrices, sales: salePrices};
}