// controllers/addonController.js
const fs = require("fs");
const path = require("path");
const {
  getAllAddons,
  getAddonById,
  deleteAddon,
  incrementDownload,
  incrementView
} = require("../utils/fileUtils");

function getAllAddonsHandler(req, res) {
  try {
    const addons = getAllAddons();
    res.json({ success: true, addons, total: addons.length });
  } catch (error) {
    console.error("❌ Error en getAllAddonsHandler:", error);
    res.status(500).json({ success: false, error: "Error al obtener addons" });
  }
}

function getAddonByIdHandler(req, res) {
  try {
    const addon = getAddonById(req.params.id);
    if (!addon)
      return res.status(404).json({ success: false, error: "Addon no encontrado" });

    // Incrementar vistas y devolver addon actualizado
    incrementView(addon.id);
    const updatedAddon = getAddonById(addon.id);

    res.json({ success: true, addon: updatedAddon });
  } catch (error) {
    console.error("❌ Error en getAddonByIdHandler:", error);
    res.status(500).json({ success: false, error: "Error al obtener addon" });
  }
}

function incrementDownloadHandler(req, res) {
  try {
    const addon = getAddonById(req.params.id);
    if (!addon)
      return res.status(404).json({ success: false, error: "Addon no encontrado" });

    // Incrementar descargas y devolver addon actualizado
    incrementDownload(addon.id);
    const updatedAddon = getAddonById(addon.id);

    res.json({
      success: true,
      message: "Descarga registrada",
      downloads: updatedAddon.downloads
    });
  } catch (error) {
    console.error("❌ Error en incrementDownloadHandler:", error);
    res.status(500).json({ success: false, error: "Error al registrar descarga" });
  }
}

function deleteAddonHandler(req, res) {
  try {
    const addon = getAddonById(req.params.id);
    if (!addon)
      return res.status(404).json({ success: false, error: "Addon no encontrado" });

    // Borrar archivos físicos
    const base = path.join(__dirname, "../");
    if (addon.filePath && fs.existsSync(base + addon.filePath))
      fs.unlinkSync(base + addon.filePath);

    addon.images.forEach(img => {
      if (img.path && fs.existsSync(base + img.path))
        fs.unlinkSync(base + img.path);
    });

    deleteAddon(req.params.id);
    res.json({ success: true, message: "Addon eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error en deleteAddonHandler:", error);
    res.status(500).json({ success: false, error: "Error al eliminar addon" });
  }
}

module.exports = {
  getAllAddons: getAllAddonsHandler,
  getAddonById: getAddonByIdHandler,
  incrementDownload: incrementDownloadHandler,
  deleteAddon: deleteAddonHandler
};

