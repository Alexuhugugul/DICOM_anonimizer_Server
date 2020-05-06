const fs = require( 'fs' );
const path = require( 'path' );
const Sequelize = require( 'sequelize' );

const db = {};

const sequelize = new Sequelize(
    process.env.DB,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_HOST
    }
);

fs
    .readdirSync( __dirname )
    .filter(( file ) =>
        file !== 'index.js'
    )
    .forEach(( file ) => {
        const model = sequelize.import( path.join( __dirname, file ) );

        db[ model.name ] = model;
    });


db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

module.exports = db;
