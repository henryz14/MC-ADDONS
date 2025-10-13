// utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const db = require("../db/database");

/* ============================================================
   🔹 INSERTAR NUEVO ADDON
   ------------------------------------------------------------ */
function addAddon(addon) {
  const stmt = db.prepare(`
    INSERT INTO addons (
      id, name, author, description, type, fileHash, fileName, originalName,
      filePath, size, images, uploadDate, downloads, views
    )
    VALUES (@id, @name, @author, @description, @type, @fileHash,
            @fileName, @originalName, @filePath, @size, @images,
            @uploadDate, @downloads, @views)
  `);

  stmt.run({
    ...addon,
    images: JSON.stringify(addon.images || [])
  });
}

/* ============================================================
   🔹 OBTENER TODOS LOS ADDONS (con limpieza automática)
   ------------------------------------------------------------ */
function getAllAddons() {
  const base = path.join(__dirname, "../");
  const addons = db.prepare("SELECT * FROM addons ORDER BY uploadDate DESC").all();

  addons.forEach(addon => {
    const filePath = addon.filePath ? path.join(base, addon.filePath) : null;
    const fileExists = filePath && fs.existsSync(filePath);

    // Si el archivo principal no existe, se borra el registro
    if (!fileExists) {
      console.warn(`⚠️ Archivo faltante: ${addon.fileName || addon.id} — eliminado de la base`);
      db.prepare("DELETE FROM addons WHERE id = ?").run(addon.id);
      return;
    }

    // Limpieza de imágenes faltantes
    const imgs = JSON.parse(addon.images || "[]");
    const validImgs = imgs.filter(img => {
      const imgPath = path.join(base, img.path || "");
      const exists = fs.existsSync(imgPath);
      if (!exists) console.warn(`⚠️ Imagen faltante: ${img.path} — eliminada del registro`);
      return exists;
    });

    // Si alguna imagen se eliminó, actualizar el registro en la base
    if (validImgs.length !== imgs.length) {
      db.prepare("UPDATE addons SET images = ? WHERE id = ?")
        .run(JSON.stringify(validImgs), addon.id);
    }
  });

  // Volver a leer la lista limpia
  const validAddons = db.prepare("SELECT * FROM addons ORDER BY uploadDate DESC").all();

  return validAddons.map(a => ({
    ...a,
    images: JSON.parse(a.images || "[]")
  }));
}

/* ============================================================
   🔹 OBTENER UN ADDON POR ID
   ------------------------------------------------------------ */
function getAddonById(id) {
  const addon = db.prepare("SELECT * FROM addons WHERE id = ?").get(id);
  return addon ? { ...addon, images: JSON.parse(addon.images || "[]") } : null;
}

/* ============================================================
   🔹 OBTENER UN ADDON POR HASH (para detectar duplicados)
   ------------------------------------------------------------ */
function getAddonByHash(hash) {
  const addon = db.prepare("SELECT * FROM addons WHERE fileHash = ?").get(hash);
  return addon ? { ...addon, images: JSON.parse(addon.images || "[]") } : null;
}

/* ============================================================
   🔹 ELIMINAR UN ADDON COMPLETAMENTE
   ------------------------------------------------------------ */
function deleteAddon(id) {
  const addon = getAddonById(id);
  if (addon) {
    const base = path.join(__dirname, "../");

    // Borrar archivo principal
    if (addon.filePath && fs.existsSync(path.join(base, addon.filePath))) {
      fs.unlinkSync(path.join(base, addon.filePath));
    }

    // Borrar imágenes asociadas
    addon.images.forEach(img => {
      const imgPath = path.join(base, img.path || "");
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    });

    // Eliminar de la base
    db.prepare("DELETE FROM addons WHERE id = ?").run(id);
  }
}

/* ============================================================
   🔹 INCREMENTAR DESCARGAS Y VISTAS
   ------------------------------------------------------------ */
function incrementDownload(id) {
  db.prepare("UPDATE addons SET downloads = downloads + 1 WHERE id = ?").run(id);
}

function incrementView(id) {
  db.prepare("UPDATE addons SET views = views + 1 WHERE id = ?").run(id);
}

/* ============================================================
   🔹 OBTENER ESTADÍSTICAS GLOBALES
   ------------------------------------------------------------ */
function getStats() {
  const addons = db.prepare("SELECT * FROM addons").all();

  return {
    totalAddons: addons.length,
    totalDownloads: addons.reduce((a, b) => a + (b.downloads || 0), 0),
    totalViews: addons.reduce((a, b) => a + (b.views || 0), 0),
    mostDownloaded: [...addons].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    recentUploads: [...addons].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 5)
  };
}

/* ============================================================
   🔹 EXPORTAR FUNCIONES
   ------------------------------------------------------------ */
module.exports = {
  addAddon,
  getAllAddons,
  getAddonById,
  getAddonByHash,
  deleteAddon,
  incrementDownload,
  incrementView,
  getStats
};

