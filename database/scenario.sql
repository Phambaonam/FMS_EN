# Vấn đề gặp phải khi thiết kế CSDL:
1. Dữ liệu khó chuẩn hóa: Có nhiều chủng loại mặt hàng, mỗi mặt hàng có những thuộc tính khác nhau.
  * 1 cái bát tô: chất liệu, màu sắc, kích thước (chiều cao, chiều sâu).
  * 1 cái bàn: chất liệu, kích thước (chiều cao, đường kính).
  * 1 chiếc gương trang điểm: chất liệu, kích thước (chiều ngang, chiều cao, chiều sâu).
  * 1 chiếc đồng hồ: chất liệu, màu sắc (đỏ, vàng, xanh, ...), kích thước(đường kính).
  * 1 lọ hoa có thể có xuất xứ hoặc không, cũng có thể có nhà sản xuất.
  * 1 chiếc giường có cùng màu sắc, chất liệu nhưng kích thước khác nhau thì giá bán cũng khác nhau.
2. Các tình huống có thể gặp phải:
  * 1 lọ hoa hay 1 chiếc đồng hồ có thể để ở phòng khách, phòng ngủ, phòng làm việc ...
  * 1 chiếc bàn ăn chỉ có thể đặt ở phòng ăn mà thể đặt ở phòng tắm hay phòng ngủ dc.
  * Xóa 1 sản phẩm thì thuộc tính và giá của sản phẩm cũng bị xóa theo - ON DELETE CASCADE - unique.
  * 1 sản phẩm có nhiều thuộc tính, mỗi thuộc tính sẽ có 1 giá khác nhau. khi xóa 1 thuộc tính thì giá cũng bị xóa theo
  mà không ảnh hưởng đến sản phẩm.
-----------------------------------------
# Đặc điểm của PRIMARY KEY:
- Giá trị của trường chứa PRIMARY KEY thì UNIQUE và NOT NULL

# Tác dụng sử dụng unique và cặp primary key ,cascade delete trong 1 bảng:
- Khi 1 column hoặc 1 nhóm column sử dụng UNIQUE thì giá trị từng row của những column đó luôn là duy nhất.
- Sử dụng ON DELETE CASCADE: để xóa dữ liệu của các bảng có mối liên hệ ( relation ship) đến nhau, khi xóa 1 row bảng
cha thì dữ liệu của bảng con có liên quan đến row của bảng cha cũng bị xóa theo.
- Sử dụng ON DELETE RESTRICT:
- Cặp PRIMARY KEY: Giống tương tự PRIMARY KEY.
- Ví dụ:

```
CREATE TABLE IF NOT EXISTS attribute_product (
    attribute_product_id INT,
    attributes JSONB NOT NULL,
    product_id INT REFERENCES product(product_id) ON DELETE CASCADE,
    PRIMARY KEY (attribute_product_id)
);
CREATE TABLE IF NOT EXISTS product_price (
    product_price_id INT,
    product_price CHAR(255) NOT NULL,
    original_price CHAR(255) NOT NULL,
    sale_off_price CHAR(255),
    time_create TIMESTAMP NOT NULL,
    attribute_product_id INT REFERENCES attribute_product(attribute_product_id) ON DELETE CASCADE,
    PRIMARY KEY (product_price_id,attribute_product_id)
```
+ Trong ví dụ trên 1 attribute_product chỉ có 1 và chỉ 1 product_price, do vậy dùng cặp PRIMARY KEY(..., ...) để đảm bảo rằng trong bảng product_price
giá trị của các attribute_product_id k có giá trị nào giống nhau.
-----------------------------------------
# Test bằng câu lệnh truy vấn
1.
a. Lấy tất cả thông tin của 1 sản phẩm: ảnh, tên sản phẩm, nhà sản xuất, giá gốc, giá bán ra, giá khuyến mại,
   số lượt rating, số lượt yêu thích, miêu tả, thông số, trạng thái sản phẩm, ngày thêm sản phẩm bằng bảng

        SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create, ca.category_id, ar.area_id
        FROM product AS pr
        JOIN category AS ca ON pr.category_id = ca.category_id
        JOIN area AS ar ON pr.area_id = ar.area_id
        JOIN attribute_product as ap ON pr.product_id = ap.product_id
        JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
        ORDER BY pr.product_id ASCORDER BY pr.product_id ASC;

b. Dữ liệu dưới dạng Json

SELECT json_build_object(
    'product_id', pr.product_id,
    'product_name', pr.product_name,
    'image', pr.image,
    'description', pr.description,
	'attributes', ap.attributes,
    'product_price', pp.product_price,
    'original_price', pp.original_price,
    'sale_off_price', pp.sale_off_price,
    'time_create', pp.time_create
)
FROM product AS pr
JOIN attribute_product AS ap ON ap.product_id = pr.product_id
JOIN product_price AS pp ON pp.product_id = ap.product_id
WHERE pr.product_id = 4;

﻿SELECT row_to_json(row)
FROM (
   ﻿SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create FROM product AS pr
    JOIN attribute_product as ap ON pr.product_id = ap.product_id
    JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id BY pr.product_id ASC
	WHERE pr.product_id = 4
) row;



2. Tìm tất sản phẩm có trong CSDL.
SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create, ca.category_id, ar.area_id
FROM product AS pr
JOIN category AS ca ON pr.category_id = ca.category_id
JOIN area AS ar ON pr.area_id = ar.area_id
JOIN attribute_product as ap ON pr.product_id = ap.product_id
JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
ORDER BY pr.product_id ASC;

a. Tìm sản phẩm với điều kiện nào đó
SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create FROM product AS pr
JOIN attribute_product as ap ON pr.product_id = ap.product_id
JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
WHERE pr.product_id = 5

-------- Draft ---------
SELECT DISTINCT ON (N.product_id, N.product_price,N.original_price, N.sale_off_price, N.time_create)
N.product_id ,N.product_name,N.image, N.description, N.attributes, N.product_price, N.original_price, N.sale_off_price, N.time_create
FROM (
    SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create
    FROM product AS pr
    JOIN attribute_product AS ap ON ap.product_id = pr.product_id
    JOIN product_price AS pp ON pp.product_id = ap.product_id
    ORDER BY pr.product_id ASC
) AS N WHERE N.product_name = 'Juice - Clam, 46 Oz';
------------------------

b. Dữ liệu dưới dạng Json
SElECT array_to_json(array_agg(data.row_to_json))
FROM (
    SELECT row_to_json(row)
    FROM (
        SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create, ca.category_id, ar.area_id FROM product AS pr
        JOIN category AS ca ON pr.category_id = ca.category_id
        JOIN area AS ar ON pr.area_id = ar.area_id
        JOIN attribute_product as ap ON pr.product_id = ap.product_id
        JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
        ORDER BY pr.product_id ASC
    ) AS row
) AS data

- Tìm theo điều kiện:

SElECT array_to_json(array_agg(data.row_to_json))
FROM (
    SELECT row_to_json(row)
    FROM (
        SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price, pp.time_create FROM product AS pr
        JOIN attribute_product as ap ON pr.product_id = ap.product_id
        JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
       WHERE pr.product_id = 2
    ) AS row
) AS data
# Tham khảo link
https://stackoverflow.com/questions/26486784/return-as-array-of-json-objects-in-sql-postgres
https://stackoverflow.com/questions/24006291/postgresql-return-result-set-as-json-array

3. Chỉnh sửa thông tin của sản phẩm

# Chỉnh sửa attribute của sản phẩm.
