export default class Database {

    #users;

    constructor() {
        this.#users = {
            "admin": "admin"
        };
    }
    
    createUser(username, password) {
        if (this.#users[username] !== undefined) {
            throw { status: 400, message: `User '${username}' already exists!` }
        } else {
            this.#users[username] = password;
        }
    }
    
    checkCredentials(username, password) {
        if (this.#users[username] === undefined || this.#users[username] !== password) {
            throw { status: 401, message: "Wrong credentials!" }
        }
    }

}