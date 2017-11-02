DROP TABLE IF EXISTS area, category, category_product, product, attribute_product, product_price;
CREATE TABLE IF NOT EXISTS area (
    id SERIAL PRIMARY KEY,
    area_name VARCHAR(255) NOT NULL,
    area_alias VARCHAR(255) NOT NULL,
    time_create DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name_category VARCHAR(255) NOT NULL,
    category_alias VARCHAR(255) NOT NULL,
    time_create DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS category_product (
    id SERIAL PRIMARY KEY,
    name_category_product VARCHAR(255) UNIQUE NOT NULL,
    group_by_category BOOLEAN,
    areas TEXT [] NOT NULL,
    category_product_alias VARCHAR(255) NOT NULL,
    time_create DATE NOT NULL,
    category_id INT REFERENCES category(id) ON DELETE CASCADE NOT NULL
);
CREATE TABLE IF NOT EXISTS product (
    id SERIAL PRIMARY KEY,
    ucp VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,   
    description TEXT NOT NULL,
    product_alias VARCHAR(255) NOT NULL,
    category_product_id INT REFERENCES category_product(id) ON DELETE CASCADE NOT NULL
);
CREATE TABLE IF NOT EXISTS attribute_product (
    id SERIAL PRIMARY KEY,
    images JSON NOT NULL,
    attributes JSONB NOT NULL,
    option_status json NOT NULL,
    total INT NOT NULL,
    rest_of_product INT,
    product_id INT REFERENCES product(id) ON DELETE CASCADE NOT NULL
);
CREATE TABLE IF NOT EXISTS product_price (
    id SERIAL PRIMARY KEY,
    product_price VARCHAR(255) NOT NULL,
    original_price VARCHAR(255) NOT NULL,
    sale_off_price VARCHAR(255),
    time_create CHAR(50) NOT NULL,
    attribute_product_id INT REFERENCES attribute_product(id) ON DELETE CASCADE NOT NULL
);
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    session_user_id VARCHAR(255),
    attribute_product_id INT REFERENCES attribute_product(id) ON DELETE CASCADE NOT NULL,
    quantity INT,
    event_id INT,
    total FLOAT
);
CREATE TABLE IF NOT EXISTS customer (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone CHAR  (20),
    image VARCHAR(255),
    date_of_birth CHAR(50),
    general CHAR(10),
    time_register CHAR(50),
    address_receiver TEXT [],
    token_register VARCHAR(255),
    verify_token_register VARCHAR(255),
    role CHAR(10)
);

\COPY area(id,area_name,area_alias,time_create) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/area.csv' DELIMITER ',' CSV HEADER;

COPY area(id,area_name,area_alias,time_create) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/area.csv' DELIMITER ',' CSV HEADER;
COPY category(id,name_category,category_alias,time_create) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/category.csv' DELIMITER ',' CSV HEADER;
COPY category_product(id,name_category_product,group_by_category,areas,category_product_alias,time_create,category_id) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/category_product.csv' DELIMITER ',' CSV HEADER;
COPY product(id,ucp,product_name,description,product_alias,category_product_id) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/product.csv' DELIMITER ',' CSV HEADER;
COPY attribute_product(id,images,attributes,option_status,total,rest_of_product,product_id) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/attribute_product.csv' DELIMITER ',' CSV HEADER;
COPY product_price(id,product_price,original_price,sale_off_price,time_create,attribute_product_id) FROM '/home/doremonsun/Desktop/DoAn/FMS_EN/database/product_price.csv' DELIMITER ',' CSV HEADER;



