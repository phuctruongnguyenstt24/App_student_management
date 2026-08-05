/**
 * Định nghĩa các API liên quan đến tin tức.
 */

const express = require("express");

const router = express.Router();

const newsController = require("../controllers/newsController");

router.get("", newsController.getNews);
router.get("/", newsController.getNews);

module.exports = router;