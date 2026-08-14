# Nacho House — Admin Price Management

این نسخه قیمت‌ها را از Cloudflare D1 می‌خواند و یک پنل `/admin.html` با HTTP Basic Authentication دارد.

## معماری

- سایت عمومی: GitHub → Cloudflare Pages
- ذخیره قیمت‌ها: Cloudflare D1
- API عمومی قیمت‌ها: `/api/menu`
- API محافظت‌شده: `/api/admin/prices`
- پنل: `/admin.html`
- نام کاربری و رمز: فقط در Cloudflare Secrets با نام‌های `ADMIN_USERNAME` و `ADMIN_PASSWORD`
- هیچ username/password در HTML، JavaScript، Git یا D1 ذخیره نشده است.

## راه‌اندازی در Cloudflare

### 1. D1 بساز

در Cloudflare برو به **Workers & Pages → D1** و یک دیتابیس با نام پیشنهادی `nacho-house-menu` بساز.

### 2. جدول را بساز

در SQL Console همان D1، محتوای `schema.sql` را اجرا کن.
سپس محتوای `seed.sql` را اجرا کن. قیمت اولیه همه آیتم‌ها `0` است تا کارفرما قیمت واقعی را وارد کند.

### 3. D1 را به Pages وصل کن

در پروژه Pages:
**Settings → Functions → D1 database bindings** (ممکن است نام منو در داشبورد کمی متفاوت باشد).

Binding variable name را دقیقاً `DB` بگذار و دیتابیس `nacho-house-menu` را انتخاب کن.

### 4. Secrets بساز

در پروژه Pages برو به:
**Settings → Variables and Secrets → Add**

دو Secret بساز و گزینه Encrypt را فعال کن:

- `ADMIN_USERNAME` = نام کاربری کارفرما
- `ADMIN_PASSWORD` = رمز قوی کارفرما

این مقادیر را داخل کد، HTML، JavaScript یا GitHub قرار نده.

### 5. فایل‌ها را در ریپازیتوری قرار بده

محتویات این بسته را در ریشه پروژه‌ای که Cloudflare Pages از GitHub می‌گیرد قرار بده.

مهم:
- پوشه `functions/` باید در ریشه پروژه باشد.
- `admin.html` و `admin.js` و `admin.css` هم در ریشه باشند.
- `menu.js` باید در ریشه باشد.

### 6. Deploy

یک commit و push به GitHub انجام بده. Cloudflare Pages باید `/functions` را به‌عنوان Pages Functions شناسایی و deploy کند.

بعد از deploy:

`https://YOUR-DOMAIN/admin.html`

را باز کن. مرورگر پنجره username/password مربوط به HTTP Basic Auth را نشان می‌دهد.

## استفاده کارفرما

1. آدرس `/admin.html` را باز می‌کند.
2. username/password را وارد می‌کند.
3. قیمت همه آیتم‌ها را به **ریال** وارد می‌کند.
4. روی «ذخیره همه قیمت‌ها» می‌زند.
5. قیمت‌ها در D1 ذخیره می‌شوند.
6. صفحه عمومی غذا و نوشیدنی قیمت جدید را از `/api/menu` می‌خواند.

## نکات امنیتی

- Basic Auth فقط باید روی HTTPS استفاده شود؛ Cloudflare Pages به‌صورت معمول سایت را روی HTTPS ارائه می‌کند.
- Basic Auth به‌تنهایی رمز را hash نمی‌کند؛ رمز در header به Base64 می‌رود، بنابراین HTTPS ضروری است. Base64 رمزنگاری نیست.
- رمز در GitHub نیست؛ Secretهای Cloudflare برای همین مورد استفاده شده‌اند.
- `/admin.html` و `/api/admin/*` محافظت شده‌اند.
- `/api/menu` عمومی است چون کاربران سایت باید قیمت‌ها را ببینند.
- API ذخیره‌سازی فقط JSON قبول می‌کند، قیمت‌ها را اعتبارسنجی می‌کند و IDهای ارسالی را با منوی سرور تطبیق می‌دهد.
- برای امنیت بیشتر در برابر brute-force، در صورت نیاز می‌توان روی Cloudflare WAF/Rate Limiting برای `/admin.html` و `/api/admin/*` قانون rate limit گذاشت.

## توسعه محلی

برای توسعه محلی می‌توان از Wrangler استفاده کرد. فایل `.dev.vars` برای Secretهای محلی است و نباید commit شود.

نمونه:

```text
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="یک-رمز-قوی-محلی"
```

برای D1 محلی باید binding را با Wrangler تنظیم کنی. برای شروع ساده‌تر، راه‌اندازی اولیه D1 و Secretها را در Cloudflare انجام بده و بعد نسخه production را تست کن.
