function buildFileInfo(file, domainUrl) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `${domainUrl}/i/${file.filename}`
  };
}

module.exports = { buildFileInfo };
