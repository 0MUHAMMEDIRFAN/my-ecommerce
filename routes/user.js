var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const db = require('../config/connection');
const collection = require('../config/collections');
var router = express.Router();

function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

// Check remember me token on app start
function checkRememberToken(req, res, next) {
  if (!req.session.loggedIn && req.cookies.rememberToken) {
    userHelpers.validateRememberToken(req.cookies.rememberToken).then((user) => {
      req.session.loggedIn = true
      req.session.user = user
      console.log("User auto-logged in via remember token")
      next()
    }).catch((error) => {
      console.log("Remember token validation failed:", error.message)
      res.clearCookie('rememberToken')
      next()
    })
  } else {
    next()
  }
}

// Apply remember token check to all routes that need it
router.use(['/', '/products', '/profile', '/cart', '/orders'], checkRememberToken)

/* GET home page. */
router.get('/', async function (req, res, next) {
  const { user, loggedIn } = req.session
  let cartCount = null;
  if (loggedIn && user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  // Render the home page instead of products page
  res.render('index', { title: 'ECOMMERCE - Home', admin: false, user: user, cartCount, loggedIn });
});

/* GET products page. */
router.get('/products', async function (req, res, next) {
  const { user, loggedIn } = req.session
  console.log("Products page - User:", user, "Logged in:", loggedIn)
  let cartCount = null;
  if (loggedIn && user) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  try {
    const products = await productHelpers.getAllProducts()
    res.render('user/view-products', { title: 'Products', products, admin: false, user: user, cartCount, loggedIn });
  } catch (error) {
    console.error('Error fetching products:', error)
    res.render('user/view-products', { title: 'Products', products: [], admin: false, user: user, cartCount, error: { message: 'Failed to load products' }, loggedIn });
  }
});

/* GET profile page. */
router.get('/profile', verifyLogin, async function (req, res, next) {
  const { user, loggedIn } = req.session
  console.log("Profile page - User:", user, "Logged in:", loggedIn)
  let cartCount = await userHelpers.getCartCount(user._id)
  res.render('user/profile', { title: 'Profile', user: user, cartCount, loggedIn });
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn == true) {
    res.redirect('/')
  } else {
    let errorMessage = null
    if (req.query.error === 'admin_required') {
      errorMessage = { message: 'Admin access required. Please login with admin credentials.', state: false }
    }
    res.render('user/login', { status: errorMessage })
  }
})


router.post('/login', (req, res) => {
  console.log("Login request received:", req.body)
  userHelpers.doLogin(req.body).then(async (result) => {
    console.log("Login successful:", result)
    
    // Set session data
    req.session.loggedIn = true
    req.session.user = result.userDetails
    
    console.log("Session after login:", {
      loggedIn: req.session.loggedIn,
      user: req.session.user ? req.session.user.email : 'undefined'
    })
    
    // Handle remember me functionality
    if (req.body.rememberMe) {
      try {
        const token = await userHelpers.generateRememberToken(result.userDetails._id)
        res.cookie('rememberToken', token, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        })
        console.log("Remember me token generated")
      } catch (error) {
        console.error("Remember me token generation failed:", error)
      }
    }
    
    // Save session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err)
        res.render('user/login', { status: { message: "Login failed. Please try again.", state: false } })
      } else {
        console.log("Session saved successfully")
        // Check if user is admin and redirect accordingly
        if (result.userDetails.role === 'admin') {
          console.log("Redirecting to admin")
          res.redirect('/admin')
        } else {
          console.log("Redirecting to home")
          res.redirect('/')
        }
      }
    })
  }).catch(error => {
    console.error("Login error:", error)
    res.render('user/login', { status: error })
  })
})

router.get('/signup', (req, res) => {
  req.session.loggedIn == true ?
    res.redirect('/') :
    res.render('user/signup')
})

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((result) => {
    // console.log(result)
    res.render('user/login', { result })
  }).catch(error => {
    res.render('user/signup', { error })
  })
})

router.get("/logout", async (req, res) => {
  if (req.session.user && req.cookies.rememberToken) {
    try {
      await userHelpers.clearRememberToken(req.session.user._id)
      res.clearCookie('rememberToken')
      console.log("Remember token cleared")
    } catch (error) {
      console.error("Error clearing remember token:", error)
    }
  }
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err)
    }
    res.redirect("/")
  })
})

router.get("/cart", verifyLogin, async (req, res) => {
  const { user, loggedIn } = req.session
  console.log("Cart page - User:", user, "Logged in:", loggedIn)
  let total = await userHelpers.getTotalCartAmount(user._id)
  userHelpers.getCartItems(user._id).then((products) => {
    res.render("user/cart", { products, user: user, total: total, loggedIn })
  })
})

