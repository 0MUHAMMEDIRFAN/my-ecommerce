var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();

function verifyLogin(req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  const { user, loggedIn } = req.session
  console.log(user)
  let cartCount = null;
  if (loggedIn) {
    cartCount = await userHelpers.getCartCount(user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, admin: false, user: user, cartCount });
  })
});

router.get('/login', (req, res) => {
  req.session.loggedIn == true ?
    res.redirect('/') :
    res.render('user/login')
})


router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((result) => {
    // console.log(result)
    req.session.loggedIn = true
    req.session.user = result.userDetails
    res.redirect('/')
  }).catch(error => {
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

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

router.get("/cart", verifyLogin, async (req, res) => {
  const { user } = req.session
  let total = await userHelpers.getTotalCartAmount(user._id)
  userHelpers.getCartItems(user._id).then((products) => {
    res.render("user/cart", { products, user: user, total: total })
  })
})

router.get('/order-placed', verifyLogin, (req, res) => {
  const { user } = req.session
  res.render('user/order-placed', { user })
})

router.get('/orders', verifyLogin, (req, res) => {
  const { user } = req.session
  userHelpers.getOrders(user._id).then((result) => {
    res.render("user/orders", { orders: result, user })
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
    let totalAmount = await userHelpers.getTotalCartAmount(userId)
    result.totalAmount = totalAmount
    res.json(result)
  })

})

router.get('/place-order', verifyLogin, (req, res) => {
  const { user } = req.session
  userHelpers.getTotalCartAmount(user._id).then((result) => {
    res.render('user/place-order', { total: result, user })
  })
})

router.post('/place-order/:userId', verifyLogin, async (req, res) => {
  if (req.body.payment === "COD") {
    let cartItems = await userHelpers.getCartItems(req.params.userId)
    let totalAmount = await userHelpers.getTotalCartAmount(req.params.userId)
    userHelpers.placeOrder(req.body, req.params.userId, cartItems, totalAmount).then((result) => {
      console.log(result)
      res.redirect("/order-placed")
    })
  }
  // userHelpers.getTotalCartAmount(req.session.user._id).then((result) => {
  //   res.render('user/place-order', { total: result[0].total })
  // })
})


module.exports = router;
