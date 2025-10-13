// controllers/uploadController.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { calculateFileHash } = require("../utils/hashUtils");
const { addAddon, getAddonByHash } = require("../utils/fileUtils");

// Directorios
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const ADDONS_DIR = path.join(UPLOADS_DIR, "addons");
const IMAGES_DIR = path.join(UPLOADS_DIR, "images");

[UPLOADS_DIR, ADDONS_DIR, IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "file") cb(null, ADDONS_DIR);
    else if (file.fieldname.startsWith("image")) cb(null, IMAGES_DIR);
    else cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".mcaddon", ".zip", ".rar", ".mcpack"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "file" && !allowed.includes(ext))
      return cb(new Error("Solo se permiten .mcaddon, .zip, .rar, .mcpack"));
    if (file.fieldname.startsWith("image") && !file.mimetype.startsWith("image/"))
      return cb(new Error("Solo se permiten archivos de imagen"));
    cb(null, true);
  }
});

// Controlador principal: subir addon
async function uploadAddon(req, res) {
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image0", maxCount: 1 },
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 }
  ])(req, res, async err => {
    try {
      if (err) throw err;
      if (!req.files || !req.files.file) {
        return res.status(400).json({ success: false, error: "No se subió ningún archivo" });
      }

      const mainFile = req.files.file[0];

      // Calcular hash
      const fileHash = await calculateFileHash(mainFile.path);

      // Verificar duplicado
      if (getAddonByHash(fileHash)) {
        fs.unlinkSync(mainFile.path);
        return res.status(409).json({
          success: false,
          error: "Este addon ya existe en el sistema."
        });
      }

      const { name, author, description, type } = req.body;
      if (!name || !description)
        return res.status(400).json({ success: false, error: "Faltan campos requeridos" });

      // Procesar imágenes
      const images = [];
      for (let i = 0; i < 5; i++) {
        const field = `image${i}`;
        if (req.files[field]) {
          const file = req.files[field][0];
          images.push({ filename: file.filename, path: `/uploads/images/${file.filename}` });
        }
      }

      // Crear objeto addon
      const addon = {
        id: Date.now().toString(),
        fileHash,
        fileName: mainFile.filename,
        originalName: mainFile.originalname,
        filePath: `/uploads/addons/${mainFile.filename}`,
        size: mainFile.size,
        name,
        author: author || "Anónimo",
        description,
        type: type || "complete",
        images,
        uploadDate: new Date().toISOString(),
        downloads: 0,
        views: 0
      };

      // Guardar en la base de datos
      addAddon(addon);

      res.json({
        success: true,
        message: "Addon subido con éxito",
        addon
      });
    } catch (error) {
      console.error("❌ Error al subir addon:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = { uploadAddon };