-- insert into area ( area_id, area_name, time_create ) values(1, 'Phòng khách','12/13/2017');
-- insert into area ( area_id, area_name, time_create ) values(2, 'Phòng Ngủ','12/12/2017');
-- insert into area ( area_id, area_name, time_create ) values(3, 'Phòng Ăn','12/12/2017');
-- insert into area ( area_id, area_name, time_create ) values(4, 'Phòng Học & Làm Việc','12/12/2017');
-- insert into area ( area_id, area_name, time_create ) values(5, 'Phòng Tắm','12/12/2017');
-- insert into area ( area_id, area_name, time_create ) values(6, 'Nhà Bếp','12/12/2017');
-- insert into area ( area_id, area_name, time_create ) values(7, 'Phòng Chứa Đồ','12/12/2017');
-- insert into category (name_category, time_create ) values('Bàn','12/12/1994');
-- insert into category (name_category, time_create ) values('Ghế','12/12/2017');
-- insert into category (name_category, time_create ) values('Tủ','12/12/2017');
-- insert into category (name_category, time_create ) values('Nệm và Giường Ngủ','12/12/2017');
-- insert into category (name_category, time_create ) values('Đồ Trang Trí','12/12/2017');
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(1, 'bàn cà phê',1,1);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(2, 'ghế ăn',2,3);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(3, 'tủ quần áo',3,3);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(4, 'giường ngủ',4,2);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(5, 'đồng hồ',5,[3]);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(6, 'ghế dài',2,1);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(7, 'nệm',4,2);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(8, 'tủ ngăn kéo',3);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(9, 'lọ hoa',5,);
-- insert into category_product (category_product_id, name_category_product, category_id, area_id ) values(10, 'bàn học',1,4);
insert into product (id, product_name, image, description, product_alias, category_product_id) values (1, 'Alize Red Passion', '[{"1":"http://dummyimage.com/256x256.jpg/5fa2dd/ffffff","2":"http://dummyimage.com/256x256.jpg/dddddd/000000"}]', 'Morbi non quam nec dui luctus rutrum. Nulla tellus. In sagittis dui vel nisl. Duis ac nibh. Fusce lacus purus, aliquet at, feugiat non, pretium quis, lectus. Suspendisse potenti. In eleifend quam a odio. In hac habitasse platea dictumst. Maecenas ut massa quis augue luctus tincidunt. Nulla mollis molestie lorem.','alize-red-passion',5);
insert into product (id, product_name, image, description, product_alias, category_product_id) values (2, 'Rum - Spiced, Captain Morgan', '[{"1":"http://dummyimage.com/256x256.jpg/5fa2dd/ffffff","2":"http://dummyimage.com/256x256.jpg/dddddd/000000"}]', 'Vivamus vel nulla eget eros elementum pellentesque. Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus. Phasellus in felis. Donec semper sapien a libero. Nam dui. Proin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis.','rum-spiced-captain-morgan',4);
insert into product (id, product_name, image, description, product_alias, category_product_id) values (3, 'Juice - Clam, 46 Oz', '[{"1":"http://dummyimage.com/256x256.jpg/5fa2dd/ffffff","2":"http://dummyimage.com/256x256.jpg/dddddd/000000"}]', 'Maecenas pulvinar lobortis est. Phasellus sit amet erat. Nulla tempus. Vivamus in felis eu sapien cursus vestibulum. Proin eu mi. Nulla ac enim. In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem. Duis aliquam convallis nunc.','luice-clam-46-oz',1);
insert into product (id, product_name, image, description, product_alias, category_product_id) values (4, 'Waffle Stix', '[{"1":"http://dummyimage.com/256x256.jpg/5fa2dd/ffffff","2":"http://dummyimage.com/256x256.jpg/dddddd/000000"}]', 'Integer aliquet, massa id lobortis convallis, tortor risus dapibus augue, vel accumsan tellus nisi eu orci. Mauris lacinia sapien quis libero. Nullam sit amet turpis elementum ligula vehicula consequat.','waffle-stix',3);
insert into product (id, product_name, image, description, product_alias, category_product_id) values (5, 'Beer - Guiness', '[{"1":"http://dummyimage.com/256x256.jpg/5fa2dd/ffffff","2":"http://dummyimage.com/256x256.jpg/dddddd/000000"}]', 'Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue.','beer-guiness',2);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (1, '[{"material":"info","color":"Pink","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NASDAQ","sum_of_rating":76,"sum_of_wishlist":22,"status_product":true}]','RC9Q-66BA-69B7-MPAL','[{"sale_off_price":true,"new_product":false}]',5);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (2, '[{"material":"biz","color":"Orange","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NASDAQ","sum_of_rating":47,"sum_of_wishlist":54,"status_product":true}]','75TG-KRT4-32Y6-2AYH','[{"sale_off_price":false,"new_product":false}]',3);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (3, '[{"material":"info","color":"Crimson","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NYSE","sum_of_rating":68,"sum_of_wishlist":78,"status_product":true}]','9LNU-7N4J-H5KQ-DQ56','[{"sale_off_price":true,"new_product":false}]',4);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (4, '[{"material":"com","color":"Aquamarine","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NYSE","sum_of_rating":90,"sum_of_wishlist":54,"status_product":true}]','KER4-RRJN-AVXQ-Q6V5','[{"sale_off_price":false,"new_product":true}]',1);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (5, '[{"material":"mil","color":"Crimson","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NYSE","sum_of_rating":56,"sum_of_wishlist":28,"status_product":true}]','MBWF-E8F9-YWXN-36TQ','[{"sale_off_price":false,"new_product":false}]',2);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (6, '[{"material":"wood","color":"green","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NYSE","sum_of_rating":8,"sum_of_wishlist":10,"status_product":true}]','PQ67-PCQF-BATV-LPAC','[{"sale_off_price":true,"new_product":false}]',2);
insert into attribute_product (id, attributes, upc, option_status, product_id) values (7, '[{"material":"biz","color":"red","size":[{"length":1,"Width":1,"Hight":1,"Depth":1,"diameter":1}],"manufacturer":"NASDAQ","sum_of_rating":4,"sum_of_wishlist":2,"status_product":true}]','Y9MS-3WBT-PCL2-CYGY','[{"sale_off_price":false,"new_product":false}]',3);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (1, '$90.63' , '$53.51', null,'5/22/2017' , 2);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (2, '$70.19', '$46.64', null,  '11/29/2017', 4);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (3, '$90.5', '$58.15', '$41.33', '10/9/2017', 3);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (4, '$150.22', '$69.65', null, '5/4/2017', 5);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (5,  '$9.95', '$7.47', '$5.36', '7/29/2017', 1);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (6, '$200.22', '$70.65', '$53.51', '12/13/2017', 6);
insert into product_price (id, product_price, original_price ,sale_off_price, time_create, attribute_product_id) values (7, '$90.63' , '$50.51', null,'6/22/2017' , 7);
