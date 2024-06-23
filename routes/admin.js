var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true });
  })
});

router.get('/add-product', (req, res, next) => {
  res.render("admin/add-Product", { admin: true })
})

router.post('/add-product', (req, res) => {
  // console.log(req.body)
  // console.log(req.files)
  productHelpers.addProducts(req.body, (id) => {
    let image = req.files?.Image
    image ? image.mv('./public/images/product-images/' + id + '.png', (err) => {
      if (!err) {
        res.redirect("/admin")
      } else {
        res.end()
        console.log(err)
      }
    }) :
      res.redirect("/admin")

  })
})

router.get('/edit-product/', (req, res, next) => {
  let productId = req.query.id
  let product;
  if (productId) {
    productHelpers.getProduct(productId).then((result) => {
      product = result
      res.render('admin/edit-product', { product })
    })
  } else {
    res.redirect("/admin")
  }
})

router.post('/edit-product/', (req, res, next) => {
  productHelpers.editProduct(req.query.id, req.body).then((result) => {
    let image = req.files?.Image
    image ? image.mv('./public/images/product-images/' + req.query.id + '.png', (err) => {
      if (!err) {
        res.redirect("/admin")
      } else {
        res.end()
        console.log(err)
      }
    })
      : res.redirect("/admin")
  })
})

router.get('/delete-product/:id', (req, res, next) => {
  let productId = req.params.id
  productHelpers.deleteProduct(productId).then((result) => {
    res.redirect('/admin/')
  })
})


module.exports = router;
