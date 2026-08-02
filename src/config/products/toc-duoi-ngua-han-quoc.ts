import type { HairLandingConfig } from "@/landing/types";
import { mapConfigAssets } from "@/config/resolve-asset";

/** Reference clone: Kẹp tóc giả đuôi ngựa đính nơ Hàn Quốc (hanashop.com.vn) */
export const tocDuoiNguaHanQuoc: HairLandingConfig = {
  slug: "toc-duoi-ngua-han-quoc",
  meta: {
    title: "KẸP TÓC GIẢ ĐUÔI NGỰA ĐÍNH NƠ HÀN QUỐC",
    description:
      "Kẹp tóc giả đuôi ngựa đính nơ Hàn Quốc — tóc dày tự nhiên, nâng tầm nhan sắc. COD toàn quốc.",
    keywords: ["kẹp tóc giả", "đuôi ngựa", "phụ kiện tóc", "tóc giả Hàn Quốc"],
  },
  cta: {
    label: "BẤM MUA NGAY",
    scrollTarget: "#order-form",
  },
  hero: {
    title: "KẸP TÓC GIẢ ĐUÔI NGỰA",
    subtitle: "ĐÍNH NƠ HÀN QUỐC",
    tagline: "“Tóc dày tự nhiên – Nâng tầm nhan sắc!”",
    introBackground: ["#f1fcff", "#d0f1ff"],
    pricingPromo: {
      discountPct: "50%",
      centerPrice: "219K",
      originalPrice: "440K",
      shipNote: "MUA 2 KẸP - FREESHIP",
    },
    gallery: [
      { slot: "a", image: "/products/ldp01/gallery-oecgz.png", alt: "Side view" },
      {
        slot: "b",
        image: "/products/ldp01/screenshot-2026-05-06-095552-20260506034023-q7xfl.png",
        alt: "Front view",
      },
      {
        slot: "c",
        image: "/products/ldp01/screenshot-2026-05-06-102548-20260506034016-ccyyt.png",
        alt: "Profile view",
      },
      { slot: "d", image: "/products/ldp01/gallery-hr0_i.png", alt: "Back view" },
    ],
    bannerImage:
      "https://w.ladicdn.com/s750x750/5f73f7fe63007e44c1a42d50/154cb918-f9ef-43da-95ba-0d6fcc382d0a-20260506033541-y6yzk.jpg",
  },
  stickyOffer: {
    discountLabel: "50%",
    ctaLabel: "Mua ngay",
  },
  urgency: {
    enabled: true,
    headline: "Sắp hết hàng! chỉ còn",
    subheadline: "sản phẩm cuối cùng",
    stockCount: 86,
    stockLabel: "Nhanh tay lên!",
  },
  stats: {
    rating: 5.0,
    ratingLabel: "Đánh giá",
    sold: 1200,
    soldLabel: "Đã bán",
    views: 583824,
    viewsLabel: "Lượt xem",
  },
  specs: [
    { label: "Tên sản phẩm", value: "KẸP TÓC GIẢ ĐUÔI NGỰA ĐÍNH NƠ HÀN QUỐC" },
    { label: "Phân loại", value: "Phụ kiện tóc" },
    {
      label: "Chất liệu",
      value:
        "Sợi tơ nhân tạo chịu nhiệt (mô phỏng tóc thật 99%) kết hợp nơ vải satin mềm.",
    },
    { label: "Màu sắc", value: "Đen tự nhiên, nâu đen, nâu đậm, nâu sáng" },
    { label: "Kiểu kẹp", value: "Kẹp cào 5 răng chắc chắn" },
    { label: "Kiểu nơ", value: "Nơ đôi to bản, chất liệu satin bóng nhẹ" },
    { label: "Chiều dài tóc", value: "Khoảng 40cm" },
    {
      label: "Khả năng chịu nhiệt",
      value: "Có thể dùng máy uốn/duỗi ở nhiệt độ thấp (< 140°C)",
    },
  ],
  featureBlocks: [
    {
      image:
        "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t110328726-20260506040338-ogira.jpg",
      alt: "Product showcase",
    },
  ],
  styleSection: {
    title: "Phong Cách Tiểu Thư Hàn Quốc",
    image:
      "https://w.ladicdn.com/s750x700/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101733548-20260506033541-jhabl.jpg",
    bullets: [
      "Tạo nên mái tóc bồng bềnh tự nhiên",
      "Độn tóc không lộ dấu vết",
      "Tạm biệt mái tóc thưa mỏng, biến hóa thành kiểu tóc ngọt ngào",
      "Tóc mỏng vẫn có thể sở hữu mái tóc đuôi ngựa xoăn đầy khí chất.",
    ],
  },
  beforeAfter: [
    {
      title: "Tóc đuôi ngựa tầng cao hoàn thiện, \"cứu tinh\" cho những cô nàng không khéo tay",
      before: {
        image:
          "https://w.ladicdn.com/s500x550/5f73f7fe63007e44c1a42d50/screenshot-2026-05-06-102548-20260506034016-ccyyt.png",
        label: "Trước khi dùng",
      },
      after: {
        image:
          "https://w.ladicdn.com/s500x600/5f73f7fe63007e44c1a42d50/screenshot-2026-05-06-095552-20260506034023-q7xfl.png",
        label: "Sau khi dùng",
      },
    },
  ],
  benefits: [
    {
      image:
        "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101413471-20260506033557-ce_ix.jpg",
      title: "Kẹp càng cua lớn, chắc chắn",
      description: "Sợi tơ chịu nhiệt độ cao, sợi lì",
    },
    {
      image:
        "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101510624-20260506033557-hlvie.jpg",
      title: "Kẹp càng cua gắn nơ, sử dụng đơn giản",
      description:
        "Người mới bắt đầu cũng có thể dễ dàng sử dụng, cực kỳ phù hợp cho những nàng không khéo tay",
    },
    {
      image:
        "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101820481-20260506033541-x1vvd.jpg",
      title: "Tạm biệt sự rườm rà",
      description: "Dễ dàng đội và đi ra ngoài",
    },
  ],
  colors: {
    title: "Màu Sắc Sản Phẩm",
    subtitle: "Phù hợp với mọi màu tóc nhuộm",
    variants: [
      {
        id: "den",
        name: "Màu đen",
        image:
          "https://w.ladicdn.com/s750x750/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t100941662-20260506033558-6hi2v.jpg",
        description:
          "Khá phù hợp với những bạn nữ đã từng nhuộm tóc đen hoặc vốn có màu tóc đen tuyền",
      },
      {
        id: "nau-den",
        name: "Nâu đen",
        image:
          "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101510624-20260506033557-hlvie.jpg",
        description:
          "Có ánh nâu nhẹ khi ra nắng, phù hợp với những bạn nữ chưa từng nhuộm tóc (tóc đen nguyên bản thường có sắc nâu này)",
      },
      {
        id: "nau-dam",
        name: "Nâu đậm",
        image:
          "https://w.ladicdn.com/s750x600/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t101820481-20260506033541-x1vvd.jpg",
        description:
          "Màu hơi ngả sang đỏ sẫm, tương tự như màu vỏ hạt dẻ, giúp làm tôn da một cách tự nhiên.",
      },
      {
        id: "nau-sang",
        name: "Nâu sáng",
        image:
          "https://w.ladicdn.com/s750x750/5f73f7fe63007e44c1a42d50/thiet-ke-chua-co-ten-2026-05-06t102203659-20260506033541-gk5to.jpg",
        description:
          "Màu hơi ngả vàng, phù hợp với những bạn nữ đang để tóc tông màu vàng/sáng.",
      },
    ],
  },
  video: {
    title: "VIDEO HƯỚNG DẪN SỬ DỤNG CHI TIẾT",
    subtitle:
      "Kiểu tóc đẹp, dễ dàng có ngay vẻ ngoài lười biếng, tự nhiên đầy cuốn hút.",
    poster:
      "https://w.ladicdn.com/s750x650/5f73f7fe63007e44c1a42d50/b42e513e-eab5-4d86-9ed7-f1a1f6c25bc7-20260506033541-t0lxj.jpg",
    gifFallback:
      "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/169k-2026-05-06t112005395-20260506102839-4ptor.gif",
  },
  pricing: [
    { id: "1-clip", label: "1 kẹp", price: 219000, shipping: 30000, shippingNote: "+ 30k ship" },
    { id: "2-clip", label: "2 kẹp", price: 399000, shipping: "free", shippingNote: "miễn phí ship" },
  ],
  order: {
    title: "ĐIỀN THÔNG TIN ĐẶT HÀNG TẠI ĐÂY!",
    tierFieldId: "tier",
    colorFieldId: "color",
    fields: [
      { id: "name", label: "Họ và tên", placeholder: "Nguyễn Văn A", required: true },
      { id: "phone", label: "Số điện thoại", placeholder: "09xx xxx xxx", required: true, type: "tel" },
      { id: "address", label: "Địa chỉ nhận hàng", placeholder: "Số nhà, đường, quận/huyện, tỉnh/thành", required: true, type: "textarea" },
      {
        id: "tier",
        label: "Số lượng",
        required: true,
        type: "select",
        options: [
          { value: "1-clip", label: "1 kẹp: 219k + 30k ship" },
          { value: "2-clip", label: "2 kẹp: 399k + miễn phí ship" },
        ],
      },
      {
        id: "color",
        label: "Màu sắc",
        required: true,
        type: "select",
        options: [
          { value: "den", label: "MÀU ĐEN" },
          { value: "nau-den", label: "MÀU NÂU ĐEN" },
          { value: "nau-dam", label: "MÀU NÂU ĐẬM" },
          { value: "nau-sang", label: "MÀU NÂU SÁNG" },
        ],
      },
      { id: "note", label: "Ghi chú (tuỳ chọn)", placeholder: "Ghi chú thêm cho shop", type: "textarea" },
    ],
    submitLabel: "XÁC NHẬN ĐẶT HÀNG",
    successMessage: "Đặt hàng thành công! Shop sẽ liên hệ xác nhận trong ít phút.",
  },
  reviews: {
    title: "ĐÁNH GIÁ SẢN PHẨM CỦA KHÁCH HÀNG",
    count: 176,
    items: [
      {
        id: "r1",
        author: "Nguyễn Vui",
        avatar:
          "https://w.ladicdn.com/s400x400/5f73f7fe63007e44c1a42d50/nhung-hinh-anh-ve-me-dep-hinh-anh-me-va-con-y-nghia-24-20250513091546-1pzlb.jpg",
        text: "Tóc giả mà nhìn y như tóc thật, không bị bóng giả trân đâu. Cái kẹp cào chắc chắn lắm, kẹp lên cái là tóc phồng đẹp hẳn",
        likes: 4,
        timeAgo: "56 phút trước",
        photos: [
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01wfwdo41jzontht2xg_4611686018427385051-0-ratejpg_960x960jpg_-20260506043434-e_2r3.webp",
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01hqjupe1necrh4z1hs_4611686018427381938-0-ratejpg_960x960jpg_-20260506043434-fsgrr.webp",
        ],
      },
      {
        id: "r2",
        author: "Hoa Phạm",
        avatar:
          "https://w.ladicdn.com/s400x400/5f73f7fe63007e44c1a42d50/y-tuong-chup-anh-me-va-con-gai-4-20250513091545-r_fkh.jpg",
        text: "Đúng là cứu tinh cho mấy đứa tóc mỏng như mình. Kẹp vào nhìn mặt nhỏ hẳn đi mà trông tiểu thư lắm luôn.",
        likes: 2,
        timeAgo: "1 ngày trước",
        photos: [
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01dtnrht1gz2n4vtiga_4611686018427385387-0-ratejpg_960x960jpg_-20260506043443-wgepn.webp",
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01gieew71jzontjbqoh_4611686018427385051-0-ratejpg_960x960jpg_-20260506043434-fxhor.webp",
        ],
      },
      {
        id: "r3",
        author: "Minh Anh",
        avatar:
          "https://w.ladicdn.com/s400x400/5f73f7fe63007e44c1a42d50/y-tuong-chup-anh-me-va-con-gai-5-20250513091545-ce4gf.jpg",
        text: "Sản phẩm giống hình 100%. Chất tơ mềm mượt, dễ chải. Nơ to che được cả phần kẹp nên nhìn rất tự nhiên.",
        likes: 5,
        timeAgo: "4 ngày trước",
        photos: [
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01unbotu1necrgbhzit_4611686018427381938-0-ratejpg_960x960jpg_-20260506043434-_aybo.webp",
          "https://w.ladicdn.com/5f73f7fe63007e44c1a42d50/o1cn01lg6bbm1gz2n54ursa_4611686018427385387-0-ratejpg_960x960jpg_-20260506043443-uazgg.webp",
        ],
      },
    ],
  },
  policies: [
    {
      title: "Hình thức thanh toán",
      items: ["COD", "Thanh toán bằng tiền mặt"],
    },
    {
      title: "Chính sách đổi trả",
      items: ["Trong vòng 7 ngày", "Hủy đơn dễ dàng", "Hoàn hàng miễn phí"],
    },
  ],
  promo: {
    discountLabel: "50%",
    ctaLabel: "Mua ngay",
  },
  footer: {
    badgeImage:
      "https://w.ladicdn.com/s1650x1050/5c7362c6c417ab07e5196b05/14-20231005065247-nn07j.png",
    platformIcon: "https://w.ladicdn.com/s350x350/5c7362c6c417ab07e5196b05/df-20191029092328.png",
  },
};

/** Registry — add new hair products here */
export const PRODUCT_REGISTRY: Record<string, HairLandingConfig> = {
  ldp01: tocDuoiNguaHanQuoc,
  "toc-duoi-ngua-han-quoc": tocDuoiNguaHanQuoc,
};

export const DEFAULT_PRODUCT_SLUG = "ldp01";

export function resolveProduct(slug?: string | null): HairLandingConfig {
  const key = slug && PRODUCT_REGISTRY[slug] ? slug : DEFAULT_PRODUCT_SLUG;
  return mapConfigAssets(PRODUCT_REGISTRY[key]);
}
