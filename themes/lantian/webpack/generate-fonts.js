const Fontmin = require('fontmin')
const path = require('path')

module.exports.generateFonts = function (
  filename,
  text,
  dest = path.join(__dirname, 'assets/res'),
  eot = false,
  svg = false,
  ttf = false,
  woff = true,
  woff2 = true
) {
  const cb = function (err, files) {
    if (err) {
      throw err
    }
  }

  if (eot) {
    new Fontmin()
      .use(Fontmin.glyph({ text }))
      .use(Fontmin.ttf2eot())
      .src(filename)
      .dest(dest)
      .run(cb)
  }

  if (svg) {
    new Fontmin()
      .use(Fontmin.glyph({ text }))
      .use(Fontmin.ttf2svg())
      .src(filename)
      .dest(dest)
      .run(cb)
  }

  if (ttf) {
    new Fontmin().use(Fontmin.glyph({ text })).src(filename).dest(dest).run(cb)
  }

  if (woff) {
    new Fontmin()
      .use(Fontmin.glyph({ text }))
      .use(Fontmin.ttf2woff({ deflate: true }))
      .src(filename)
      .dest(dest)
      .run(cb)
  }

  if (woff2) {
    new Fontmin()
      .use(Fontmin.glyph({ text }))
      .use(Fontmin.ttf2woff2())
      .src(filename)
      .dest(dest)
      .run(cb)
  }
}
