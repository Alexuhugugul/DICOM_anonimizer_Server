const Zip = require( 'adm-zip' )
const path = require( 'path' )
const fs = require( 'fs' )
const dicomParser = require( 'dicom-parser' )
const rimraf = require( 'rimraf' )

class DicomEntity {
    constructor ( id ) {
        this.id = id
        this.zip = null
        this.zipContent = null
        this.rootName = null
        this.tagSaved = false
        this.anonimizedFiles = []
        this.deanonimizedFiles = []
    }


    readFromZip ( buffer ) {
        this.zip = new Zip( buffer )
        this.zipContent = this.zip.getEntries()
        this.rootName = this.zipContent[ 0 ].entryName.replace( '/', '' )
    }


    anonimize ( tagsForAnonimize, dbTable ) {
        let dicomFile = null
        let dicomDataset = null

        for ( let entity of this.zipContent ) {
            if ( !entity.isDirectory && path.extname( entity.entryName ) === '.dcm' ) {
                dicomFile = this.zip.readFile( entity )
                dicomDataset = dicomParser.parseDicom( dicomFile )

                if ( !this.tagSaved ) {
                    this._saveAnonimizedTags( dicomDataset, tagsForAnonimize, dbTable )
                }

                this._anonimizeTags( dicomDataset, tagsForAnonimize )

                this.anonimizedFiles.push({
                    entryPath: entity.entryName.replace( this.rootName, this.id ),
                    buffer: Buffer.from( dicomDataset.byteArray )
                })
            }
        }
    }

    deanonimize ( tagsForDeanonimize, dbTable, fileName, dicomEntity ) {
        let dicomFile = null
        let dicomDataset = null

        return new Promise( ( resolve, reject ) => {
            dbTable.findOne({
                where: {
                    patient_id: fileName
                }
            }).then( ( result ) => {
                let dataForDeanonimize = {
                    PATINET_BIRTH_DATE: result.patient_birth_date,
                    PATIENT_NAME: result.patient_name
                }

                const normalizedPatientName = this._normalizeString( result.patient_name )
    
                for ( let entity of this.zipContent ) {
                    if ( !entity.isDirectory && path.extname( entity.entryName ) === '.dcm' ) {
                        dicomFile = this.zip.readFile( entity )
                        dicomDataset = dicomParser.parseDicom( dicomFile )
        
                        this._deanonimizeTags( dicomDataset, tagsForDeanonimize, dataForDeanonimize )

                        this.deanonimizedFiles.push({
                            entryPath: entity.entryName.replace( this.rootName, normalizedPatientName + '/' + this.rootName ),
                            buffer: Buffer.from( dicomDataset.byteArray )
                        })
                    }
                }

                resolve({ patientName: normalizedPatientName, dicomEntity })
            }).catch( ( error ) => {
                reject( error )
            })
        })
    }


    saveToZip ( pathToRootFolder, anonimized, patientName ) {
        const anonimizedDicomZip = new Zip()

        const fileName = patientName ? patientName : this.id
        const anonimizedDicomTmpFolder = path.join( pathToRootFolder, fileName )
        const anonimizedDicomZipPath = path.join( pathToRootFolder, fileName + '.zip' )

        const iterator = anonimized ? this.anonimizedFiles : this.deanonimizedFiles

        for ( let anonimizedFile of iterator ) {
            let pathToFile = path.join( pathToRootFolder, anonimizedFile.entryPath )
            let pathToDir = path.dirname( pathToFile )

            if ( !fs.existsSync( pathToDir ) ) {
                fs.mkdirSync( pathToDir, { recursive: true })
            }

            fs.appendFileSync( pathToFile, anonimizedFile.buffer )
        }
        
        anonimizedDicomZip.addLocalFolder( anonimizedDicomTmpFolder )
        anonimizedDicomZip.writeZip( anonimizedDicomZipPath )

        rimraf.sync( anonimizedDicomTmpFolder )

        return fileName + '.zip'
    }


    _saveAnonimizedTags ( dataset, tagsForAnonimize, dbTable ) {
        this.tagSaved = true

        dbTable.create({
            patient_id: this.id,
            patient_name: dataset.string( tagsForAnonimize.PATIENT_NAME ),
            patient_birth_date: dataset.string( tagsForAnonimize.PATINET_BIRTH_DATE )
        })
    }


    _anonimizeTags ( dataset, tagsForAnonimize ) {
        let byteArray = dataset.byteArray

        for ( let tagName in tagsForAnonimize ) {
            let tag = tagsForAnonimize[ tagName ]
            let { length, dataOffset } = dataset.elements[ tag ]
            
            for ( let i = 0; i < length; i++ ) {
                byteArray[ dataOffset + i ] = 32
            }
        }
    }

    _deanonimizeTags ( dataset, tagsForAnonimize, dataForDeanonimize ) {
        let byteArray = dataset.byteArray

        for ( let tagName in tagsForAnonimize ) {
            let tag = tagsForAnonimize[ tagName ]
            let data = dataForDeanonimize[ tagName ]
            let length = data.length
            let { dataOffset } = dataset.elements[ tag ]
            
            for ( let i = 0; i < length; i++ ) {
                byteArray[ dataOffset + i ] = data.charCodeAt( i )
            }
        }
    }

    _normalizeString ( string ) {
        return string.replace( /[^a-zA-Zа-яА-ЯёЁ]/g, '_' )
    }
}

module.exports = DicomEntity
