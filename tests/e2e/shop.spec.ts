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
 await page.getByLabel('Телефон',{exact:true}).fill('+998901234567');await page.getByLabel('Адрес доставки').fill('Ташкент, тестовая улица, дом 10');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Оформить заказ'}).click();await expect(page.getByRole('heading',{name:'Твой заказ принят.'})).toBeVisible();await expect(page.locator('.success-summary')).toContainText('114');const receiptUrl=page.url();await page.reload();await expect(page.getByRole('heading',{name:'Твой заказ принят.'})).toBeVisible();
 await page.goto('/profile');await expect(page.locator('.history-order')).toHaveCount(1);await page.locator('.history-order summary').click();await expect(page.locator('.history-order')).toContainText('Футболка Basic Cotton');
 await page.getByRole('button',{name:'Выйти',exact:true}).click();await expect(page.getByRole('heading',{name:'С возвращением'})).toBeVisible();
 await page.getByLabel('Email или телефон').fill(email);await page.getByLabel('Пароль',{exact:true}).fill('Ritmo-test-2026!');await page.getByRole('button',{name:'Войти',exact:true}).click();await expect(page.getByRole('heading',{name:/Привет, Тест/})).toBeVisible();await expect(page.locator('.history-order')).toHaveCount(1);
});
test('mobile navigation, blue-violet layout and local stylist',async({page})=>{
 await page.setViewportSize({width:320,height:760});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Открыть меню'}).click();await page.getByRole('navigation').getByRole('link',{name:'Каталог'}).click();await expect(page).toHaveURL(/catalog/);await expect(page.locator('.product-card')).toHaveCount(10);
 await page.getByRole('button',{name:'Подобрать с AI'}).click();await page.getByRole('textbox',{name:'Сообщение стилисту'}).fill('Образ для прогулки');await page.getByRole('button',{name:'Отправить',exact:true}).click();await expect(page.locator('.chat-body')).toContainText('Ниже — подборка');
 await page.getByRole('button',{name:'Закрыть помощника'}).click();await page.screenshot({path:'test-results/catalog-mobile.png',fullPage:true});
});
test('API rejects cross-site checkout, unauthorized order history, forged price and overselling',async({request})=>{
 const products=await (await request.get('/api/products')).json();expect(products.length).toBe(10);
 expect((await request.get('/api/orders')).status()).toBe(401);
 const p=products.find((p:any)=>p.slug==='cap'),v=p.variants[0];const data={contactName:'API Test',phone:'+998901234567',address:'Тестовый адрес, дом 10',paymentMethod:'cash',items:[{variantId:v.id,quantity:1,priceUzs:1}],totalUzs:1};
 expect((await request.post('/api/orders',{headers:{Origin:'https://evil.example'},data})).status()).toBe(403);
 const placed=await request.post('/api/orders',{headers:{Origin:'http://localhost:3100'},data});expect(placed.status()).toBe(201);const order=await placed.json();expect(order.totalUzs).toBe(p.priceUzs+25000);
 const unavailable=products.flatMap((p:any)=>p.variants).find((v:any)=>v.stock===0);expect(unavailable).toBeTruthy();expect((await request.post('/api/orders',{headers:{Origin:'http://localhost:3100'},data:{...data,items:[{variantId:unavailable.id,quantity:1}]}})).status()).toBe(409);
 const invalid=await request.post('/api/auth/register',{headers:{Origin:'http://localhost:3100'},data:{name:'A',identifier:'bad',password:'1',confirmation:'2',consent:false}});expect(invalid.status()).toBe(400);
 const registered=await request.post('/api/auth/register',{headers:{Origin:'http://localhost:3100'},data:{name:'API User',identifier:`browser-api-${Date.now()}@example.com`,password:'Ritmo-test-2026!',confirmation:'Ritmo-test-2026!',consent:true}});expect(registered.status()).toBe(201);const mine=await request.get('/api/orders');expect(await mine.json()).toEqual([]);
});
test('account cart, addresses and one-time recovery work without external services',async({browser})=>{
 const first=await browser.newContext({baseURL:'http://localhost:3100'});const second=await browser.newContext({baseURL:'http://localhost:3100'});
 const post=(context:any,path:string,data:any)=>context.request.post('/api/'+path,{headers:{Origin:'http://localhost:3100'},data});
 const identifier=`browser-account-${Date.now()}@example.com`,password='Ritmo-test-2026!';
 const registered=await post(first,'auth/register',{name:'Тест Покупатель',identifier,password,confirmation:password,consent:true});expect(registered.status()).toBe(201);const {recoveryCode}=await registered.json();expect(recoveryCode).toMatch(/^[a-f0-9]{64}$/);
 const products=await (await first.request.get('/api/products')).json(),variantId=products.find((p:any)=>p.slug==='basic-cotton').variants[0].id;
 expect((await post(first,'cart',{mode:'merge',items:[{variantId,quantity:2}]})).status()).toBe(200);
 const address=await post(first,'addresses',{label:'Дом',address:'Ташкент, домашняя улица, дом 5'});expect(address.status()).toBe(201);const saved=await address.json();
 await post(second,'auth/login',{identifier,password});expect(await (await second.request.get('/api/cart')).json()).toEqual([{variantId,quantity:2}]);expect((await (await second.request.get('/api/addresses')).json())[0].id).toBe(saved.id);
 expect((await post(second,'addresses/'+saved.id,{action:'default'})).status()).toBe(200);expect((await (await second.request.get('/api/auth/me')).json()).address).toContain('дом 5');
 expect((await post(first,'auth/recover',{identifier,recoveryCode,password:'New-Ritmo-2026!'})).status()).toBe(200);expect(await (await second.request.get('/api/auth/me')).json()).toBeNull();
 expect((await post(first,'auth/recover',{identifier,recoveryCode,password:'Third-Ritmo-2026!'})).status()).toBe(409);
 expect((await post(second,'auth/login',{identifier,password})).status()).toBe(401);expect((await post(second,'auth/login',{identifier,password:'New-Ritmo-2026!'})).status()).toBe(200);
 const page=await second.newPage();await page.goto('/profile');await expect(page.getByRole('heading',{name:'Мои адреса'})).toBeVisible();await expect(page.locator('.saved-address')).toContainText('дом 5');
 await first.close();await second.close();
});
test('guest receipt is persistent, private and checkout replay does not create duplicates',async({browser})=>{
 const guest=await browser.newContext({baseURL:'http://localhost:3100'});const outsider=await browser.newContext({baseURL:'http://localhost:3100'});const origin={Origin:'http://localhost:3100'};
 const products=await (await guest.request.get('/api/products')).json();const product=products.find((p:any)=>p.slug==='canvas');const variantId=product.variants[0].id;
 const data={checkoutKey:crypto.randomUUID(),contactName:'Гость',phone:'+998901234567',address:'Ташкент, гостевая улица, дом 3',paymentMethod:'cash',items:[{variantId,quantity:1}]};
 const a=await guest.request.post('/api/orders',{headers:origin,data});expect(a.status()).toBe(201);const order=await a.json();const b=await guest.request.post('/api/orders',{headers:origin,data});expect((await b.json()).id).toBe(order.id);
 const path='/cart/order/'+order.id;const page=await guest.newPage();await page.goto(path);await expect(page.getByRole('heading',{name:'Твой заказ принят.'})).toBeVisible();await page.reload();await expect(page.locator('.success-summary')).toContainText('84');
 expect((await outsider.request.get(path)).status()).toBe(404);
 const after=await (await guest.request.get('/api/products')).json();expect(after.find((p:any)=>p.slug==='canvas').variants[0].stock).toBe(product.variants[0].stock-1);
 await guest.close();await outsider.close();
});
test('help pages, keyboard dialogs and page layout are complete',async({page})=>{
 for(const slug of ['delivery','returns','contacts','privacy']){await page.goto('/help/'+slug);await expect(page.locator('.help-article h1')).toBeVisible();}
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:850});for(const path of ['/','/catalog','/profile','/help/privacy']){await page.goto(path);await page.locator('main').waitFor();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}}
 await page.goto('/catalog/basic-cotton');await page.getByRole('button',{name:'Таблица размеров'}).click();await expect(page.getByRole('dialog',{name:'Таблица размеров'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
