require( 'dotenv' ).config()
const path = require( 'path' )

module.exports ={
    server: {
        port: process.env.SERVER_PORT || 8081
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost',
        originPort: process.env.CORS_ORIGIN_PORT || 8080,
        methods: [ 'GET', 'POST', 'OPTIONS' ]
    },
    paths: {
        anonimizedZip: path.join( process.argv[ 1 ].replace( 'src/index.js', '' ), 'anonimizedZips' ),
        deanonimizedZip: path.join( process.argv[ 1 ].replace( 'src/index.js', '' ), 'deanonimizedZips' )
    },
    secret: process.env.SECRET,
    serverBasePath: process.argv[ 1 ].replace( 'src/index.js', '' )
}