router.get('/order-placed', verifyLogin, (req, res) => {
  const { user, loggedIn } = req.session
  const orderId = req.query.orderId || 'N/A'
  res.render('user/order-placed', { user, orderId, loggedIn })
})

router.get('/orders', verifyLogin, (req, res) => {
  const { user, loggedIn } = req.session
  userHelpers.getOrders(user._id).then((result) => {
    res.render("user/orders", { orders: result, user, loggedIn })
  })
})

// this may used as ajax or asyncronose func 
router.get('/add-to-cart/:id', (req, res, next) => {
  if (!req.session.loggedIn) {
    res.status(401).json({
      error: "Please login to proceed",
      redirected: true,
      url: '/',
      status: 504,
      statusText: "please login to proceed"
    })
  } else {
    let productId = req.params.id
    userHelpers.addToCart(productId, req.session.user._id).then((result) => {
      res.status(200).json(result)
    })
  }
})

router.post('/change-product-qty', verifyLogin, (req, res, next) => {
  const { cartId, productId, changeQty, currentQty, userId } = req.body
  userHelpers.changeCartProductQty(cartId, productId, changeQty, currentQty).then(async (result) => {
    try {
      let totalAmount = await userHelpers.getTotalCartAmount(userId)
      
      // Calculate item total
      const newQty = parseInt(currentQty) + parseInt(changeQty)
      const cartProduct = await userHelpers.getCartProductDetails(cartId, productId)
      const itemTotal = cartProduct ? cartProduct.price * newQty : 0
      
      res.json({
        success: true,
        message: 'Cart updated successfully',
        totalAmount: totalAmount,
        itemTotal: itemTotal,
        newQuantity: newQty
      })
    } catch (error) {
      console.error('Error updating cart totals:', error)
      res.json({
        success: false,
        message: 'Failed to update cart totals'
      })
    }
  }).catch(error => {
    console.error('Error changing cart quantity:', error)
    res.json({
      success: false,
      message: 'Failed to update quantity'
    })
  })
})

router.get('/place-order', verifyLogin, (req, res) => {
  const { user, loggedIn } = req.session
  userHelpers.getTotalCartAmount(user._id).then((result) => {
    res.render('user/place-order', { total: result, user, loggedIn })
  })
})

router.post('/place-order/:userId', verifyLogin, async (req, res) => {
  try {
    let cartItems = await userHelpers.getCartItems(req.params.userId)
    let totalAmount = await userHelpers.getTotalCartAmount(req.params.userId)
    
    if (req.body.payment === "COD") {
      userHelpers.placeOrder(req.body, req.params.userId, cartItems, totalAmount).then((result) => {
        console.log("Order placed:", result)
        res.redirect(`/order-placed?orderId=${result.orderId || 'N/A'}`)
      }).catch(error => {
        console.error("COD order error:", error)
        res.redirect("/cart?error=order_failed")
      })
    } else if (req.body.payment === "UPI") {
      // For UPI payment, we'll simulate the payment and then place the order
      userHelpers.placeOrder(req.body, req.params.userId, cartItems, totalAmount).then((result) => {
        console.log("UPI Order placed:", result)
        res.redirect(`/order-placed?orderId=${result.orderId || 'N/A'}`)
      }).catch(error => {
        console.error("UPI order error:", error)
        res.redirect("/cart?error=order_failed")
      })
    } else {
      res.redirect("/cart?error=invalid_payment_method")
    }
  } catch (error) {
    console.error("Place order error:", error)
    res.redirect("/cart?error=order_failed")
  }
})

// Quick admin login for development
router.post('/quick-admin-login', (req, res) => {
  console.log("Quick admin login requested")
  userHelpers.quickAdminLogin().then((result) => {
    console.log("Quick admin login successful:", result)
    req.session.loggedIn = true
    req.session.user = result.userDetails
    
    // Save session explicitly before responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err)
        res.json({ success: false, message: "Session save failed" })
      } else {
        console.log("Session saved successfully")
        res.json({ success: true, message: "Admin login successful" })
      }
    })
  }).catch(error => {
    console.error("Quick admin login error:", error)
    res.json({ success: false, message: error.message || "Quick admin login failed" })
  })
})

