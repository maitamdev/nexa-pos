# NexaPOS Landing Page & Download Hub

Trang web giới thiệu sản phẩm và tải phần mềm NexaPOS bản Desktop. Được thiết kế theo phong cách tối giản, hiện đại (Sleek Dark Mode & Glassmorphism) đồng bộ với giao diện ứng dụng.

## Cấu trúc thư mục
* `index.html`: Cấu trúc trang chính chuẩn SEO.
* `style.css`: Bộ định dạng phong cách giao diện và hiệu ứng kính mờ.
* `main.js`: Mã xử lý logic cuộn trang, thanh điều hướng điện thoại và popup đếm ngược tải file.
* `assets/`: Thư mục chứa hình ảnh:
  * `logo.png`: Logo của NexaPOS.
  * `dashboard-mockup.png`: Ảnh chụp giao diện dashboard chính thức của ứng dụng.

---

## Hướng Dẫn Triển Khai (Deployment Guide)

Bạn có thể dễ dàng đưa trang web này lên mạng internet hoàn toàn miễn phí qua **Vercel** hoặc **GitHub Pages**, sau đó cấu hình tên miền riêng của bạn.

### Cách 1: Triển khai nhanh bằng Vercel (Khuyên dùng)
Vercel hỗ trợ host trang tĩnh cực kỳ nhanh và cấu hình tên miền đơn giản:

1. **Đăng nhập Vercel:** Truy cập [Vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub của bạn.
2. **Triển khai kéo thả (Vercel Dashboard):**
   * Nén thư mục `website` này thành file `.zip` (chỉ nén các file bên trong thư mục `website`, không nén cả thư mục cha `NEXA-POS`).
   * Vào trang Dashboard Vercel, chọn **Add New** -> **Project**.
   * Bên dưới có mục **Deploy a folder / drag & drop**, kéo thả file `.zip` hoặc thư mục `website` vào đó để tự động deploy.
3. **Triển khai qua GitHub (Auto-deploy khi push code):**
   * Nếu bạn đã push toàn bộ dự án `NEXA-POS` lên một repository GitHub riêng tư hoặc công khai.
   * Trên Vercel, bấm **Import** repo GitHub đó.
   * Tại mục **Project Settings**:
     * **Framework Preset:** Chọn `Other`.
     * **Root Directory:** Bấm *Edit* và nhập/chọn thư mục `website`.
   * Bấm **Deploy**. Kể từ bây giờ, bất cứ khi nào bạn push code mới lên GitHub, Vercel sẽ tự động cập nhật website.

---

### Cách 2: Triển khai bằng GitHub Pages
Nếu bạn muốn sử dụng dịch vụ host có sẵn của GitHub:

1. Tạo một repository mới trên GitHub (ví dụ: `nexapos-web`).
2. Chỉ push toàn bộ các file bên trong thư mục `website` (gồm `index.html`, `style.css`, `main.js` và thư mục `assets`) lên nhánh `main` của repo này.
3. Vào repo trên GitHub -> **Settings** -> **Pages**.
4. Tại mục **Build and deployment**:
   * **Source:** Chọn `Deploy from a branch`.
   * **Branch:** Chọn `main` và thư mục `/ (root)`.
5. Bấm **Save**. Chờ khoảng 1-2 phút, GitHub sẽ cấp cho bạn đường link có dạng `https://<ten-tai-khoan>.github.io/nexapos-web`.

---

### Hướng Dẫn Gắn Tên Miền Riêng (Custom Domain)

Sau khi deploy thành công trên một trong hai nền tảng trên, bạn có thể trỏ tên miền riêng của mình:

#### Trên Vercel:
1. Vào dự án trên Vercel -> **Settings** -> **Domains**.
2. Nhập tên miền của bạn (ví dụ: `nexapos.vn` hoặc `download.nexapos.vn`) rồi bấm **Add**.
3. Vercel sẽ hiển thị các bản ghi DNS cần cấu hình. Bạn chỉ cần đăng nhập vào trang quản lý tên miền của bạn (như mắt bão, Tenten, Cloudflare...) và thêm:
   * Bản ghi **CNAME** trỏ tới `cname.vercel-dns.com` (dành cho subdomain như `download.nexapos.vn`).
   * Hoặc bản ghi **A** trỏ tới `76.76.21.21` (dành cho domain gốc như `nexapos.vn`).

#### Trên GitHub Pages:
1. Vào repo trên GitHub -> **Settings** -> **Pages**.
2. Cuộn xuống mục **Custom domain**, nhập tên miền của bạn rồi bấm **Save**.
3. Cấu hình DNS trên trang quản lý tên miền của bạn trỏ về các IP của GitHub Pages (ví dụ bản ghi A trỏ đến `185.199.108.153`, `185.199.109.153`...).
