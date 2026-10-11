var express = require('express');
var router = express.Router();
const apiRoutes = require("./api/index");

router.get("/ping", async function (req, res) {
    res.send("pong");
});

// Google's renderer must be able to call the API to draw the site's pages
// (robots.txt rules apply to those fetches too); X-Robots-Tag keeps the JSON
// responses themselves out of search results.
router.get("/robots.txt", function (req, res) {
    res.type("text/plain").send("User-agent: *\nAllow: /\n");
});

router.use("/api", function (req, res, next) {
    res.set("X-Robots-Tag", "noindex");
    next();
}, apiRoutes);

module.exports = router;