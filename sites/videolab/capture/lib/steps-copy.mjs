/**
 * Guide step copy (VI + EN). capture.mjs turns this into site/content/steps.json:
 *   - `scene`     → shot "shots/<scene>.webp" (step dropped if that scene produced no shot)
 *   - `highlight` → CSS selector or (page) => Locator; its box is measured live and stored as
 *                   % of the shot (relative to the dialog clip for dialog shots).
 * Copy describes exactly what the user clicks in the real UI (labels as shown in the app).
 */
const dialog = "[role=dialog]";
/** Innermost container holding a directory search box and its table (Inputs / Outputs pane). */
const dirPane = (p, placeholder) =>
  p
    .locator("div, section")
    .filter({ has: p.locator(`input[placeholder^="${placeholder}"]`) })
    .filter({ has: p.locator("table") })
    .last();

export const STEPS = [
  {
    id: "install",
    scene: "install-open",
    chapter: "install",
    title_vi: "Cài đặt và mở Video Lab",
    body_vi:
      "Tải bộ cài Video Lab (.exe) từ trang GitHub Releases và chạy để cài như ứng dụng Windows thông thường. Mở Video Lab từ Start menu — worker FFmpeg tự khởi động cùng app, thanh bên trái có Studio, Mixer, Encode và System. Bản mới được cập nhật tự động.",
    title_en: "Install and open Video Lab",
    body_en:
      "Download the Video Lab installer (.exe) from GitHub Releases and run it like any Windows app. Launch Video Lab from the Start menu — the FFmpeg worker starts with it, and the left sidebar holds Studio, Mixer, Encode and System. New versions update automatically.",
    highlight: "nav",
  },
  {
    id: "studio-output",
    scene: "studio-output-settings",
    chapter: "studio",
    title_vi: "Chọn khung hình xuất",
    body_vi:
      "Trong Studio, bấm Settings ở góc phải trên, mục Output. Chọn Frame 9:16 cho video dọc, Video Export Length = Fit để thời lượng ảnh khớp giọng đọc, rồi bấm Save.",
    title_en: "Pick the output frame",
    body_en:
      "In Studio, click Settings (top right) and open Output. Choose Frame 9:16 for vertical video and Video Export Length = Fit so image timing follows the narration, then click Save.",
    highlight: (p) =>
      p
        .locator(`${dialog} div`)
        .filter({ has: p.getByText("Frame", { exact: true }) })
        .filter({ has: p.getByRole("button", { name: "9:16", exact: true }) })
        .last(),
  },
  {
    id: "studio-images",
    scene: "studio-images",
    chapter: "studio",
    title_vi: "Thêm ảnh vào Image Library",
    body_vi:
      "Bấm Upload trong khung Image Library và chọn ảnh PNG, JPG hoặc WebP (có thể chọn nhiều ảnh cùng lúc). Ảnh xuất hiện trong lưới thư viện bên phải; nút Folder và Drive dùng để nhập cả thư mục hoặc Google Drive.",
    title_en: "Add images to the Image Library",
    body_en:
      "Click Upload in the Image Library panel and pick PNG, JPG or WebP files (multi-select works). They appear in the library grid; Folder and Drive import a whole folder or a Google Drive link.",
    highlight: (p) => p.locator("button", { hasText: /^\s*Upload\s*$/ }).first(),
  },
  {
    id: "studio-keyframe",
    scene: "studio-keyframe",
    chapter: "studio",
    title_vi: "Đưa ảnh vào Keyframe",
    body_vi:
      "Bấm Select để chọn tất cả ảnh, rồi bấm Add to Keyframe. Mỗi ảnh thành một cảnh (S1, S2…) trên dòng thời gian; kéo để đổi thứ tự, chỉnh Transition, Effect và Duration ngay trong bảng.",
    title_en: "Send images to the Keyframe timeline",
    body_en:
      "Click Select to pick every image, then Add to Keyframe. Each image becomes a scene (S1, S2…) on the timeline; drag to reorder and set Transition, Effect and Duration right in the table.",
    highlight: (p) => p.locator("div", { hasText: /^\s*Keyframe/ }).filter({ has: p.locator("table") }).last(),
  },
  {
    id: "studio-script",
    scene: "studio-script",
    chapter: "studio",
    title_vi: "Dán kịch bản",
    body_vi:
      "Dán lời thoại vào ô Paste script trong khung Script. Video Lab đếm số chữ, ước lượng thời gian đọc và tự chia lời thoại vào từng cảnh trong cột Transcript.",
    title_en: "Paste the script",
    body_en:
      "Paste your narration into the Paste script box in the Script panel. Video Lab counts words, estimates read time and spreads the text across scenes in the Transcript column.",
    highlight: (p) => p.locator(".hub-card", { has: p.locator('textarea[placeholder^="Paste script"]') }).first(),
  },
  {
    id: "studio-voice",
    scene: "studio-voice",
    chapter: "studio",
    title_vi: "Chọn giọng đọc",
    body_vi:
      "Trong khung Audio, gõ tên giọng hoặc mã ngôn ngữ (ví dụ vi-VN) vào ô tìm kiếm, rồi bấm vào giọng muốn dùng — có 322 giọng đọc. Bấm nút ▶ để nghe thử và kéo thanh Speed để chỉnh tốc độ.",
    title_en: "Choose a voice",
    body_en:
      "In the Audio panel, type a voice name or locale (e.g. vi-VN) into search and click the voice you want — 322 voices are available. Press ▶ to preview and drag Speed to adjust the pace.",
    highlight: (p) => p.locator(".hub-card", { has: p.locator('input[placeholder*="Search voice" i]') }).first(),
  },
  {
    id: "studio-export",
    scene: "studio-export",
    chapter: "studio",
    title_vi: "Xuất video và gửi sang Mixer",
    body_vi:
      "Bấm Export & Download: worker đọc giọng, ghép ảnh và render MP4, tiến độ hiện ngay trên khung Preview. Khi xong, bấm Send to Mixer để đưa video vừa xuất vào Mixer làm clip Main.",
    title_en: "Export and send to Mixer",
    body_en:
      "Click Export & Download: the worker synthesizes the voice, composes the images and renders an MP4 with live progress in Preview. When it finishes, click Send to Mixer to add the video as a Main clip.",
    highlight: (p) => p.locator(".hub-card", { has: p.locator("button", { hasText: /Export\s*&\s*Download/ }) }).last(),
  },
  {
    id: "mixer-add",
    scene: "mixer-add-inputs",
    chapter: "mixer",
    title_vi: "Thêm clip Intro, Main, Outro",
    body_vi:
      "Mở Mixer, bấm New. Ở cột trái chọn Main, Intro hoặc Outro, bấm Browse và chọn video cho từng nhóm. Bấm Save để thêm vào bảng, rồi Close.",
    title_en: "Add Intro, Main and Outro clips",
    body_en:
      "Open Mixer and click New. Pick Main, Intro or Outro on the left, click Browse and choose the videos for each group. Click Save to add them to the table, then Close.",
    highlight: `${dialog} .hub-toc-nav`,
  },
  {
    id: "mixer-inputs",
    scene: "mixer-inputs",
    chapter: "mixer",
    title_vi: "Kiểm tra danh sách đầu vào",
    body_vi:
      "Bảng Inputs tự đọc thời lượng, dung lượng, định dạng và độ phân giải của từng clip. Clip có Action = Ready ghép được ngay bằng stream copy, không cần encode lại.",
    title_en: "Check the input list",
    body_en:
      "The Inputs table probes each clip's duration, size, format and resolution. Clips marked Action = Ready can be joined straight away with stream copy — no re-encode.",
    highlight: (p) => dirPane(p, "Search inputs"),
  },
  {
    id: "mixer-settings",
    scene: "mixer-settings",
    chapter: "mixer",
    title_vi: "Cài đặt cách ghép",
    body_vi:
      "Trong khung Setting: Mix mode chọn Sequential hoặc Random cho Main, Intro, Outro; Counts đặt số clip Main mỗi video và Total số video cần tạo; Workers đặt số video chạy song song. Ở Output, nhập Directory để chọn thư mục lưu.",
    title_en: "Set up the mix",
    body_en:
      "In Setting: Mix mode picks Sequential or Random for Main, Intro and Outro; Counts sets Main clips per video and the Total number of videos; Workers sets how many run in parallel. Under Output, enter a Directory for the results.",
    highlight: ".stealth-runtime-setting",
  },
  {
    id: "mixer-start",
    scene: "mixer-running",
    chapter: "mixer",
    title_vi: "Bấm Start và theo dõi tiến độ",
    body_vi:
      "Bấm Start. Mỗi video đầu ra hiện một dòng trong bảng Outputs với trạng thái Queued → Running, phần trăm tiến độ và chiến lược (Copy = ghép không encode lại). Pause hoặc Cancel để dừng giữa chừng.",
    title_en: "Click Start and watch progress",
    body_en:
      "Click Start. Every output gets a row in the Outputs table moving from Queued to Running, with a progress percentage and strategy (Copy = joined without re-encoding). Use Pause or Cancel to stop mid-run.",
    highlight: (p) => dirPane(p, "Search outputs"),
  },
  {
    id: "mixer-results",
    scene: "mixer-done",
    chapter: "mixer",
    title_vi: "Xem kết quả và lịch sử",
    body_vi:
      "Khi xong, các dòng chuyển Done kèm thời lượng và dung lượng; bấm biểu tượng thư mục cạnh tên để mở file. Khung History lưu từng lượt chạy — rê chuột lên chấm để xem chi tiết, bấm vào một dòng để xem các clip đã ghép.",
    title_en: "Review results and history",
    body_en:
      "When finished, rows turn Done with duration and size; click the folder icon next to a name to open the file. History keeps every run — hover a dot for details, or click a row to see which clips were joined.",
    highlight: ".video-lab-history-frame",
  },
  {
    id: "encode-setup",
    scene: "encode-settings",
    chapter: "encode",
    title_vi: "Encode: thêm video và chọn profile",
    body_vi:
      "Mở Encode, bấm New → Browse để chọn video, rồi Save. Ở Setting chọn Profile (Vertical 9:16, Landscape 16:9, Square, 4K hoặc Keep source), số Workers và Location: Beside source hoặc Custom folder.",
    title_en: "Encode: add videos and pick a profile",
    body_en:
      "Open Encode, click New → Browse to pick videos, then Save. In Setting choose a Profile (Vertical 9:16, Landscape 16:9, Square, 4K or Keep source), the Workers count and Location: Beside source or Custom folder.",
    highlight: ".stealth-runtime-setting",
  },
  {
    id: "encode-results",
    scene: "encode-results",
    chapter: "encode",
    title_vi: "Bấm Start và nhận kết quả",
    body_vi:
      "Bấm Start: từng video hiện tiến độ Encoding trong bảng Outputs và báo Encode complete khi xong. Kết quả được ghi nhớ để lần ghép sau dùng lại bằng stream copy thay vì encode lại.",
    title_en: "Click Start and collect the results",
    body_en:
      "Click Start: each video shows Encoding progress in the Outputs table and an Encode complete notice at the end. Results are remembered so the next mix can reuse them with stream copy instead of re-encoding.",
    highlight: (p) => dirPane(p, "Search outputs"),
  },
  {
    id: "system",
    scene: "system",
    chapter: "system",
    title_vi: "System: thông tin worker",
    body_vi:
      "Tab System cho biết địa chỉ worker (API :8029), stack giao diện và pipeline FFmpeg đang dùng. Khi Mixer hay Encode báo lỗi kết nối, kiểm tra ở đây trước.",
    title_en: "System: worker info",
    body_en:
      "The System tab shows the worker address (API :8029), the UI stack and the FFmpeg pipeline in use. If Mixer or Encode reports a connection error, check here first.",
    highlight: (p) =>
      p.locator("div, section").filter({ has: p.getByText("Worker", { exact: true }) }).filter({ hasText: "Pipeline" }).last(),
  },
];
