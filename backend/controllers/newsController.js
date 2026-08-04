const { crawlNews } = require("../services/newsCrawler");

/**
 * Lấy danh sách tin tức từ website CTUET.
 *
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<void>}
 */
exports.getNews = async (req, res) => {
    try {
        const news = await crawlNews();

        res.json(Array.isArray(news) ? news : []);
    } catch (error) {
        console.error("News fetch error:", error.message);

        res.json([]);
    }
};