// controllers/statsController.js
const { getStats } = require("../utils/fileUtils");

function getStatsHandler(req, res) {
  try {
    const stats = getStats();

    res.json({
      success: true,
      stats: {
        totalAddons: stats.totalAddons,
        totalDownloads: stats.totalDownloads,
        totalViews: stats.totalViews
      }
    });
  } catch (error) {
    console.error("❌ Error en getStatsHandler:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas"
    });
  }
}

module.exports = { getStats: getStatsHandler };

