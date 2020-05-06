module.exports = ( sequelize, DataTypes ) =>
    sequelize.define( 'patient_data_tab', {
        patient_id: {
            type: DataTypes.TEXT,
            primaryKey: true
        },
        patient_name: {
            type: DataTypes.TEXT
        },
        patient_birth_date: {
            type: DataTypes.TEXT
        }
    },
    {
        freezeTableName: true,
        defaultPrimaryKey: false,
        timestamps: false
    }
);
