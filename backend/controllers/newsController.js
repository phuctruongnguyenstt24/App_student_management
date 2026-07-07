const { crawlNews } = require("../services/newsCrawler");

exports.getNews = async (req, res) => {
    try {
        const news = await crawlNews();
        res.json(Array.isArray(news) ? news : []);
    } catch (error) {
        console.error("News fetch error:", error.message);
        res.json([]);
    }
};