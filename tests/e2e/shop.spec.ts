import {test,expect} from '@playwright/test';
test('catalog, registration, variant selection, persisted cart and order history',async({page})=>{
 const email=`browser-${Date.now()}@example.com`;
 await page.goto('/');await expect(page.getByRole('heading',{name:'Твой стиль. Твой ритм.'})).toBeVisible();
 await page.goto('/catalog');await page.getByRole('textbox',{name:'Поиск товаров'}).fill('несуществующий товар');await expect(page.getByRole('heading',{name:'Пока ничего не нашлось'})).toBeVisible();
 await page.getByRole('button',{name:'Сбросить фильтры'}).click();await expect(page.locator('.product-card')).toHaveCount(10);
 await page.goto('/profile');await page.getByRole('button',{name:'Регистрация',exact:true}).click();
 await page.getByLabel('Имя',{exact:true}).fill('Тест Покупатель');await page.getByLabel('Email или телефон').fill(email);await page.getByLabel('Пароль',{exact:true}).fill('Ritmo-test-2026!');await page.getByLabel('Повтори пароль').fill('Ritmo-test-2026!');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Создать аккаунт'}).click();await expect(page.getByRole('heading',{name:/Привет, Тест/})).toBeVisible();
 await page.goto('/catalog/basic-cotton');await page.getByRole('button',{name:'M',exact:true}).click();await page.getByRole('button',{name:/В корзину/}).click();await expect(page.getByRole('status')).toContainText('Товар добавлен');
 await page.goto('/cart');await page.reload();await expect(page.getByRole('heading',{name:'Футболка Basic Cotton'})).toBeVisible();
 await page.getByLabel('Телефон',{exact:true}).fill('+998901234567');await page.getByLabel('Адрес доставки').fill('Ташкент, тестовая улица, дом 10');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Оформить заказ'}).click();await expect(page.getByRole('heading',{name:'Твой заказ принят.'})).toBeVisible();await expect(page.locator('.success-summary')).toContainText('114');
 await page.goto('/profile');await expect(page.locator('.history-order')).toHaveCount(1);await page.locator('.history-order summary').click();await expect(page.locator('.history-order')).toContainText('Футболка Basic Cotton');
 await page.getByRole('button',{name:'Выйти',exact:true}).click();await expect(page.getByRole('heading',{name:'С возвращением'})).toBeVisible();
 await page.getByLabel('Email или телефон').fill(email);await page.getByLabel('Пароль',{exact:true}).fill('Ritmo-test-2026!');await page.getByRole('button',{name:'Войти',exact:true}).click();await expect(page.getByRole('heading',{name:/Привет, Тест/})).toBeVisible();await expect(page.locator('.history-order')).toHaveCount(1);
});
test('mobile navigation, layout and AI unavailable state',async({page})=>{
 await page.setViewportSize({width:320,height:760});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Открыть меню'}).click();await page.getByRole('navigation').getByRole('link',{name:'Каталог'}).click();await expect(page).toHaveURL(/catalog/);await expect(page.locator('.product-card')).toHaveCount(10);
 await page.getByRole('button',{name:'Подобрать с AI'}).click();await page.getByRole('textbox',{name:'Сообщение стилисту'}).fill('Образ для прогулки');await page.getByRole('button',{name:'Отправить',exact:true}).click();await expect(page.locator('.chat-body')).toContainText('пока не подключён');
 await page.getByRole('button',{name:'Закрыть помощника'}).click();await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});
});
test('API rejects cross-site checkout, unauthorized order history, forged price and overselling',async({request})=>{
 const products=await (await request.get('/api/products')).json();expect(products.length).toBe(10);
 expect((await request.get('/api/orders')).status()).toBe(401);
 const p=products.find((p:any)=>p.slug==='cap'),v=p.variants[0];const data={contactName:'API Test',phone:'+998901234567',address:'Тестовый адрес, дом 10',paymentMethod:'cash',items:[{variantId:v.id,quantity:1,priceUzs:1}],totalUzs:1};
 expect((await request.post('/api/orders',{headers:{Origin:'https://evil.example'},data})).status()).toBe(403);
 const placed=await request.post('/api/orders',{headers:{Origin:'http://localhost:3000'},data});expect(placed.status()).toBe(201);const order=await placed.json();expect(order.totalUzs).toBe(p.priceUzs+25000);
 const unavailable=products.flatMap((p:any)=>p.variants).find((v:any)=>v.stock===0);expect(unavailable).toBeTruthy();expect((await request.post('/api/orders',{headers:{Origin:'http://localhost:3000'},data:{...data,items:[{variantId:unavailable.id,quantity:1}]}})).status()).toBe(409);
 const invalid=await request.post('/api/auth/register',{headers:{Origin:'http://localhost:3000'},data:{name:'A',identifier:'bad',password:'1',confirmation:'2',consent:false}});expect(invalid.status()).toBe(400);
 const registered=await request.post('/api/auth/register',{headers:{Origin:'http://localhost:3000'},data:{name:'API User',identifier:`browser-api-${Date.now()}@example.com`,password:'Ritmo-test-2026!',confirmation:'Ritmo-test-2026!',consent:true}});expect(registered.status()).toBe(201);const mine=await request.get('/api/orders');expect(await mine.json()).toEqual([]);
});
