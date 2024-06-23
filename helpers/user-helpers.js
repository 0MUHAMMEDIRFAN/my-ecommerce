let db = require("../config/connection")
let collection = require("../config/collections")
let bcrypt = require("bcrypt")
const { ObjectId } = require("mongodb")
module.exports = {
    doSignup: (userdata) => {
        const { fullname, email, password } = userdata
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: email })
            if (user) {
                reject({ message: "This user Already registered", state: false })
            } else {
                let hashedPassword = await bcrypt.hash(password, 10)
                let result = await db.get().collection(collection.USER_COLLECTION).insertOne({ fullname, email, password: hashedPassword })
                resolve({ message: "Success", user: result, state: true, })
            }
        })
    },

    doLogin: (userdata) => {
        console.log("wait")
        return new Promise(async (resolve, reject) => {
            const { username, password } = userdata
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: username })
            if (user) {
                bcrypt.compare(password, user.password).then((status) => {
                    if (status) {
                        resolve({ message: "success", state: true, userDetails: user })
                    } else {
                        reject({ message: "password is incorrect", state: false })
                    }
                })
            } else {
                reject({ message: "User not found", state: false })
            }
        })
    },

    addToCart: (productId, userId) => {
        let prodObj = {
            item: new ObjectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let usercart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            if (usercart) {
                let prodExist = usercart.products.findIndex(product => product.item == productId)
                console.log(prodExist)
                if (prodExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(productId) },
                        {
                            $inc: { 'products.$.quantity': 1 }

                        }).then((result) => {
                            resolve(result)
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new ObjectId(userId) }, {
                        $push: { products: prodObj }
                    }).then((result) => {
                        resolve(result)
                    })
                }

            } else {
                let cartData = {
                    user: new ObjectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartData).then((result) => {
                    resolve(result)
                })
            }

        })
    },

    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
                // {
                //     $lookup: {
                //         from: collection.PRODUCT_COLLECTION,
                //         let: { productList: '$products' },
                //         pipeline: [
                //             {
                //                 $match: {
                //                     $expr: {
                //                         $in: ['$_id', '$$productList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as: 'cartProducts'
                //     }
                // }
            ]).toArray()
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) })
            let count = null
            if (cart) {
                count = cart.products.length
            }
            resolve(count)

        })
    },

    changeCartProductQty: (cartId, productId, changeQty, currentQty) => {
        return new Promise((resolve, reject) => {
            if ((changeQty == -1 && currentQty == 1) || changeQty == "delete") {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(cartId), 'products.item': new ObjectId(productId) },
                    {
                        $pull: { products: { item: new ObjectId(productId) } }
                    }).then((result) => {
                        resolve(result)
                    }).catch(error => {
                        reject(error)
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new ObjectId(cartId), 'products.item': new ObjectId(productId) },
                    {
                        $inc: { 'products.$.quantity': parseInt(changeQty) }

                    }).then((result) => {
                        resolve(result)
                    }).catch(error => {
                        reject(error)
                    })
            }
        })
    }


}