const { v4: uuidv4 } = require( 'uuid' )
const DicomEntity = require( '../entities/DicomEntity' )

class AnonimizeController {
    constructor ( config, tags, models ) {
        this.config = config
        this.tags = tags
        this.patientDataTab = models.patient_data_tab

        this.handleZip = this.handleZip.bind( this )
        this._validateRequest = this._validateRequest.bind( this )
    }

    
    handleZip ( req, res ) {
        const { error } = this._validateRequest( req )

        if ( error ) {
            res.status( 400 ).send({ error })

            return
        }

        const pathsToAnonimizedZips = []

        for ( let { buffer } of req.files ) {
            const dicomEntity = new DicomEntity( uuidv4() )
            
            dicomEntity.readFromZip( buffer )
            dicomEntity.anonimize( this.tags, this.patientDataTab )
            pathsToAnonimizedZips.push( dicomEntity.saveToZip( this.config.paths.anonimizedZip, true ) )
        }

        res.send({
            links: pathsToAnonimizedZips
        })
    }

    
    _validateRequest ( req ) {
        const receivedFiles = req.files
        const result = {
            error: null
        }

        for ( let file of receivedFiles ) {
            if ( !file ) {
                result.error = 'Файл запроса не найден'
            } else if ( file.mimetype !== 'application/zip' ) {
                result.error =  `Файл имеет неверный формат. Требуемый: application/zip. Сейчас: ${ file.mimetype }`
            } else  if ( file.size === 0 ) {
                result.error = 'Файл пуст'
            }

            if ( result.error ) {
                break
            }
        }

        return result
    }
}

module.exports = AnonimizeController
