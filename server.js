import { randomUUID } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import Database from "./database.js";
import * as api from "./service/obtain-data.js";
import * as analysis from "./service/analysis.js";
import Item from "./model/item.js";


const PORT_NUMBER = 3030;
const db = new Database();
const activeSessions = {};


const app = express();
app.set("view engine", "ejs");
app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function(req, res, next) {
    res.set({"Content-Type": "text/html"});
    next();
});


app.get("/", (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(200).render("index");
    } else {
        res.redirect(303, "/item/search");
    }
});

app.get("/user/signup", (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(200).render("signup");
    } else {
        res.redirect(303, "/item/search");
    }
});

app.post("/user/signup", (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).render("message", { message: "Supply all credentials!" });
    } else {
        try {
            db.createUser(req.body.username, req.body.password);

            res.status(200).render("message", { message: "Successfully signed up! You may log in now" });
        } catch (err) {
            res.status(err.status || 500).render("message", { message: err.message || "Internal server error" });
        }
    }
});

app.get("/user/login", (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(200).render("login");
    } else {
        res.redirect(303, "/item/search");
    }
});

app.post("/user/login", (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).render("message", { message: "Supply all credentials!" });
    } else {
        try {
            db.checkCredentials(req.body.username, req.body.password);
            const cookieValue = randomUUID();
            activeSessions[cookieValue] = true;
            res.cookie("session", cookieValue, { httpOnly: true, secure: true, sameSite: "Lax" });

            // res.status(200).render("message-logged", { message: "Successfully logged in! You may use the service now" });
            res.redirect(303, "/item/search");
        } catch (err) {
            res.status(err.status || 500).render("message", { message: err.message || "Internal server error" });
        }
    }
});

app.post("/user/logout", (req, res) => {
    const session = req.cookies.session;
    if (activeSessions[session] === undefined) {
        res.status(401).render("message", { message: "Not authorized!" });
    } else {
        activeSessions[session] = undefined;
        res.clearCookie("session");

        res.status(200).render("message", { message: "Successfully logged out!" });
    }
});


app.get("/item/search", (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(401).render("message", { message: "Not authorized!" });
    } else {
        res.status(200).render("search", { itemTitle: "flip tiger tooth factory" });
    }
})

app.get("/item/find", async (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(401).render("message", { message: "Not authorized!" });
    } else {
        try {
            const itemTitle = await api.getItemTitle(req.query.itemTitle);

            res.redirect(303, `/item/${itemTitle}/details`);
        } catch (err) {
            res.status(err.status || 500).render("message-logged", { message: err.message || "Internal server error" });
        }

    }
});

app.get("/item/:title/details", async (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(401).render("message", { message: "Not authorized!" });
    } else {
        try {
            const titleParam = req.params.title;
            const itemTitle = await api.getItemTitle(titleParam);
            const item = new Item(itemTitle);
    
            let itemListings;
            [itemListings, item.imgUrl, item.target] = await Promise.all([
                api.getItemListings(item.title),
                api.getItemImage(item.title),
                api.getHighestTarget(item.title)
            ]);
            item.lowestListing = api.getLowestListing(itemListings, false);
            item.lowestWithdrawableListing = api.getLowestListing(itemListings);
    
            res.status(200).render("details", { item: item });
        } catch (err) {
            res.status(err.status || 500).render("message-logged", { message: err.message || "Internal server error" });
        }
    }
});

app.get("/item/:title/analysis", async (req, res) => {
    if (activeSessions[req.cookies.session] === undefined) {
        res.status(401).render("message", { message: "Not authorized!" });
    } else {
        try {
            const period = req.query.period || 14;
            if (typeof period === "number" && (period < 8 || period > 360)) {
                throw { status: 400, message: "Period should be an integer between 8 and 360" };
            }

            const titleParam = req.params.title;

            const itemTitle = await api.getItemTitle(titleParam);
            const transactions = await api.getItemTransactions(itemTitle, period);
            const potentialTransactions = analysis.getItemProfits(transactions);
    
            res.status(200).render("transactions", { title: itemTitle, potentialTransactions: potentialTransactions });
        } catch (err) {
            res.status(err.status || 500).render("message-logged", { message: err.message || "Internal server error" });
        }
    }
});


app.get("*", (req, res) => {
    res.status(404).render("message", { message: "Route not found!" });
})


app.listen(PORT_NUMBER, () => console.log(`Server started operating on port ${PORT_NUMBER}`));