const fs = require( 'fs' )
const path = require( 'path' )
const Zip = require( 'adm-zip' )
const directoryTree = require( 'directory-tree' )
const dicomParser = require( 'dicom-parser' )
const { v4: uuidv4 } = require( 'uuid' )
const rimraf = require( 'rimraf' )
const config = require( '../config' )
const { patient_data_tab } = require( '../models' )
const DicomEntity = require( '../entities/DicomEntity' )

class DeanonimizeController {
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

        const pathsToDeanonimizedZips = []
        const promises = []
        const dicomEntities = []

        for ( let { buffer, originalname } of req.files ) {
            const dicomEntity = new DicomEntity()
            const fileName = originalname.replace( '.zip', '' )
            
            dicomEntity.readFromZip( buffer )
            dicomEntities.push( dicomEntity )
            promises.push( dicomEntity.deanonimize( this.tags, this.patientDataTab, fileName, dicomEntity ) )
        }

        Promise.all( promises ).then( ( dicomEntityes ) => {
            dicomEntityes.forEach( ({ patientName, dicomEntity }) => {
                pathsToDeanonimizedZips.push( dicomEntity.saveToZip( this.config.paths.deanonimizedZip, false, patientName ) )
            })
            
            res.send({
                links: pathsToDeanonimizedZips
            })
        } ).catch( ( error ) => {
            console.log( error )
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

module.exports = DeanonimizeController