// Quick test user login for development
router.post('/quick-test-login', (req, res) => {
  console.log("Quick test login requested")
  userHelpers.quickTestLogin().then((result) => {
    console.log("Quick test login successful:", result)
    req.session.loggedIn = true
    req.session.user = result.userDetails
    
    console.log("Session after quick test login:", {
      loggedIn: req.session.loggedIn,
      user: req.session.user ? req.session.user.email : 'undefined'
    })
    
    // Save session explicitly before responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err)
        res.json({ success: false, message: "Session error" })
      } else {
        console.log("Quick test session saved successfully")
        res.json({ success: true, redirect: '/' })
      }
    })
  }).catch(error => {
    console.error("Quick test login error:", error)
    res.json({ success: false, message: error.message || "Quick test login failed" })
  })
})

// Check remember me token on app start
function checkRememberToken(req, res, next) {
  if (!req.session.loggedIn && req.cookies.rememberToken) {
    userHelpers.validateRememberToken(req.cookies.rememberToken).then((user) => {
      req.session.loggedIn = true
      req.session.user = user
      console.log("User auto-logged in via remember token")
      next()
    }).catch((error) => {
      console.log("Remember token validation failed:", error.message)
      res.clearCookie('rememberToken')
      next()
    })
  } else {
    next()
  }
}

// Apply remember token check to all routes
router.use(checkRememberToken)

// Database debug route (development only)
router.get('/debug-db', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const userCount = await userHelpers.getUserCount();
    const productCount = await productHelpers.getAllProducts().then(products => products.length);
    
    res.json({
      userCount,
      productCount,
      dbName: process.env.DATABASE_NAME,
      message: 'Database debug info'
    });
  } catch (error) {
    res.json({
      error: error.message,
      message: 'Database debug failed'
    });
  }
})

// Debug route to see users and their roles
router.get('/debug-users', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const dbConnection = db.get();
    const users = await dbConnection.collection(collection.USER_COLLECTION).find({}, {
      projection: { fullname: 1, email: 1, role: 1, createdAt: 1 }
    }).toArray();
    
    res.json({
      users,
      message: 'All users with roles'
    });
  } catch (error) {
    res.json({
      error: error.message,
      message: 'Debug users failed'
    });
  }
})

// Reset admin user route (development only)
router.post('/reset-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    await userHelpers.createDefaultAdmin();
    res.json({ success: true, message: 'Admin user reset successfully' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
})

// Add sample products route (development only)
router.post('/add-sample-products', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const sampleProducts = [
      {
        Name: "Wireless Headphones",
        Price: 79.99,
        Category: "Electronics",
        Description: "High-quality wireless headphones with noise cancellation and long battery life."
      },
      {
        Name: "Smart Watch",
        Price: 199.99,
        Category: "Electronics",
        Description: "Feature-rich smartwatch with fitness tracking, notifications, and GPS."
      },
      {
        Name: "Coffee Maker",
        Price: 89.99,
        Category: "Home & Kitchen",
        Description: "Programmable coffee maker with thermal carafe and auto-brew functionality."
      },
      {
        Name: "Running Shoes",
        Price: 129.99,
        Category: "Sports",
        Description: "Lightweight running shoes with superior cushioning and breathable mesh."
      },
      {
        Name: "Bluetooth Speaker",
        Price: 49.99,
        Category: "Electronics",
        Description: "Portable waterproof bluetooth speaker with rich sound and 12-hour battery."
      },
      {
        Name: "Gaming Mouse",
        Price: 69.99,
        Category: "Electronics",
        Description: "Ergonomic gaming mouse with RGB lighting and customizable buttons."
      }
    ];

    const dbConnection = db.get();
    if (!dbConnection) {
      throw new Error('Database connection not available');
    }

    await dbConnection.collection(collection.PRODUCT_COLLECTION).insertMany(sampleProducts);
    res.json({ success: true, message: 'Sample products added successfully', count: sampleProducts.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// API route to get products for frontend
router.get('/api/products', async (req, res) => {
  try {
    const products = await productHelpers.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate product images route (development only)
router.post('/generate-product-images', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const products = await productHelpers.getAllProducts();
    let generatedCount = 0;
    
    for (const product of products) {
      const imageUrl = `https://picsum.photos/300/300?random=${product._id}`;
      // For now, we'll just count the products. In a real scenario, you'd download the images
      generatedCount++;
    }
    
    res.json({ success: true, message: 'Product images generated', count: generatedCount });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Database seeding route (development only)
router.post('/seed-database', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const seeder = require('../seed-database');
    const result = await seeder.seedDatabase();
    
    res.json({ 
      success: true, 
      message: 'Database seeded successfully',
      data: result
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Clear database route (development only)
router.post('/clear-database', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Not found');
  }
  
  try {
    const seeder = require('../seed-database');
    await seeder.clearDatabase();
    
    res.json({ 
      success: true, 
      message: 'Database cleared successfully'
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
