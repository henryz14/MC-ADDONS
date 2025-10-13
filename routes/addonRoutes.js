const express = require("express");
const router = express.Router();
const addonController = require("../controllers/addonController");

router.get("/", addonController.getAllAddons);
router.get("/:id", addonController.getAddonById);
router.post("/download/:id", addonController.incrementDownload);
router.delete("/:id", addonController.deleteAddon);

module.exports = router;
