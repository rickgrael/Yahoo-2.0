const db = require('../db');

const Liked_answer = db.define('liked_answer', {
    answerId:{
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    userId:{
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    liked: {
        type: db.Sequelize.BOOLEAN,
        allowNull: false,
    }
})

db.sync({force:false});

module.exports = Liked_answer;