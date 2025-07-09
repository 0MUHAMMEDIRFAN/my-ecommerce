var db = require("../config/connection")
let collection = require("../config/collections")
const objectId = require("mongodb").ObjectId
module.exports = {

    addProducts: (product, callback) => {
        const dbConnection = db.get()
        if (!dbConnection) {
            callback(new Error('Database connection not available'))
            return
        }
        dbConnection.collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId)
        }).catch((error) => {
            callback(error)
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            const dbConnection = db.get()
            if (!dbConnection) {
                reject(new Error('Database connection not available'))
                return
            }
            try {
                let products = await dbConnection.collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },

    getProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            const dbConnection = db.get()
            if (!dbConnection) {
                reject(new Error('Database connection not available'))
                return
            }
            try {
                let result = await dbConnection.collection(collection.PRODUCT_COLLECTION).findOne({ _id: new objectId(productId) })
                resolve(result)
            } catch (error) {
                reject(error)
            }
        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            const dbConnection = db.get()
            if (!dbConnection) {
                reject(new Error('Database connection not available'))
                return
            }
            dbConnection.collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectId(productId) }).then((result) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    },

    editProduct: (productId, productData) => {
        return new Promise((resolve, reject) => {
            const dbConnection = db.get()
            if (!dbConnection) {
                reject(new Error('Database connection not available'))
                return
            }
            dbConnection.collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(productId) }, {
                $set: {
                    Name: productData.Name,
                    Price: productData.Price,
                    Category: productData.Category,
                    Description: productData.Description,
                }
            }).then((result) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }
}