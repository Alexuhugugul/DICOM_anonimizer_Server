const cors = require( 'cors' )
const express = require( 'express' )
const config = require( './config' )
const bodyParser = require( 'body-parser' )
const fs = require( 'fs' )
const multer = require( 'multer' )

const models = require( './models' )

const AnonimizeController = require( './controllers/AnonimizeController' )
const DeanonimizeController = require( './controllers/DeanonimizeController' )

const enumTags = require( './enumDicomTags' )

const upload = multer()
const app = express()
const corsPolicy = cors({
    origin: `${ config.cors.origin }:${ config.cors.originPort }`,
    methods: config.cors.methods
})

const anonimizeController = new AnonimizeController( config, enumTags, models )
const deanonimizeController = new DeanonimizeController( config, enumTags, models )

app.use( express.static( 'anonimizedZips' ) )
app.use( express.static( 'deanonimizedZips' ) )
app.use( corsPolicy )

app.post( '/anonimize', upload.any(), anonimizeController.handleZip )
app.post( '/deanonimize', upload.any(), deanonimizeController.handleZip )

app.listen( config.server.port, () => {
    console.info( `Server started on ${ config.server.port } port` )
})