let db = require("../config/connection")
let collection = require("../config/collections")
let bcrypt = require("bcrypt")
const { ObjectId } = require("mongodb")
module.exports = {
    doSignup: (userdata) => {
        const { fullname, email, password } = userdata
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject({ message: "Database connection not available", state: false })
                    return
                }
                
                let user = await dbConnection.collection(collection.USER_COLLECTION).findOne({ email: email })
                if (user) {
                    reject({ message: "This user is already registered", state: false })
                } else {
                    let hashedPassword = await bcrypt.hash(password, 10)
                    
                    // Check if this is the admin email
                    let isAdmin = email === 'admin@example.com'
                    
                    let result = await dbConnection.collection(collection.USER_COLLECTION).insertOne({ 
                        fullname, 
                        email, 
                        password: hashedPassword,
                        role: isAdmin ? 'admin' : 'user',
                        createdAt: new Date()
                    })
                    
                    console.log("User created:", { email, role: isAdmin ? 'admin' : 'user' })
                    resolve({ message: "Success", user: result, state: true })
                }
            } catch (error) {
                console.error("Signup error:", error)
                reject({ message: "Signup failed", state: false })
            }
        })
    },

    doLogin: (userdata) => {
        console.log("Login attempt:", userdata)
        return new Promise(async (resolve, reject) => {
            const { username, password } = userdata
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject({ message: "Database connection not available", state: false })
                    return
                }
                
                let user = await dbConnection.collection(collection.USER_COLLECTION).findOne({ email: username })
                console.log("User found:", user ? "Yes" : "No")
                
                if (user) {
                    bcrypt.compare(password, user.password).then((status) => {
                        if (status) {
                            console.log("Password match successful")
                            resolve({ message: "success", state: true, userDetails: user })
                        } else {
                            console.log("Password mismatch")
                            reject({ message: "Password is incorrect", state: false })
                        }
                    }).catch((error) => {
                        console.error("Password comparison error:", error)
                        reject({ message: "Login failed", state: false })
                    })
                } else {
                    console.log("User not found for email:", username)
                    reject({ message: "User not found", state: false })
                }
            } catch (error) {
                console.error("Login error:", error)
                reject({ message: "Login failed", state: false })
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
            ]).toArray()
            resolve(cartItems)
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let Orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray()
            resolve(Orders)
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
    },

    getTotalCartAmount: (userId) => {
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
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] } }
                    }
                }
            ]).toArray()
            resolve(cartItems[0]?.total)
        })
    },

    placeOrder: (orderData, userId, cartItems, totalAmount) => {
        return new Promise((resolve, reject) => {
            let { mobile, address, pincode, payment } = orderData
            let orderStatus = payment === "COD" ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile,
                    address,
                    pincode,
                    payment,
                },
                orderStatus,
                userId: new ObjectId(userId),
                products: cartItems,
                totalAmount,
                date: new Date()

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((result) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) })
                resolve(result)
            })
        })

    },

    // Check if user is admin
    isAdmin: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                let user = await dbConnection.collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(userId) })
                resolve(user && user.role === 'admin')
            } catch (error) {
                console.error("Admin check error:", error)
                reject(error)
            }
        })
    },

    // Create default admin if none exists
    createDefaultAdmin: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                let adminExists = await dbConnection.collection(collection.USER_COLLECTION).findOne({ role: 'admin' })
                if (!adminExists) {
                    let hashedPassword = await bcrypt.hash('admin123', 10)
                    let result = await dbConnection.collection(collection.USER_COLLECTION).insertOne({
                        fullname: 'Admin User',
                        email: 'admin@example.com',
                        password: hashedPassword,
                        role: 'admin',
                        createdAt: new Date()
                    })
                    console.log("Default admin created: admin@example.com / admin123")
                    resolve(result)
                } else {
                    console.log("Admin user already exists")
                    resolve(null)
                }
            } catch (error) {
                console.error("Create admin error:", error)
                reject(error)
            }
        })
    },

    // Generate remember me token
    generateRememberToken: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const crypto = require('crypto');
                const token = crypto.randomBytes(32).toString('hex');
                const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                await dbConnection.collection(collection.USER_COLLECTION).updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $set: { 
                            rememberToken: token, 
                            rememberTokenExpires: expires 
                        } 
                    }
                );
                
                resolve(token);
            } catch (error) {
                console.error("Generate remember token error:", error);
                reject(error);
            }
        });
    },

    // Validate remember me token
    validateRememberToken: (token) => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                const user = await dbConnection.collection(collection.USER_COLLECTION).findOne({
                    rememberToken: token,
                    rememberTokenExpires: { $gt: new Date() }
                });
                
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error("Invalid or expired remember token"));
                }
            } catch (error) {
                console.error("Validate remember token error:", error);
                reject(error);
            }
        });
    },

    // Clear remember me token
    clearRememberToken: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                await dbConnection.collection(collection.USER_COLLECTION).updateOne(
                    { _id: new ObjectId(userId) },
                    { 
                        $unset: { 
                            rememberToken: "", 
                            rememberTokenExpires: "" 
                        } 
                    }
                );
                
                resolve();
            } catch (error) {
                console.error("Clear remember token error:", error);
                reject(error);
            }
        });
    },

    // Quick admin login (for development)
    quickAdminLogin: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                const admin = await dbConnection.collection(collection.USER_COLLECTION).findOne({ role: 'admin' });
                if (admin) {
                    resolve({ message: "success", state: true, userDetails: admin });
                } else {
                    reject({ message: "Admin user not found", state: false });
                }
            } catch (error) {
                console.error("Quick admin login error:", error);
                reject({ message: "Quick admin login failed", state: false });
            }
        });
    },

    // Quick test user login (for development)
    quickTestLogin: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                // Look for a test user with test@example.com or any regular user
                let testUser = await dbConnection.collection(collection.USER_COLLECTION).findOne({ 
                    email: 'test@example.com' 
                });
                
                if (!testUser) {
                    // If test@example.com doesn't exist, get any regular user
                    testUser = await dbConnection.collection(collection.USER_COLLECTION).findOne({ 
                        role: 'user' 
                    });
                }
                
                if (testUser) {
                    resolve({ message: "success", state: true, userDetails: testUser });
                } else {
                    reject({ message: "No test user found", state: false });
                }
            } catch (error) {
                console.error("Quick test login error:", error);
                reject({ message: "Quick test login failed", state: false });
            }
        });
    },

    // Get user count
    getUserCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                const count = await dbConnection.collection(collection.USER_COLLECTION).countDocuments();
                resolve(count);
            } catch (error) {
                console.error("Get user count error:", error);
                reject(error);
            }
        });
    },

    // Get all users for admin management
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                const users = await dbConnection.collection(collection.USER_COLLECTION)
                    .find({})
                    .sort({ _id: -1 })
                    .toArray();
                
                // Don't send passwords to frontend
                const sanitizedUsers = users.map(user => {
                    const { password, ...userWithoutPassword } = user;
                    return {
                        ...userWithoutPassword,
                        joinDate: user._id.getTimestamp(),
                        isAdmin: user.role === 'admin'
                    };
                });
                
                resolve(sanitizedUsers);
            } catch (error) {
                console.error("Get all users error:", error);
                reject(error);
            }
        });
    },

    // Get all orders for admin management
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const dbConnection = db.get()
                if (!dbConnection) {
                    reject(new Error("Database connection not available"))
                    return
                }
                
                const orders = await dbConnection.collection(collection.ORDER_COLLECTION)
                    .find({})
                    .sort({ _id: -1 })
                    .toArray();
                
                // Get user details for each order
                const ordersWithUsers = await Promise.all(orders.map(async (order) => {
                    const user = await dbConnection.collection(collection.USER_COLLECTION)
                        .findOne({ _id: order.userId });
                    
                    return {
                        ...order,
                        user: user || { name: 'Unknown User', email: 'N/A' },
                        orderDate: order._id.getTimestamp(),
                        status: order.status || 'pending'
                    };
                }));
                
                resolve(ordersWithUsers);
            } catch (error) {
                console.error("Get all orders error:", error);
                reject(error);
            }
        });
    },

    getCartProductDetails: (cartId, productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cart = await db.get().collection(collection.CART_COLLECTION).findOne({ _id: new ObjectId(cartId) });
                if (cart && cart.products) {
                    const product = cart.products.find(p => p.item.toString() === productId.toString());
                    if (product) {
                        const productDetails = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) });
                        resolve({
                            price: productDetails ? productDetails.Price : 0,
                            quantity: product.quantity
                        });
                    } else {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            } catch (error) {
                reject(error);
            }
        });
    },
}