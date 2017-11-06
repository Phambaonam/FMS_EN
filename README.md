# FMS_EN (furniture mon store express nunjucks)
#### Projec sử dụng express + nunjucks+ postgresql/mysql
# Cách lưu trạng thái của giỏ hàng:
## Đối với khách hàng khi thêm sản phẩm vào giỏ hàng có 2 trạng thái:
### Chưa login:
* Lưu trạng thái của giỏ hàng vào trong req.session bằng cách tạo thêm 1 thuộc tính `sumProdut`: `req.session.sumProduct`
* Cứ  mỗi lần user thêm sản phẩm vào giỏ hàng thì ta lại update lại `req.session.sumProduct`.
* Do sử dụng `stateless` để thêm sản phẩm nên bên server ta phải gửi lại cho bên client 1 `response` để các thông tin mà ta đã thêm bên `stateless` được lưu vào session.
```javascript
    req.session.passport ? (req.session.passport.user.sumProduct = parseInt(getSum.sum)) : (req.session.sumProduct = parseInt(getSum.sum))
```

### Đã login: 
* Khi user login thành công thì trong `req.session` tồn tại `req.session.passport.user` - là cái chứa thông tin của người dùng đăng nhập mà ta đã cấu hình ở bên `passport`.
* Lúc này ta sẽ lưu trạng thái của gior hàng vào trong `req.session.passport.user` với thuộc tính mới là `req.session.passport.user.sumProduct`.
* Khi mỗi lần user thêm sản phẩm vào giỏ hàng ta cũng update lại `req.session.passport.user.sumProduct`.
```javascript
    req.session.passport ? (req.session.passport.user.sumProduct = parseInt(getSum.sum)) : (req.session.sumProduct = parseInt(getSum.sum))
```

* Để hiển thị số sản phẩm bên trong giỏ hàng khi mà mỗi lần user đăng nhập thì bên trong `passport`, ta phải lấy ra tổng số sản phẩm có trong giỏ hàng từ bên trong db và gán vào `req.session.passport.user`.
```javascript
    if (!getUser.sumProduct) getUser.sumProduct = getCart.sum
    if (!getUser.sumWishlish) getUser.sumWishlish = getWishlish.count
```

### Gán thông tin của giỏ hàng vào trong session ở middleware để sử dụng cho cả ứng dụng.
```javascript
    res.locals.carts = (req.session.passport) ? req.session.passport.user.sumProduct : req.session.sumProduct
```
* Tùy vào người dùng đã đăng nhập hay chưa ta sẽ lấy ra dc giở hàng tương ứng.