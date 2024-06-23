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
    console.log(error)
    res.render('user/signup', { error })
  })
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})

router.get("/cart", verifyLogin, (req, res) => {
  const { user } = req.session
  userHelpers.getCartItems(user._id).then((products) => {
    console.log(products)
    res.render("user/cart", { products, user: user })
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
  const { cartId, productId, changeQty, currentQty } = req.body
  userHelpers.changeCartProductQty(cartId, productId, changeQty, currentQty).then((result) => {
    res.json(result)
  })

})


module.exports = router;
