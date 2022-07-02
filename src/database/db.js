const sequelize = require('sequelize');
const path = require('path');

const db = new sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, './database.sqlite'),
    define:{
        timestamps: true
    }
})

module.exports = db;