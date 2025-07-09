var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();

// Admin verification middleware
function verifyAdmin(req, res, next) {
  if (req.session.loggedIn && req.session.user) {
    userHelpers.isAdmin(req.session.user._id).then((isAdmin) => {
      if (isAdmin) {
        next()
      } else {
        res.redirect('/login?error=admin_required')
      }
    }).catch((error) => {
      console.error("Admin verification error:", error)
      res.redirect('/login?error=admin_required')
    })
  } else {
    res.redirect('/login?error=admin_required')
  }
}

/* GET admin dashboard */
router.get('/', verifyAdmin, function (req, res, next) {
  console.log("Admin dashboard accessed by:", req.session.user.email);
  productHelpers.getAllProducts().then((products) => {
    console.log("Products fetched successfully, count:", products.length);
    res.render("admin/view-products", { products, admin: true, user: req.session.user });
  }).catch((error) => {
    console.error("Error fetching products:", error)
    res.render("admin/view-products", { products: [], admin: true, user: req.session.user, error: "Failed to load products" });
  })
});

router.get('/add-product', verifyAdmin, (req, res, next) => {
  res.render("admin/add-Product", { admin: true, user: req.session.user })
})

router.get('/orders', verifyAdmin, (req, res, next) => {
  userHelpers.getAllOrders().then((orders) => {
    res.render("admin/orders", { 
      admin: true, 
      user: req.session.user, 
      orders: orders,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length
    })
  }).catch((error) => {
    console.error("Error fetching orders:", error);
    res.render("admin/orders", { 
      admin: true, 
      user: req.session.user, 
      orders: [],
      error: "Failed to load orders"
    })
  })
})

router.get('/users', verifyAdmin, (req, res, next) => {
  userHelpers.getAllUsers().then((users) => {
    res.render("admin/users", { 
      admin: true, 
      user: req.session.user, 
      users: users,
      totalUsers: users.length,
      adminUsers: users.filter(u => u.isAdmin).length,
      regularUsers: users.filter(u => !u.isAdmin).length
    })
  }).catch((error) => {
    console.error("Error fetching users:", error);
    res.render("admin/users", { 
      admin: true, 
      user: req.session.user, 
      users: [],
      error: "Failed to load users"
    })
  })
})

router.get('/analytics', verifyAdmin, (req, res, next) => {
  res.render("admin/analytics", { admin: true, user: req.session.user })
})

router.get('/settings', verifyAdmin, (req, res, next) => {
  res.render("admin/settings", { admin: true, user: req.session.user })
})

router.get('/profile', verifyAdmin, (req, res, next) => {
  res.render("admin/profile", { admin: true, user: req.session.user })
})

router.post('/add-product', verifyAdmin, (req, res) => {
  // console.log(req.body)
  // console.log(req.files)
  productHelpers.addProducts(req.body, (id) => {
    if (id instanceof Error) {
      console.error("Error adding product:", id)
      res.render("admin/add-Product", { admin: true, user: req.session.user, error: "Failed to add product" })
      return
    }
    
    let image = req.files?.Image
    image ? image.mv('./public/images/product-images/' + id + '.png', (err) => {
      if (!err) {
        res.redirect("/admin")
      } else {
        res.render("admin/add-Product", { admin: true, user: req.session.user, error: "Failed to upload image" })
        console.log(err)
      }
    }) :
      res.redirect("/admin")
  })
})

router.get('/edit-product/', verifyAdmin, (req, res, next) => {
  let productId = req.query.id
  let product;
  if (productId) {
    productHelpers.getProduct(productId).then((result) => {
      product = result
      res.render('admin/edit-product', { product, admin: true, user: req.session.user })
    }).catch((error) => {
      console.error("Error fetching product:", error)
      res.redirect("/admin")
    })
  } else {
    res.redirect("/admin")
  }
})

router.post('/edit-product/', verifyAdmin, (req, res, next) => {
  productHelpers.editProduct(req.query.id, req.body).then((result) => {
    let image = req.files?.Image
    image ? image.mv('./public/images/product-images/' + req.query.id + '.png', (err) => {
      if (!err) {
        res.redirect("/admin")
      } else {
        console.log(err)
        res.redirect("/admin")
      }
    }) :
      res.redirect("/admin")
  }).catch((error) => {
    console.error("Error editing product:", error)
    res.redirect("/admin")
  })
})

router.get('/delete-product/:id', verifyAdmin, (req, res, next) => {
  let productId = req.params.id
  productHelpers.deleteProduct(productId).then((result) => {
    res.redirect('/admin/')
  }).catch((error) => {
    console.error("Error deleting product:", error)
    res.redirect('/admin/')
  })
})

module.exports = router;
