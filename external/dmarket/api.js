import axios from 'axios';
import { getTimestamp } from "../../util/util.js";
import { host, sign, swapChars } from './util.js';
import { publicKey } from './keys.js';


const GAME_STR = "a8db";


function getAuthHeaders(method,  apiUrlPath, requestBody='') {
    const timestamp = getTimestamp();
    const stringToSign = method + apiUrlPath + requestBody + timestamp;
    const signature = sign(stringToSign);

    return {
        "X-Api-Key": publicKey,
        "X-Request-Sign": "dmar ed25519 " + signature,
        "X-Sign-Date": timestamp,
        'Content-Type': 'application/json'
    }
}


export async function fetchItemHistory(title, offset=0, limit=20) {
    const method = 'GET';
    const apiUrlPath = `/trade-aggregator/v1/last-sales?gameId=${GAME_STR}&title=${swapChars(title)}&limit=${limit}&offset=${offset}`;

    return await axios.get('https://' + host + apiUrlPath, {
        headers: getAuthHeaders(method, apiUrlPath)
        })
        .then(async res => {
            return res.data.sales;
        })
        .catch(err => {
            console.error(method + ' ' + apiUrlPath + '\n' + err.response.data.message);
            throw { status: err.status, message: err.response.data.message };
        });
}

export async function fetchItemOrders(title) {
    const method = 'GET';
    const apiUrlPath = `/order-book/v1/market-depth?gameId=${GAME_STR}&title=${swapChars(title)}&filters=phase[]=any,floatPartValue[]=any`;

    return await axios.get('https://' + host + apiUrlPath, {
            headers: getAuthHeaders(method, apiUrlPath)
        })
        .then(async res => {
            return res.data["orders"];
        })
        .catch(err => {
            console.error(method + ' ' + apiUrlPath + '\n' + err.response.data.message);
            throw { status: err.status, message: err.response.data.message };
        });
}

export async function fetchItemListings(title, cursor="", limit=1000) {
    const method = 'GET';
    const apiUrlPath = `/exchange/v1/offers-by-title?Title=${swapChars(title)}&Limit=${limit}&Cursor=${cursor}`;

    return await axios.get('https://' + host + apiUrlPath, {
        headers: getAuthHeaders(method, apiUrlPath)
        })
        .then(async res => {
            return res.data;
        })
        .catch(err => {
            console.error(method + ' ' + apiUrlPath + '\n' + err.response.data.message);
            throw { status: err.status, message: err.response.data.message };
        });
}


// TESTS

const itemTitle = '★ Falchion Knife | Doppler (Factory New)'

// 1
// console.log(await fetchItemHistory(itemTitle))

// 2
// console.log(await fetchItemOrders(itemTitle))

// 3
// console.log(await fetchItemListings(itemTitle))