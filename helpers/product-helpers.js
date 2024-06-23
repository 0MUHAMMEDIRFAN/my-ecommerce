var db = require("../config/connection")
let collection = require("../config/collections")
const objectId = require("mongodb").ObjectId
module.exports = {

    addProducts: (product, callback) => {
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            callback(data.insertedId)
        })

    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    getProduct: (productId) => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new objectId(productId) })
            // .then((result) => {
            resolve(result)
            // })

        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectId(productId) }).then((result) => {
                resolve(result)

            })
        })
    },

    editProduct: (productId, productData) => {
        return new Promise((resolve, reject) => {
            let result = db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(productId) }, {
                $set: {
                    Name: productData.Name,
                    Price: productData.Price,
                    Category: productData.Category,
                    Description: productData.Description,
                }
            })
            resolve(result)
        })
    }
}