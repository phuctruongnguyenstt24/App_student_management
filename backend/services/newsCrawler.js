const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://ctuet.edu.vn";
const NEWS_URL = "https://ctuet.edu.vn/?controller=News&action=news&M_Ma=142";
const PAGINATION_URL = "https://ctuet.edu.vn/API/block_new_pagination.php";

const cleanText = (value) =>
    (value || "")
        .replace(/\s+/g, " ")
        .replace(/\u00a0/g, " ")
        .trim();

const normalizeUrl = (href) => {
    if (!href) return null;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return null;
    if (href.startsWith("http://") || href.startsWith("https://")) return href;
    if (href.startsWith("/")) return `${BASE_URL}${href}`;
    return new URL(href, BASE_URL).toString();
};

const isLikelyNewsLink = (href, title) => {
    const text = cleanText(title).toLowerCase();
    const lowerHref = (href || "").toLowerCase();

    return (
        lowerHref.includes("controller=news") ||
        lowerHref.includes("news") ||
        lowerHref.includes("thong-bao") ||
        lowerHref.includes("tuyen-dung") ||
        lowerHref.includes("cong-khai") ||
        lowerHref.includes(".html") ||
        text.includes("tin") ||
        text.includes("thông báo") ||
        text.includes("tuyển dụng") ||
        text.includes("công khai")
    );
};

const crawlNews = async () => {
    try {
        const response = await axios.post(
            PAGINATION_URL,
            new URLSearchParams({
                page: "1",
                sotin1trang: "",
                LM_Ma: "",
                M_Ma: "142",
                search: ""
            }),
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 10000
            }
        );

        const $ = cheerio.load(response.data);
        const articles = [];
        const seen = new Set();

        $(".block").each((_, block) => {
            // Extract the title link, description, and date from the block (lấy link tiêu đề, mô tả và ngày từ block(website gốc))
            const titleLink = $(block).find(".text-left h4 a").first();
            const description = $(block).find(".text-left p").first().text();
            const date = $(block).find(".button .float-right").first().text();
            // Normalize the URL and clean the title (làm sạch tiêu đề và chuẩn hóa URL)
            const href = titleLink.attr("href");
            const title = titleLink.text();
            const cleanedTitle = cleanText(title);
            const normalizedUrl = normalizeUrl(href);
            // Extract the image URL (lấy URL hình ảnh từ block(website gốc))
            const image = $(block).find("img").first().attr("src");
            const normalizedImage = normalizeUrl(image);// chuẩn hóa URL hình ảnh
            if (!cleanedTitle || !normalizedUrl || !isLikelyNewsLink(href, cleanedTitle)) {
                return;
            }

            if (seen.has(normalizedUrl)) {
                return;
            }

            seen.add(normalizedUrl);

            // push the article to the articles array (đẩy bài viết(gồm các thuộc tính bên dưới) vào mảng articles)
            articles.push({
                title: cleanedTitle,
                url: normalizedUrl,
                description: cleanText(description),
                publishedAt: cleanText(date),
                image: normalizedImage,   // chuẩn hóa URL hình ảnh
                source: BASE_URL
            });
        });

        return articles.slice(0, 10);
    } catch (error) {
        console.error("News crawler error:", error.message);
        return [];
    }
};

module.exports = {
    crawlNews
};